# CariSkripsi UPI — Design Spec

**Goal:** Build a vector search application for Universitas Pendidikan Indonesia's thesis repository, enabling students and staff to find relevant academic works via semantic search or natural language prompts.

**Date:** 2026-06-19

**License:** The underlying dataset is CC BY-SA 4.0.

---

## 1. Overview

CariSkripsi UPI is a web application that lets authenticated UPI users search through ~91,000 academic records (theses, dissertations, research papers) using two modes:

1. **Semantic Search** — User types a query, it's embedded into a vector, and matched against pre-computed document vectors in Qdrant. Returns ranked results directly.
2. **Natural Language Search** — User writes a conversational prompt, an LLM reformulates it into an optimized search query, performs vector retrieval, then the LLM synthesizes and streams a response with citations using Vercel AI SDK.

## 2. Dataset

**Source:** [Kaggle — Repository Universitas Pendidikan Indonesia 2025](https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025)

**Contents:**
- **Papers:** ~91,000 cleaned/normalized records with parsed JSON fields and human-readable division names
- **Translation:** 31,000 parallel Indonesian-English abstract pairs
- **Classification:** 91,000 labeled records for document classification

**Format:** Parquet files (~149MB compressed)

**Fields used:**

| Field | Purpose | Embedded? |
|-------|---------|-----------|
| Title | Display + embedded | ✅ Combined |
| Abstract | Display + embedded | ✅ Combined |
| Author(s) | Display + Qdrant payload | ❌ |
| Year | Display + Qdrant payload (filterable) | ❌ |
| Division/Faculty/Prodi | Display + Qdrant payload (filterable) | ❌ |
| URL | Display (link to original document) | ❌ |
| Keywords | Display + Qdrant payload | ❌ |

**Embedding strategy:** `title + " — " + abstract` concatenated. English translation used when available for better embedding quality. All other fields stored as Qdrant payload for filtering and display.

## 3. Architecture

### 3.1 Monorepo Structure

```
cari-skripsi-upi/
├── package.json              # Workspace root (bun workspaces)
├── database/                 # One-time ingestion scripts
│   ├── package.json
│   ├── src/
│   │   ├── download.ts       # Download parquet from Kaggle
│   │   ├── parse.ts          # Parse parquet into typed records
│   │   ├── embed.ts          # Generate embeddings via OpenRouter
│   │   ├── ingest.ts         # Upload vectors + payload to Qdrant Cloud
│   │   └── index.ts          # Orchestrator: download → parse → embed → ingest
│   └── tests/
├── service/                  # Shared library (imported by ui/)
│   ├── package.json
│   ├── src/
│   │   ├── qdrant.ts         # Qdrant client wrapper
│   │   ├── embedding.ts      # OpenRouter embedding client (query-time)
│   │   ├── search.ts         # Search logic (semantic + NL search orchestration)
│   │   ├── types.ts          # Shared TypeScript types
│   │   └── index.ts          # Public API barrel export
│   └── tests/
└── ui/                       # Next.js App Router application
    ├── package.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx         # Root layout with auth provider
    │   ├── page.tsx           # Landing / search page
    │   ├── api/
    │   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js handler
    │   │   ├── search/route.ts              # Semantic search endpoint
    │   │   └── chat/route.ts                # NL search endpoint (streaming)
    │   └── (protected)/       # Auth-gated route group
    │       └── search/
    │           └── page.tsx   # Main search interface
    ├── components/            # React components
    ├── lib/
    │   ├── auth.ts            # NextAuth.js config
    │   └── rate-limit.ts      # Vercel KV rate limiter
    ├── middleware.ts           # Auth + rate limit middleware
    └── tests/
```

### 3.2 Data Flow

```
INGESTION (one-time):
  Kaggle Parquet → database/download.ts
    → database/parse.ts (extract fields)
    → database/embed.ts (OpenRouter embedding API, batched)
    → database/ingest.ts (Qdrant Cloud upsert with vectors + payload)

SEMANTIC SEARCH:
  User query → ui/api/search/route.ts
    → service/embedding.ts (embed query via OpenRouter)
    → service/qdrant.ts (similarity search)
    → Return ranked results with metadata

NATURAL LANGUAGE SEARCH:
  User prompt → ui/api/chat/route.ts
    → OpenRouter LLM (reformulate query)
    → service/embedding.ts (embed reformulated query)
    → service/qdrant.ts (similarity search)
    → OpenRouter LLM (synthesize response with citations)
    → Stream response via Vercel AI SDK
```

## 4. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Bun | latest |
| Monorepo | Bun workspaces | — |
| Vector DB | Qdrant Cloud | Free tier (1GB) |
| Embedding + LLM | OpenRouter API | — |
| Web framework | Next.js (App Router) | 15.x |
| AI streaming | Vercel AI SDK (`ai` package) | latest |
| Authentication | NextAuth.js (`next-auth`) | v4.x |
| Rate limiting | Vercel KV (`@vercel/kv`) | latest |
| Testing | Vitest | latest |
| Deployment | Vercel | — |

## 5. Authentication

### Provider
Google OAuth via NextAuth.js, configured with a Google Cloud OAuth 2.0 client.

### Domain Restriction
In the NextAuth `signIn` callback, reject any account whose email does not end with `@upi.edu`:

```typescript
callbacks: {
  async signIn({ account, profile }) {
    if (account?.provider === "google") {
      return profile?.email?.endsWith("@upi.edu") ?? false;
    }
    return false;
  },
}
```

This is a standard Google OAuth flow — no custom auth system needed. Google Workspace domains like `upi.edu` work natively.

### Session Strategy
JWT-based sessions (NextAuth default). No database needed for sessions.

## 6. Rate Limiting

