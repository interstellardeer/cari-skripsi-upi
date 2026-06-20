import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmbedding, getEmbeddings } from '../src/embedding';

vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue({ embedding: [0.11, 0.22, 0.33] }),
  embedMany: vi.fn().mockResolvedValue({ embeddings: [[0.11, 0.22, 0.33], [0.44, 0.55, 0.66]] }),
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

describe('getEmbeddings', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'mock-key';
  });

  it('should request and return multiple numerical vectors', async () => {
    const vectors = await getEmbeddings(['dampak ai pada mahasiswa', 'skripsi upi']);
    expect(vectors).toEqual([[0.11, 0.22, 0.33], [0.44, 0.55, 0.66]]);
  });
});
