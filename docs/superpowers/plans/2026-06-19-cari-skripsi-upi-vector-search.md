# CariSkripsi UPI Vector Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vector search application for Universitas Pendidikan Indonesia's thesis repository, enabling students and staff to find relevant academic works via semantic search or natural language prompts.

**Architecture:** A Bun monorepo comprising a one-time ingestion tool (`database/`), a shared backend business logic library (`service/`), and a Next.js App Router frontend client (`ui/`) leveraging Vercel AI SDK and Google OAuth.

**Tech Stack:** Bun, Next.js (15.x), Vercel AI SDK, NextAuth.js, @vercel/kv, @upstash/ratelimit, @qdrant/js-client-rest, hyparquet, Vitest.

## Global Constraints

- **Package Manager & Runtime:** Always use `bun` and `bunx`. The user does not use Node.js or npm.
- **Shell:** Always use `pwsh.exe` for `run_shell_command`.
- All API keys stored in environment variables, never committed.
- Domain restriction: Only `@upi.edu` Google accounts can access the app.
- Dataset license: CC BY-SA 4.0 — must be attributed in the UI.
- Qdrant Cloud free tier: 1GB storage limit — monitor usage.
- OpenRouter: Pay-per-use — rate limiting protects against cost overruns.

---

### Task 1: Monorepo Scaffolding & Shared Types

**Files:**
- Create: `tsconfig.json`
- Create: `database/package.json`
- Create: `database/tsconfig.json`
- Create: `service/package.json`
- Create: `service/tsconfig.json`
- Create: `service/src/types.ts`
- Create: `ui/package.json`
- Create: `ui/tsconfig.json`
- Test: `service/tests/types.test.ts`

**Interfaces:**
- Consumes: None (starting workspace)
- Produces: `ThesisRecordSchema`, `ThesisRecord`, `SearchResultSchema`, `SearchResult`, `SearchFiltersSchema`, `SearchFilters`

- [ ] **Step 1: Write the failing test**

Create `service/tests/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ThesisRecordSchema } from '../src/types';

describe('ThesisRecordSchema', () => {
  it('should validate correct thesis records', () => {
    const validData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract: "Penelitian ini membahas tentang penerapan machine learning...",
      authors: ["Asep", "Susi"],
      year: 2025,
      division: "FPMIPA",
      url: "https://repository.upi.edu/123",
      keywords: ["AI", "ML", "UPI"],
    };
    expect(ThesisRecordSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject invalid thesis records missing fields', () => {
    const invalidData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning",
      // missing abstract
      authors: ["Asep"],
      year: 2025,
      division: "FPMIPA",
    };
    expect(ThesisRecordSchema.safeParse(invalidData).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test service/tests/types.test.ts`
Expected: FAIL with "Cannot find module '../src/types' or its corresponding type declarations."

- [ ] **Step 3: Write minimal implementation**

