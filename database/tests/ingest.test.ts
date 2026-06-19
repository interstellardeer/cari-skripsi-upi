import { describe, it, expect, vi } from 'vitest';
import { runIngestionPipeline } from '../src/ingest';

const mockEmbed = vi.fn();
const mockEnsureColl = vi.fn();
const mockUpsert = vi.fn();

vi.mock('hyparquet', () => ({
  asyncBufferFromFile: vi.fn().mockResolvedValue({}),
  parquetReadObjects: vi.fn().mockResolvedValue([
    { id: '1', title: 'Skripsi A', abstract: 'Abstrak A', authors: '["A"]', year: 2024, division: 'D', url: 'https://upi.edu/1', keywords: '[]' },
    { id: '2', title: 'Skripsi B', abstract: 'Abstrak B', authors: '["B"]', year: 2024, division: 'D', url: 'https://upi.edu/2', keywords: '[]' }
  ]),
}));

vi.mock('service', () => ({
  getEmbedding: (text: string) => mockEmbed(text),
  ensureCollectionExists: (dim: number) => mockEnsureColl(dim),
  upsertTheses: (points: any[]) => mockUpsert(points),
}));

describe('Ingestion Pipeline', () => {
  it('should run parsing, generate embeddings, and upsert in batches', async () => {
    mockEmbed.mockResolvedValue([0.1, 0.2]);

    await runIngestionPipeline('data/theses.parquet');

    expect(mockEnsureColl).toHaveBeenCalledWith(2);
    expect(mockEmbed).toHaveBeenCalledTimes(3); // 1 test + 2 records
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
