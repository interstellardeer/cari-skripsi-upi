# CariSkripsi UPI

**Semantic search engine for Universitas Pendidikan Indonesia's thesis repository**

A web application that enables authenticated UPI users to discover relevant academic works from ~91,000 theses, dissertations, and research papers using **semantic search** or **natural language queries** powered by vector embeddings and LLM synthesis.

---

## Features

### Semantic Search
- Type a query, instantly get ranked results matched via cosine similarity
- Filter by year range, academic division, or keywords
- Fast, deterministic results with similarity scores

### Natural Language Search
- Ask conversational questions in Indonesian or English
- LLM reformulates your query for optimal retrieval
- AI synthesizes a comprehensive response with inline citations to relevant theses
- Streaming responses via Vercel AI SDK

### Secure & Gated
- Google OAuth authentication with `@upi.edu` domain restriction
- JWT-based sessions (no database required)
- Per-user rate limiting to protect API costs

### Rich Metadata
Each result displays:
- Title, abstract snippet, and author(s)
- Publication year and academic division
- Direct link to original document
- Keywords and similarity score (semantic search)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun | Fast JavaScript runtime, package manager |
| **Monorepo** | Bun Workspaces | Three coordinated packages |
| **Web Framework** | Next.js 15 (App Router) | React SSR + API routes |
| **Vector DB** | Qdrant Cloud | Semantic search engine |
| **Embedding + LLM** | OpenRouter API | Unified AI provider for embeddings and chat |
| **AI Streaming** | Vercel AI SDK | Real-time response streaming |
| **Authentication** | NextAuth.js v4 | Google OAuth for `@upi.edu` |
| **Rate Limiting** | Vercel KV (Redis) | Per-user request quotas |
| **Testing** | Vitest | Unit and integration tests |
| **Deployment** | Vercel | Serverless hosting |

---

## Architecture

### Monorepo Structure

```
cari-skripsi-upi/
├── package.json                    # Workspace root (Bun)
│
├── database/                       # One-time ingestion pipeline
│   ├── src/
│   │   ├── download.ts            # Fetch parquet from Kaggle
│   │   ├── parse.ts               # Parse into typed records
│   │   ├── embed.ts               # Generate embeddings (OpenRouter)
│   │   ├── ingest.ts              # Upload to Qdrant Cloud
│   │   └── index.ts               # Orchestrator
│   └── tests/
│
├── service/                        # Shared library (consumed by ui/)
│   ├── src/
│   │   ├── qdrant.ts              # Qdrant client wrapper
│   │   ├── embedding.ts           # OpenRouter embedding client
│   │   ├── search.ts              # Search logic & orchestration
│   │   ├── types.ts               # Shared TypeScript types
│   │   └── index.ts               # Public API
│   └── tests/
│
└── ui/                             # Next.js frontend + API
    ├── app/
    │   ├── layout.tsx              # Root layout with auth provider
    │   ├── page.tsx                # Landing page
    │   ├── api/
    │   │   ├── auth/[...nextauth]/ # Google OAuth handler
    │   │   ├── search/route.ts     # Semantic search endpoint
    │   │   └── chat/route.ts       # NL search endpoint (streaming)
    │   └── (protected)/
    │       └── search/page.tsx     # Main search interface
    ├── components/                 # React components
    ├── lib/auth.ts                 # NextAuth config
    ├── lib/rate-limit.ts           # Vercel KV rate limiter
    ├── middleware.ts               # Auth + rate limit middleware
    └── tests/
```

### Data Flow

**Ingestion (One-time):**
```
Kaggle Parquet → Parse → Embed (OpenRouter) → Qdrant Cloud
```

**Semantic Search:**
```
Query → Embed → Qdrant similarity search → Ranked results
```

**Natural Language Search:**
```
Prompt → LLM (query reformulation)
       → Embed refined query
       → Qdrant search
       → LLM (synthesize response with citations)
       → Stream response
```

---

## Dataset

**Source:** [Kaggle — Repository Universitas Pendidikan Indonesia 2025](https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025)

**Coverage:**
- ~91,000 theses, dissertations, and research papers
- 31,000 parallel Indonesian-English abstract pairs
- 91,000 labeled records for classification
- ~149 MB compressed

**Embedded Fields:**
- `title + " — " + abstract` (uses English translation when available for better embedding quality)

**Indexed Metadata:**
- Author(s), year, division/faculty, URL, keywords
- Year and division are Qdrant payload indexes for filtering

**License:** CC BY-SA 4.0 — attribution required

---

## Installation

