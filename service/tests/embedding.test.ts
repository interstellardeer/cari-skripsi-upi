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