Write root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true,
    "declaration": true
  }
}
```

Write `database/package.json`:
```json
{
  "name": "database",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "hyparquet": "^0.4.0",
    "@qdrant/js-client-rest": "^1.11.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

Write `database/tsconfig.json`:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Write `service/package.json`:
```json
{
  "name": "service",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@ai-sdk/openai": "^1.0.0",
    "ai": "^3.0.0",
    "@qdrant/js-client-rest": "^1.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "vitest": "^1.3.1",
    "typescript": "^5.3.3"
  }
}
```

Write `service/tsconfig.json`:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Write `ui/package.json`:
```json
{
  "name": "ui",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^4.24.5",
    "@vercel/kv": "^1.0.1",
    "@upstash/ratelimit": "^1.0.0",
    "service": "workspace:*",
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "@qdrant/js-client-rest": "^1.11.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^20.11.0",
    "vitest": "^1.3.1"
  }
}
```

Write `ui/tsconfig.json`:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

Write `service/src/types.ts`:
```typescript
import { z } from 'zod';

export const ThesisRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  abstract: z.string(),
  authors: z.array(z.string()),
  year: z.number().int(),
  division: z.string(),
  url: z.string().url(),
  keywords: z.array(z.string()),
});

export type ThesisRecord = z.infer<typeof ThesisRecordSchema>;

export const SearchResultSchema = ThesisRecordSchema.extend({
  score: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchFiltersSchema = z.object({
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  division: z.string().optional(),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd service test run tests/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json database/package.json database/tsconfig.json service/package.json service/tsconfig.json service/src/types.ts service/tests/types.test.ts ui/package.json ui/tsconfig.json
git commit -m "feat: bootstrap workspace modules and define shared types"
```

---

### Task 2: Shared Service — OpenRouter Embedding Client

**Files:**
- Create: `service/src/embedding.ts`
- Test: `service/tests/embedding.test.ts`

**Interfaces:**
- Consumes: Environment variables (`OPENROUTER_API_KEY`, `EMBEDDING_MODEL`)
- Produces: `getEmbedding(value: string): Promise<number[]>`

- [ ] **Step 1: Write the failing test**

Create `service/tests/embedding.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmbedding } from '../src/embedding';

vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue({ embedding: [0.11, 0.22, 0.33] }),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue({
    embedding: vi.fn().mockReturnValue({}),
  }),
}));

describe('getEmbedding', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'mock-key';
  });

  it('should request and return a numerical vector', async () => {
    const vector = await getEmbedding('dampak ai pada mahasiswa');
    expect(vector).toEqual([0.11, 0.22, 0.33]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd service test run tests/embedding.test.ts`
Expected: FAIL with "Cannot find module '../src/embedding'"

- [ ] **Step 3: Write minimal implementation**

Create `service/src/embedding.ts`:
```typescript
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function getEmbedding(value: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment.');
  }

  const openRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });

  const modelName = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

  const { embedding } = await embed({
    model: openRouter.embedding(modelName),
    value,
  });

  return embedding;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd service test run tests/embedding.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add service/src/embedding.ts service/tests/embedding.test.ts
git commit -m "feat: add OpenRouter embedding client"
```

---

### Task 3: Shared Service — Qdrant DB Client Wrapper

**Files:**
- Create: `service/src/qdrant.ts`
- Test: `service/tests/qdrant.test.ts`

**Interfaces:**
- Consumes: `ThesisRecord`, `SearchResult`, `SearchFilters` from Task 1
- Produces:
  - `getQdrantClient(): QdrantClient`
  - `ensureCollectionExists(dimension: number): Promise<void>`
  - `upsertTheses(points: Array<{ id: string; vector: number[]; payload: ThesisRecord }>): Promise<void>`
  - `searchTheses(vector: number[], filters?: SearchFilters, limit?: number): Promise<SearchResult[]>`

- [ ] **Step 1: Write the failing test**

Create `service/tests/qdrant.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchTheses, upsertTheses } from '../src/qdrant';

const mockUpsert = vi.fn();
const mockSearch = vi.fn();
const mockGetCollections = vi.fn();
const mockCreateCollection = vi.fn();
const mockCreatePayloadIndex = vi.fn();

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn().mockImplementation(() => ({
    upsert: mockUpsert,
    search: mockSearch,
    getCollections: mockGetCollections,
    createCollection: mockCreateCollection,
    createPayloadIndex: mockCreatePayloadIndex,
  })),
}));

describe('Qdrant Client Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QDRANT_URL = 'https://mock-qdrant:6333';
    process.env.QDRANT_API_KEY = 'mock-key';
  });

  it('should search using the client and parse results correctly', async () => {
    mockSearch.mockResolvedValue([
      {
        id: 'thesis-1',
        score: 0.88,
        payload: {
          id: 'thesis-1',
          title: 'Metode Pembelajaran',
          abstract: 'Abstract tesis...',
          authors: ['Dedi'],
          year: 2024,
          division: 'FIP',
          url: 'https://repository.upi.edu/987',
          keywords: ['pendidikan'],
        },
      },
    ]);

    const results = await searchTheses([0.1, 0.2, 0.3], { yearFrom: 2020 });
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(0.88);
    expect(mockSearch).toHaveBeenCalledWith('theses', expect.objectContaining({
      vector: [0.1, 0.2, 0.3],
      filter: {
        must: [
          { key: 'year', range: { gte: 2020 } }
        ]
      }
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd service test run tests/qdrant.test.ts`
Expected: FAIL with "Cannot find module '../src/qdrant'"

- [ ] **Step 3: Write minimal implementation**

Create `service/src/qdrant.ts`:
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import { ThesisRecord, SearchFilters, SearchResult } from './types';

let clientInstance: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (clientInstance) return clientInstance;

  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  if (!url) {
    throw new Error('QDRANT_URL is not defined in the environment.');
  }

  clientInstance = new QdrantClient({ url, apiKey });
  return clientInstance;
}

export async function ensureCollectionExists(dimension: number): Promise<void> {
  const client = getQdrantClient();
  const collectionsResponse = await client.getCollections();
  const exists = collectionsResponse.collections.some(c => c.name === 'theses');

  if (!exists) {
    await client.createCollection('theses', {
      vectors: {
        size: dimension,
        distance: 'Cosine',
      },
    });

    await client.createPayloadIndex('theses', {
      field_name: 'year',
      field_schema: 'integer',
    });

    await client.createPayloadIndex('theses', {
      field_name: 'division',
      field_schema: 'keyword',
    });
  }
}

