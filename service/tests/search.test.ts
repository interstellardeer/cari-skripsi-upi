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

  it('should return empty array for empty or whitespace query', async () => {
    const resultsEmpty = await semanticSearch('');
    expect(resultsEmpty).toEqual([]);

    const resultsWhitespace = await semanticSearch('   ');
    expect(resultsWhitespace).toEqual([]);

    expect(mockGetEmbedding).not.toHaveBeenCalledWith('');
    expect(mockGetEmbedding).not.toHaveBeenCalledWith('   ');
  });
});