### Prerequisites
- [Bun](https://bun.sh) (latest)
- Node.js 18+ (for compatibility tooling)
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/cari-skripsi-upi.git
   cd cari-skripsi-upi
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the `ui/` directory:
   ```env
   # OpenRouter (embeddings + LLM)
   OPENROUTER_API_KEY=your_key_here
   EMBEDDING_MODEL=openai/text-embedding-3-small

   # Qdrant Cloud
   QDRANT_URL=https://your-qdrant-instance.qdrant.io
   QDRANT_API_KEY=your_key_here

   # NextAuth.js
   NEXTAUTH_SECRET=your_secret_here
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_secret_here

   # Vercel KV (rate limiting)
   KV_REST_API_URL=https://your-kv-instance.vercel.sh
   KV_REST_API_TOKEN=your_token_here
   ```

---

## Usage

### Development

```bash
# Start Next.js dev server
bun run dev

# Run tests
bun run test

# Build for production
bun run build
```

### API Endpoints

#### `POST /api/search`
Semantic search.

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pembelajaran berbasis proyek di sekolah dasar",
    "limit": 10,
    "filters": {
      "yearFrom": 2020,
      "division": "Pendidikan Dasar"
    }
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "thesis-001",
      "title": "...",
      "abstract": "...",
      "authors": ["..."],
      "year": 2023,
      "division": "Pendidikan Dasar",
      "url": "...",
      "keywords": ["..."],
      "score": 0.87
    }
  ],
  "total": 142,
  "queryTime": 234
}
```

#### `POST /api/chat`
Natural language search with streaming response.

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Apa saja penelitian terbaru tentang dampak AI terhadap pendidikan?"
      }
    ]
  }'
```

**Response:** Streamed markdown text with inline citations.

---

## Authentication

- **Provider:** Google OAuth 2.0
- **Domain Restriction:** Only `@upi.edu` email addresses are allowed
- **Session Strategy:** JWT-based (NextAuth default)
- **Protected Routes:** `/search` and `/api/chat`

---

## Rate Limiting

Per-user quotas enforced via Vercel KV:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/search` | 30 requests | 1 minute |
| `/api/chat` | 10 requests | 1 minute |

Responses with `429 Too Many Requests` when exceeded.

---

## Ingestion Pipeline

To populate Qdrant Cloud with theses data:

```bash
cd database
bun run src/index.ts
```

This orchestrates:
1. **Download** — Fetch parquet files from Kaggle
2. **Parse** — Extract and normalize records
3. **Embed** — Generate vectors via OpenRouter (batched)
4. **Ingest** — Upsert into Qdrant Cloud collection `theses`

**Qdrant Collection Config:**
- Name: `theses`
- Vector size: 1536 (OpenAI text-embedding-3-small via OpenRouter)
- Distance metric: Cosine
- Indexed payloads: `year`, `division`

---

## Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

**Test Coverage:**
- `database/` — Parquet parsing, embedding batching, Qdrant format
- `service/` — Search logic, embedding client, type validation
- `ui/` — API routes (mocked), auth callbacks, rate limiter

All external services (OpenRouter, Qdrant, Vercel KV) are mocked in unit tests.

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub** and connect to Vercel
2. **Configure environment variables** in Vercel dashboard (same as `.env.local`)
3. **Deploy:**
   ```bash
   vercel deploy
   ```

The `ui/` package auto-deploys as a Next.js application. The `service/` package is bundled at build time as a workspace dependency.

---

## Shared Types

The `service/` package exports core TypeScript types:

```typescript
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
  score: number;  // Cosine similarity (0–1)
}

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  division?: string;
}
```

---

## Project Goals

✅ Enable semantic and conversational search over 91,000 UPI academic records  
✅ Provide sub-second query response times via vector similarity  
✅ Synthesize AI-powered summaries with citations  
✅ Restrict access to authenticated UPI users (`@upi.edu`)  
✅ Deploy on Vercel with cost-efficient rate limiting  
✅ Maintain code quality via comprehensive test coverage  

---

## License

The underlying dataset is **CC BY-SA 4.0**. Attribution to [Universitas Pendidikan Indonesia](https://www.upi.edu) is required when used or distributed.

The application code is open source. See `LICENSE` file for details.

---

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes with clear messages
4. Push and open a pull request
5. Ensure all tests pass and code is reviewed

---

## Support

For questions or issues, please open a [GitHub Issue](https://github.com/interstellardeer/cari-skripsi-upi/issues).

---

## Maintainers

- [@interstellardeer](https://github.com/interstellardeer)

---

**Built for UPI**