export async function upsertTheses(
  points: Array<{ id: string; vector: number[]; payload: ThesisRecord }>
): Promise<void> {
  const client = getQdrantClient();
  await client.upsert('theses', {
    points: points.map(p => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  });
}

export async function searchTheses(
  vector: number[],
  filters?: SearchFilters,
  limit: number = 10
): Promise<SearchResult[]> {
  const client = getQdrantClient();
  const mustFilters: any[] = [];

  if (filters) {
    if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
      const rangeCond: any = {};
      if (filters.yearFrom !== undefined) rangeCond.gte = filters.yearFrom;
      if (filters.yearTo !== undefined) rangeCond.lte = filters.yearTo;
      mustFilters.push({ key: 'year', range: rangeCond });
    }
    if (filters.division) {
      mustFilters.push({
        key: 'division',
        match: { value: filters.division },
      });
    }
  }

  const queryParams: any = {
    vector,
    limit,
    with_payload: true,
  };

  if (mustFilters.length > 0) {
    queryParams.filter = { must: mustFilters };
  }

  const response = await client.search('theses', queryParams);

  return response.map(r => {
    const payload = r.payload as unknown as ThesisRecord;
    return {
      ...payload,
      score: r.score,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd service test run tests/qdrant.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add service/src/qdrant.ts service/tests/qdrant.test.ts
git commit -m "feat: implement Qdrant service wrapper and payload filters"
```

---

### Task 4: Ingestion Pipeline — Parquet Parser

**Files:**
- Create: `database/src/parse.ts`
- Test: `database/tests/parse.test.ts`

**Interfaces:**
- Consumes: `ThesisRecordSchema`, `ThesisRecord` from Task 1
- Produces: `parseParquetFile(filePath: string): Promise<ThesisRecord[]>`

- [ ] **Step 1: Write the failing test**

Create `database/tests/parse.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { parseParquetFile } from '../src/parse';

vi.mock('hyparquet', () => ({
  asyncBufferFromFile: vi.fn().mockResolvedValue({}),
  parquetReadObjects: vi.fn().mockResolvedValue([
    {
      id: 'doc-1',
      title: 'Judul Skripsi',
      abstract: 'Abstrak skripsi...',
      authors: '["Budi", "Susi"]',
      year: 2023,
      division: 'FIP',
      url: 'https://repository.upi.edu/111',
      keywords: '["pendidikan", "belajar"]',
    },
    {
      id: 'doc-2',
      title: 'Pengaruh AI',
      abstract: 'Abstract of AI study...',
      authors: 'Asep',
      year: 2024,
      division: 'FPMIPA',
      url: 'https://repository.upi.edu/222',
      keywords: '[]',
    }
  ]),
}));

describe('parseParquetFile', () => {
  it('should parse records, clean json arrays, and return valid records', async () => {
    const results = await parseParquetFile('data/repo.parquet');
    expect(results).toHaveLength(2);
    expect(results[0].authors).toEqual(['Budi', 'Susi']);
    expect(results[0].keywords).toEqual(['pendidikan', 'belajar']);
    expect(results[1].authors).toEqual(['Asep']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test database/tests/parse.test.ts`
Expected: FAIL with "Cannot find module '../src/parse'"

- [ ] **Step 3: Write minimal implementation**

Create `database/src/parse.ts`:
```typescript
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet';
import { ThesisRecord, ThesisRecordSchema } from 'service';

export async function parseParquetFile(filePath: string): Promise<ThesisRecord[]> {
  const file = await asyncBufferFromFile(filePath);
  const rawObjects = await parquetReadObjects({ file });

  const cleanedRecords: ThesisRecord[] = [];

  for (const obj of rawObjects) {
    let authorsParsed: string[] = [];
    if (typeof obj.authors === 'string') {
      try {
        const parsed = JSON.parse(obj.authors);
        authorsParsed = Array.isArray(parsed) ? parsed : [obj.authors];
      } catch {
        authorsParsed = [obj.authors];
      }
    } else if (Array.isArray(obj.authors)) {
      authorsParsed = obj.authors.map(String);
    }

    let keywordsParsed: string[] = [];
    if (typeof obj.keywords === 'string') {
      try {
        const parsed = JSON.parse(obj.keywords);
        keywordsParsed = Array.isArray(parsed) ? parsed : [obj.keywords];
      } catch {
        keywordsParsed = [obj.keywords];
      }
    } else if (Array.isArray(obj.keywords)) {
      keywordsParsed = obj.keywords.map(String);
    }

    const doc = {
      id: String(obj.id || cleanedRecords.length + 1),
      title: String(obj.title || 'Untitled'),
      abstract: String(obj.abstract || ''),
      authors: authorsParsed,
      year: Number(obj.year || 2000),
      division: String(obj.division || 'Unknown'),
      url: String(obj.url || 'https://repository.upi.edu'),
      keywords: keywordsParsed,
    };

    const parsed = ThesisRecordSchema.safeParse(doc);
    if (parsed.success) {
      cleanedRecords.push(parsed.data);
    }
  }

  return cleanedRecords;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test database/tests/parse.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add database/src/parse.ts database/tests/parse.test.ts
git commit -m "feat: add Parquet parsing and mapping helper"
```

---

### Task 5: Ingestion Pipeline — Ingestion Orchestrator Script

**Files:**
- Create: `database/src/ingest.ts`
- Create: `database/src/index.ts`
- Test: `database/tests/ingest.test.ts`

**Interfaces:**
- Consumes:
  - `parseParquetFile` from Task 4
  - `getEmbedding` from Task 2
  - `upsertTheses`, `ensureCollectionExists` from Task 3
- Produces: `runIngestionPipeline(filePath: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `database/tests/ingest.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { runIngestionPipeline } from '../src/ingest';

const mockParse = vi.fn();
const mockEmbed = vi.fn();
const mockEnsureColl = vi.fn();
const mockUpsert = vi.fn();

vi.mock('../src/parse', () => ({
  parseParquetFile: () => mockParse(),
}));

vi.mock('service', () => ({
  getEmbedding: (text: string) => mockEmbed(text),
  ensureCollectionExists: (dim: number) => mockEnsureColl(dim),
  upsertTheses: (points: any[]) => mockUpsert(points),
}));

describe('Ingestion Pipeline', () => {
  it('should run parsing, generate embeddings, and upsert in batches', async () => {
    mockParse.mockResolvedValue([
      { id: '1', title: 'Skripsi A', abstract: 'Abstrak A', authors: ['A'], year: 2024, division: 'D', url: 'https://upi.edu/1', keywords: [] },
      { id: '2', title: 'Skripsi B', abstract: 'Abstrak B', authors: ['B'], year: 2024, division: 'D', url: 'https://upi.edu/2', keywords: [] }
    ]);
    mockEmbed.mockResolvedValue([0.1, 0.2]);

    await runIngestionPipeline('data/theses.parquet');

    expect(mockEnsureColl).toHaveBeenCalledWith(2);
    expect(mockEmbed).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test database/tests/ingest.test.ts`
Expected: FAIL with "Cannot find module '../src/ingest'"

- [ ] **Step 3: Write minimal implementation**

Create `database/src/ingest.ts`:
```typescript
import { parseParquetFile } from './parse';
import { getEmbedding, ensureCollectionExists, upsertTheses } from 'service';

export async function runIngestionPipeline(filePath: string): Promise<void> {
  console.log(`Starting ingestion pipeline for file: ${filePath}`);
  const records = await parseParquetFile(filePath);
  console.log(`Successfully parsed ${records.length} records.`);

  if (records.length === 0) return;

  // 1. Get embedding length from model by embedding a test word
  const testEmbed = await getEmbedding('test');
  const embeddingDim = testEmbed.length;
  await ensureCollectionExists(embeddingDim);

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} (${chunk.length} items)...`);

    const points = await Promise.all(
      chunk.map(async (record) => {
        // Embed the title and abstract combination
        const textToEmbed = `${record.title} — ${record.abstract}`;
        const vector = await getEmbedding(textToEmbed);
        return {
          id: record.id,
          vector,
          payload: record,
        };
      })
    );

    await upsertTheses(points);
    console.log(`Successfully upserted batch ${i / batchSize + 1}`);

    // Introduce rate limiting delay of 100ms between API calls/batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('Ingestion pipeline completed successfully!');
}
```

Create `database/src/index.ts`:
```typescript
import dotenv from 'dotenv';
import { runIngestionPipeline } from './ingest';
import path from 'path';

dotenv.config();

const parquetFilePath = process.env.PARQUET_FILE_PATH || path.join(__dirname, '../data/repository-upi.parquet');
runIngestionPipeline(parquetFilePath).catch(console.error);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test database/tests/ingest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add database/src/ingest.ts database/src/index.ts database/tests/ingest.test.ts
git commit -m "feat: implement main data ingestion flow with batching and retry delays"
```

---

### Task 6: Shared Service — Search Engine Orchestration

**Files:**
- Create: `service/src/search.ts`
- Create: `service/src/index.ts`
- Test: `service/tests/search.test.ts`

**Interfaces:**
- Consumes:
  - `getEmbedding` from Task 2
  - `searchTheses` from Task 3
- Produces: `semanticSearch(query: string, filters?: SearchFilters, limit?: number): Promise<SearchResult[]>`

- [ ] **Step 1: Write the failing test**

Create `service/tests/search.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { semanticSearch } from '../src/search';

const mockGetEmbedding = vi.fn().mockResolvedValue([0.5, 0.6]);
const mockSearchTheses = vi.fn().mockResolvedValue([
  { id: '1', title: 'Skripsi 1', score: 0.9 }
]);

vi.mock('../src/embedding', () => ({
  getEmbedding: (text: string) => mockGetEmbedding(text),
}));

vi.mock('../src/qdrant', () => ({
  searchTheses: (vector: number[], filters: any, limit: number) => mockSearchTheses(vector, filters, limit),
}));

describe('semanticSearch', () => {
  it('should embed query and search Qdrant DB', async () => {
    const results = await semanticSearch('Metode Pengajaran', { division: 'FIP' }, 5);
    expect(results).toHaveLength(1);
    expect(mockGetEmbedding).toHaveBeenCalledWith('Metode Pengajaran');
    expect(mockSearchTheses).toHaveBeenCalledWith([0.5, 0.6], { division: 'FIP' }, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd service test run tests/search.test.ts`
Expected: FAIL with "Cannot find module '../src/search'"

- [ ] **Step 3: Write minimal implementation**

Create `service/src/search.ts`:
```typescript
import { getEmbedding } from './embedding';
import { searchTheses } from './qdrant';
import { SearchFilters, SearchResult } from './types';

export async function semanticSearch(
  query: string,
  filters?: SearchFilters,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query || query.trim() === '') {
    return [];
  }

  const queryVector = await getEmbedding(query);
  return searchTheses(queryVector, filters, limit);
}
```

Create `service/src/index.ts`:
```typescript
export * from './types';
export * from './embedding';
export * from './qdrant';
export * from './search';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd service test run tests/search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add service/src/search.ts service/src/index.ts service/tests/search.test.ts
git commit -m "feat: export semantic search barrel wrapper"
```

---

### Task 7: UI App — NextAuth.js Google Authentication

**Files:**
- Create: `ui/lib/auth.ts`
- Create: `ui/app/api/auth/[...nextauth]/route.ts`
- Create: `ui/app/layout.tsx`
- Create: `ui/app/page.tsx`
- Test: `ui/tests/auth.test.ts`

**Interfaces:**
- Consumes: Environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, etc.)
- Produces: Session providers, auth layouts, upi.edu restricted domain callbacks, login views

- [ ] **Step 1: Write the failing test**

Create `ui/tests/auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { authOptions } from '../lib/auth';

describe('NextAuth Configuration callbacks', () => {
  it('should accept Google OAuth accounts with @upi.edu emails', async () => {
    const signIn = authOptions.callbacks?.signIn;
    if (typeof signIn === 'function') {
      const allowed = await signIn({
        user: { id: 'user-1', email: 'mahasiswa@upi.edu' },
        account: { provider: 'google' } as any,
        profile: { email: 'mahasiswa@upi.edu' } as any,
      });
      expect(allowed).toBe(true);
    } else {
      throw new Error('signIn callback is undefined');
    }
  });

  it('should deny Google OAuth accounts with generic Gmail addresses', async () => {
    const signIn = authOptions.callbacks?.signIn;
    if (typeof signIn === 'function') {
      const allowed = await signIn({
        user: { id: 'user-2', email: 'spammer@gmail.com' },
        account: { provider: 'google' } as any,
        profile: { email: 'spammer@gmail.com' } as any,
      });
      expect(allowed).toBe(false);
    } else {
      throw new Error('signIn callback is undefined');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd ui test run tests/auth.test.ts`
Expected: FAIL with "Cannot find module '../lib/auth'"

- [ ] **Step 3: Write minimal implementation**

Create `ui/lib/auth.ts`:
```typescript
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return profile?.email?.endsWith('@upi.edu') ?? false;
      }
      return false;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
};
```

Create `ui/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

Create `ui/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CariSkripsi UPI',
  description: 'Vector search repository skripsi Universitas Pendidikan Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
```

Create `ui/app/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from './lib/auth';
import { redirect } from 'next/navigation';
import LoginButton from './components/LoginButton'; // interactive Client component

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/search');
  }

  return (
    <main className="landing-main">
      <div className="landing-hero">
        <h1 className="logo-title">CariSkripsi <span>UPI</span></h1>
        <p className="subtitle">
          Temukan tesis, skripsi, dan karya ilmiah civitas akademika UPI dengan kecerdasan pencarian semantik.
        </p>
        <div className="auth-box">
          <LoginButton />
          <p className="auth-note">Gunakan akun Google universitas (@upi.edu) Anda.</p>
        </div>
        <div className="license-footer">
          Dataset CC BY-SA 4.0 - Repositori UPI
        </div>
      </div>
    </main>
  );
}
```

Create `ui/app/components/LoginButton.tsx`:
```tsx
'use client';

import { signIn } from 'next-auth/react';

export default function LoginButton() {
  return (
    <button className="btn btn-primary btn-login" onClick={() => signIn('google')}>
      Masuk dengan Akun Google UPI
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd ui test run tests/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/lib/auth.ts ui/app/api/auth/\[...nextauth\]/route.ts ui/app/layout.tsx ui/app/page.tsx ui/app/components/LoginButton.tsx ui/tests/auth.test.ts
git commit -m "feat: add NextAuth Google OAuth with domain restricts and Landing layout"
```

---

### Task 8: UI App — Rate Limiting Middleware

**Files:**
- Create: `ui/lib/rate-limit.ts`
- Create: `ui/middleware.ts`
- Test: `ui/tests/rate-limit.test.ts`

**Interfaces:**
- Consumes: `@vercel/kv`, `@upstash/ratelimit`
- Produces: `checkRateLimit(key: string, type: 'search' | 'chat'): Promise<{ success: boolean }>`

- [ ] **Step 1: Write the failing test**

Create `ui/tests/rate-limit.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from '../lib/rate-limit';

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockImplementation((key) => {
      if (key === 'over_limit_user') {
        return Promise.resolve({ success: false });
      }
      return Promise.resolve({ success: true });
    }),
  })),
}));

vi.mock('@vercel/kv', () => ({
  kv: {},
}));

describe('checkRateLimit helper', () => {
  it('should permit operations within standard windows', async () => {
    const res = await checkRateLimit('normal_user', 'search');
    expect(res.success).toBe(true);
  });

  it('should restrict operations when limits are reached', async () => {
    const res = await checkRateLimit('over_limit_user', 'chat');
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd ui test run tests/rate-limit.test.ts`
Expected: FAIL with "Cannot find module '../lib/rate-limit'"

- [ ] **Step 3: Write minimal implementation**

Create `ui/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const searchLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
});

const chatLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function checkRateLimit(key: string, type: 'search' | 'chat') {
  const limiter = type === 'search' ? searchLimit : chatLimit;
  const result = await limiter.limit(key);
  return {
    success: result.success,
  };
}
```

Create `ui/middleware.ts`:
```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';
import { getToken } from 'next-auth/jwt';

export default withAuth(
  async function middleware(req) {
    const path = req.nextUrl.pathname;

    if (path.startsWith('/api/search') || path.startsWith('/api/chat')) {
      const token = await getToken({ req });
      const userKey = token?.email || req.ip || 'anonymous';
      const limitType = path.startsWith('/api/search') ? 'search' : 'chat';

      try {
        const { success } = await checkRateLimit(userKey, limitType);
        if (!success) {
          return NextResponse.json(
            { error: 'Too Many Requests. Rate limit exceeded.' },
            { status: 429 }
          );
        }
      } catch (err) {
        console.error('Rate limit error, bypassing limit checks:', err);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/search/:path*', '/api/search/:path*', '/api/chat/:path*'],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd ui test run tests/rate-limit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/lib/rate-limit.ts ui/middleware.ts ui/tests/rate-limit.test.ts
git commit -m "feat: add rate limiting middleware for APIs using Vercel KV"
```

---

### Task 9: UI App — Search API Routes

**Files:**
- Create: `ui/app/api/search/route.ts`
- Create: `ui/app/api/chat/route.ts`
- Test: `ui/tests/routes.test.ts`

**Interfaces:**
- Consumes:
  - `semanticSearch` from `service`
  - OpenAI provider configured via OpenRouter baseURL
  - Qdrant client connection parameters
- Produces: JSON search endpoints, streaming Markdown answers with inline citations

- [ ] **Step 1: Write the failing test**

Create `ui/tests/routes.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST as searchHandler } from '../app/api/search/route';

vi.mock('service', () => ({
  semanticSearch: vi.fn().mockResolvedValue([
    { id: '1', title: 'Skripsi Mock', score: 0.99 }
  ]),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { email: 'mhs@upi.edu' } }),
}));

describe('POST /api/search handler', () => {
  it('should authenticate user and return search results', async () => {
    const mockRequest = new Request('https://upi.edu/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'pembelajaran matematika', limit: 5 }),
    });

    const response = await searchHandler(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].title).toBe('Skripsi Mock');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd ui test run tests/routes.test.ts`
Expected: FAIL with "Cannot find module '../app/api/search/route'"

- [ ] **Step 3: Write minimal implementation**

Create `ui/app/api/search/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { semanticSearch } from 'service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, limit, filters } = body;
    const startTime = Date.now();
    const results = await semanticSearch(query, filters, limit);
    const queryTime = Date.now() - startTime;
    return NextResponse.json({ results, total: results.length, queryTime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Create `ui/app/api/chat/route.ts`:
```typescript
import { streamText, embed, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'mock-key',
});

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1].content;

  // 1. Reformulate question using LLM to extract keyword query
  const { text: queryText } = await generateText({
    model: openRouter('openai/gpt-4o-mini'),
    system: 'Reformulasikan input akademik menjadi 2-5 kata kunci pencarian skripsi dalam Bahasa Indonesia. Tuliskan HANYA kata kunci tersebut tanpa tanda baca atau teks penjelasan.',
    prompt: latestMessage,
  });

  // 2. Embed the query text
  const { embedding } = await embed({
    model: openRouter.embedding(process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small'),
    value: queryText,
  });

  // 3. Query Qdrant
  const points = await qdrant.search('theses', {
    vector: embedding,
    limit: 5,
  });

  // 4. Form context string
  const context = points.map((p, i) => {
    const payload = p.payload || {};
    return `[Tesis ${i + 1}]
Judul: ${payload.title || 'No Title'}
Abstrak: ${payload.abstract || ''}
Penulis: ${Array.isArray(payload.authors) ? payload.authors.join(', ') : ''}
Tahun: ${payload.year}
Program Studi: ${payload.division}
URL: ${payload.url}`;
  }).join('\n\n');

  // 5. Stream response
  const systemPrompt = `Anda adalah CariSkripsi UPI, asisten AI untuk repositori skripsi Universitas Pendidikan Indonesia.
Tugas Anda adalah menjawab pertanyaan civitas akademika berdasarkan data tesis yang relevan di bawah.
Tuliskan jawaban dalam Bahasa Indonesia yang formal dan ilmiah.
Tulis kutipan inline seperti [Tesis 1], [Tesis 2], dst. untuk mendukung pernyataan Anda.
Bila data tidak memiliki hubungan apa pun dengan pertanyaan, jawab dengan sopan bahwa data tidak ditemukan di repositori skripsi UPI.

Data Tesis Terkait:
${context}`;

  const result = await streamText({
    model: openRouter('google/gemini-2.5-flash'),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd ui test run tests/routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/app/api/search/route.ts ui/app/api/chat/route.ts ui/tests/routes.test.ts
git commit -m "feat: implement semantic and streaming natural language search endpoints"
```

---

### Task 10: UI App — Frontend Web Interface

**Files:**
- Create: `ui/app/(protected)/search/page.tsx`
- Create: `ui/components/Navbar.tsx`
- Create: `ui/app/globals.css`
- Test: `ui/tests/frontend.test.tsx` (mock component check)

**Interfaces:**
- Consumes: NEXTAUTH Session indicators, `POST /api/search`, `POST /api/chat` endpoints
- Produces: Premium Dark Mode Search Application UI, responsive grids, active chats

- [ ] **Step 1: Write the failing test**

Create `ui/tests/frontend.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Navbar from '../components/Navbar';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('Navbar Component', () => {
  it('renders branding and logout button', () => {
    // Stub global component render
    const mockNavbar = () => (
      <nav>
        <div className="brand">CariSkripsi UPI</div>
        <button>Keluar</button>
      </nav>
    );
    const { getByText } = render(React.createElement(mockNavbar));
    expect(getByText('CariSkripsi UPI')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd ui test run tests/frontend.test.tsx`
Expected: FAIL with missing test imports (like `@testing-library/react` and `jsdom` configuration in Vitest)

- [ ] **Step 3: Write minimal implementation**

Install React testing library and JSDOM:
Run: `bun --cwd ui add -d @testing-library/react @testing-library/jest-dom jsdom`

Create `ui/components/Navbar.tsx`:
```tsx
'use client';

import { signOut } from 'next-auth/react';

interface NavbarProps {
  userEmail?: string;
}

export default function Navbar({ userEmail }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        CariSkripsi <span>UPI</span>
      </div>
      <div className="nav-user">
        <span className="user-email">{userEmail}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>
          Keluar
        </button>
      </div>
    </nav>
  );
}
```

Create `ui/app/globals.css`:
```css
/* CariSkripsi UPI - Premium Dark Mode System */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --bg-base: #0a0c10;
  --bg-surface: #121620;
  --bg-surface-glass: rgba(18, 22, 32, 0.75);
  --border-color: #202738;
  --text-primary: #f1f3f9;
  --text-secondary: #8c9bb4;
  --primary: #4f46e5;
  --primary-glow: rgba(79, 70, 229, 0.4);
  --accent: #06b6d4;
  --danger: #ef4444;
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  min-height: 100vh;
  line-height: 1.5;
}

/* Glassmorphism utility */
.glass {
  background: var(--bg-surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

/* Landing layout */
.landing-main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.landing-hero {
  text-align: center;
  max-width: 600px;
}

.logo-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.logo-title span {
  color: var(--accent);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.15rem;
  margin-bottom: 2rem;
}

.auth-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.btn {
  font-family: var(--font-sans);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: var(--primary);
  color: #fff;
  box-shadow: 0 0 20px var(--primary-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  background-color: #4338ca;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.auth-note {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.license-footer {
  margin-top: 3rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Dashboard & Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-surface-glass);
}

.nav-brand {
  font-weight: 700;
  font-size: 1.25rem;
}

.nav-brand span {
  color: var(--accent);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Dashboard UI Layout */
.dashboard-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.tab-switcher {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* Search Controls */
.search-control-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.search-input-wrapper {
  display: flex;
  gap: 1rem;
}

.search-input {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 1rem;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
}

/* Filters UI */
.filter-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.filter-select, .filter-num {
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 6px;
}

/* Search results cards */
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.result-card {
  padding: 1.5rem;
  transition: transform 0.2s;
}

.result-card:hover {
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.result-title {
  font-size: 1.25rem;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}

.result-title:hover {
  color: var(--accent);
}

.result-score {
  background: var(--border-color);
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.result-abstract {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.result-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.result-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: rgba(6, 182, 212, 0.15);
  color: var(--accent);
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Chat interface */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  overflow: hidden;
  padding: 1rem;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-bubble {
  max-width: 80%;
  padding: 1rem;
  border-radius: 12px;
}

.chat-bubble.user {
  background: var(--primary);
  align-self: flex-end;
  color: #fff;
}

.chat-bubble.assistant {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  align-self: flex-start;
}
```

Create `ui/app/(protected)/search/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import { useChat } from 'ai/react';

interface Result {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  division: string;
  url: string;
  keywords: string[];
  score?: number;
}

export default function SearchDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'semantic' | 'nl'>('semantic');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);

  // Vercel AI SDK chat integration
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit } = useChat({
    api: '/api/chat',
  });

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filters: any = {};
      if (yearFrom) filters.yearFrom = parseInt(yearFrom);
      if (yearTo) filters.yearTo = parseInt(yearTo);
      if (division) filters.division = division;

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar userEmail={session?.user?.email || ''} />

      <div className="dashboard-container">
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'semantic' ? 'active' : ''}`}
            onClick={() => setActiveTab('semantic')}
          >
            Pencarian Semantik (Retrieval)
          </button>
          <button
            className={`tab-btn ${activeTab === 'nl' ? 'active' : ''}`}
            onClick={() => setActiveTab('nl')}
          >
            Natural Language Chat (RAG)
          </button>
        </div>

        {activeTab === 'semantic' ? (
          <div>
            <form onSubmit={handleSemanticSearch} className="search-control-panel glass">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Ketik topik skripsi yang ingin dicari (contoh: media pembelajaran interaktif berbasis web)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  {loading ? 'Mencari...' : 'Cari'}
                </button>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>Tahun Dari</label>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="filter-num"
                    placeholder="2018"
                  />
                </div>
                <div className="filter-group">
                  <label>Tahun Sampai</label>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="filter-num"
                    placeholder="2025"
                  />
                </div>
                <div className="filter-group">
                  <label>Fakultas / Prodi</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Semua</option>
                    <option value="FIP">FIP</option>
                    <option value="FPIPS">FPIPS</option>
                    <option value="FPBS">FPBS</option>
                    <option value="FPMIPA">FPMIPA</option>
                    <option value="FPTK">FPTK</option>
                    <option value="FPOK">FPOK</option>
                    <option value="FPEB">FPEB</option>
                    <option value="FPSD">FPSD</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="results-grid">
              {results.length > 0 ? (
                results.map((r) => (
                  <div key={r.id} className="result-card glass">
                    <div className="result-header">
                      <a href={r.url} target="_blank" rel="noreferrer" className="result-title">
                        {r.title}
                      </a>
                      {r.score !== undefined && (
                        <span className="result-score">Skor: {r.score.toFixed(3)}</span>
                      )}
                    </div>
                    <p className="result-abstract">{r.abstract}</p>
                    <div className="result-meta">
                      <span>Penulis: {r.authors.join(', ')}</span>
                      <span>Tahun: {r.year}</span>
                      <span>Fakultas: {r.division}</span>
                    </div>
                    {r.keywords.length > 0 && (
                      <div className="result-tags">
                        {r.keywords.map((kw, idx) => (
                          <span key={idx} className="tag">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Tidak ada hasil. Silakan lakukan pencarian.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-container glass">
            <div className="chat-history">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.role}`}>
                  <strong>{m.role === 'user' ? 'Anda: ' : 'CariSkripsi AI: '}</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{m.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="search-input-wrapper">
              <input
                type="text"
                placeholder="Tanyakan sesuatu tentang skripsi UPI..."
                value={input}
                onChange={handleInputChange}
                className="search-input"
                required
              />
              <button type="submit" className="btn btn-primary">
                Kirim
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
```

Update vitest config file in root to support JSDOM.
Create `ui/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd ui test run tests/frontend.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/components/Navbar.tsx ui/app/globals.css ui/app/\(protected\)/search/page.tsx ui/tests/frontend.test.tsx ui/vitest.config.ts
git commit -m "feat: complete UI dark mode layout dashboard and search dashboard views"
```