### Implementation
Vercel KV (Redis-compatible) with a per-user sliding window.

### Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/search` (semantic) | 30 requests | per minute |
| `/api/chat` (NL search) | 10 requests | per minute |

NL search has a stricter limit because it makes LLM calls (more expensive).

### Enforcement
Applied in Next.js `middleware.ts` before the request reaches the API route. Returns `429 Too Many Requests` when exceeded.

## 7. Search Modes

### 7.1 Semantic Search

**Flow:** Query → Embed → Qdrant search → Return results

**Input:** A search query string (e.g., "pembelajaran berbasis proyek di sekolah dasar")

**Process:**
1. Embed the query using OpenRouter embedding model
2. Perform nearest-neighbor search in Qdrant (cosine similarity)
3. Return top-K results (default K=10) with similarity scores

**Output:** Array of `SearchResult` objects with all metadata fields + similarity score.

**Filters (optional):** Year range, division/faculty, keyword — applied as Qdrant payload filters.

### 7.2 Natural Language Search

**Flow:** Prompt → LLM → Embed refined query → Qdrant search → LLM synthesizes → Stream

**Input:** A conversational prompt (e.g., "Apa saja penelitian terbaru tentang dampak AI terhadap pendidikan di Indonesia?")

**Process:**
1. Send prompt to OpenRouter LLM to extract/reformulate a search query
2. Embed the reformulated query
3. Perform Qdrant search
4. Send retrieved documents + original prompt to LLM
5. LLM synthesizes a response with citations to specific theses
6. Stream the response back via Vercel AI SDK's `streamText`

**Output:** Streamed markdown text with inline citations referencing the retrieved documents.

## 8. API Endpoints

### `POST /api/search`
Semantic search endpoint.

```typescript
// Request
{
  query: string;
  limit?: number;         // default 10, max 50
  filters?: {
    yearFrom?: number;
    yearTo?: number;
    division?: string;
  };
}

// Response
{
  results: SearchResult[];
  total: number;
  queryTime: number;      // ms
}
```

### `POST /api/chat`
Natural language search endpoint. Returns a streaming response.

```typescript
// Request (Vercel AI SDK format)
{
  messages: Message[];     // Chat history
}

// Response: ReadableStream (Vercel AI SDK streamText format)
```

### `GET /api/auth/[...nextauth]`
NextAuth.js handler (Google OAuth flow).

## 9. Shared Types

```typescript
// service/src/types.ts

export interface ThesisRecord {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  division: string;
  url: string;
  keywords: string[];
}

export interface SearchResult extends ThesisRecord {
  score: number;           // Cosine similarity (0-1)
}

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  division?: string;
}
```

## 10. Ingestion Pipeline

The `database/` package contains one-time scripts to populate Qdrant Cloud:

1. **Download:** Fetch parquet files from Kaggle (manual download or Kaggle API)
2. **Parse:** Read parquet files using `parquet-wasm` (Bun-compatible), extract fields into `ThesisRecord[]`
3. **Embed:** Batch-embed `title + " — " + abstract` via OpenRouter embedding API (with rate limiting and retry logic). Process in batches of ~100 to stay within API limits.
4. **Ingest:** Upsert vectors + payload into Qdrant Cloud collection

**Collection config:**
- Name: `theses`
- Vector size: Depends on the chosen embedding model routed through OpenRouter (e.g., `openai/text-embedding-3-small` = 1536 dims, configurable). The specific model will be set via an environment variable `EMBEDDING_MODEL` so it can be changed without code changes.
- Distance metric: Cosine
- Payload indexes on: `year` (integer range), `division` (keyword)

## 11. UI Design

### Pages
1. **Landing page (`/`)** — App branding, "Sign in with Google" button
2. **Search page (`/search`)** — Protected, main search interface with two tabs/modes:
   - **Semantic Search tab** — Search box with instant results
   - **Natural Language tab** — Chat-like interface with streaming responses

### Search Results Display
Each result card shows:
- Title (clickable link to original document URL)
- Abstract snippet (truncated)
- Author(s), Year, Division
- Keywords as tags
- Similarity score (for semantic search)

### UI Framework
Next.js App Router with React Server Components where possible. Client components for interactive search and streaming. Styling with vanilla CSS (CSS Modules). Dark mode with modern, premium aesthetic.

## 12. Environment Variables

```env
# OpenRouter
OPENROUTER_API_KEY=
EMBEDDING_MODEL=          # e.g. openai/text-embedding-3-small

# Qdrant Cloud
QDRANT_URL=
QDRANT_API_KEY=

# NextAuth.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## 13. Testing Strategy

| Package | Framework | What to test |
|---------|-----------|-------------|
| `database/` | Vitest | Parquet parsing, embedding batching logic, Qdrant upsert formatting |
| `service/` | Vitest | Search logic, embedding client, Qdrant query construction, type validation |
| `ui/` | Vitest | API route handlers (mocked service layer), auth callback, rate limiter logic |

All external services (OpenRouter, Qdrant, Vercel KV) are mocked in unit tests. Integration tests can be run against real services with test credentials.

## 14. Deployment

- **ui/**: Deploy to Vercel (auto-detected as Next.js)
- **database/**: Run locally or in CI — not deployed as a service
- **service/**: Bundled with `ui/` at build time (workspace dependency)

## 15. Global Constraints

- Runtime: Bun (not Node.js, not npm)
- Package manager: `bun` and `bunx` only
- All API keys stored in environment variables, never committed
- Domain restriction: Only `@upi.edu` Google accounts can access the app
- Dataset license: CC BY-SA 4.0 — must be attributed in the UI
- Qdrant Cloud free tier: 1GB storage limit — monitor usage
- OpenRouter: Pay-per-use — rate limiting protects against cost overruns
