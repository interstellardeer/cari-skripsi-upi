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

vi.mock('service', async () => {
  const { ThesisRecordSchema } = await import('../../service/src/types');
  return {
    ThesisRecordSchema,
    getEmbedding: (text: string) => mockEmbed(text),
    ensureCollectionExists: (dim: number) => mockEnsureColl(dim),
    upsertTheses: (points: any[]) => mockUpsert(points),
  };
});

describe('Ingestion Pipeline', () => {
  it('should run parsing, generate embeddings, and upsert in batches', async () => {
    mockEmbed.mockReset();
    mockEnsureColl.mockReset();
    mockUpsert.mockReset();
    mockEmbed.mockResolvedValue([0.1, 0.2]);

    await runIngestionPipeline('data/theses.parquet');

    expect(mockEnsureColl).toHaveBeenCalledWith(2);
    expect(mockEmbed).toHaveBeenCalledTimes(3); // 1 test + 2 records
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it('should retry getEmbedding up to 3 times on failure and succeed if it resolves eventually', async () => {
    mockEmbed.mockReset();
    mockEnsureColl.mockReset();
    mockUpsert.mockReset();

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 1st call: testEmbed -> succeed
    // 2nd call (first record): fail once, then succeed
    // 3rd call (second record): fail twice, then succeed
    mockEmbed
      .mockResolvedValueOnce([0.1, 0.2]) // testEmbed
      .mockRejectedValueOnce(new Error('API Error')) // first record attempt 1
      .mockResolvedValueOnce([0.3, 0.4]) // first record attempt 2
      .mockRejectedValueOnce(new Error('Rate limit')) // second record attempt 1
      .mockRejectedValueOnce(new Error('Rate limit')) // second record attempt 2
      .mockResolvedValueOnce([0.5, 0.6]); // second record attempt 3

    await runIngestionPipeline('data/theses.parquet');

    expect(mockEmbed).toHaveBeenCalledTimes(6); // 1 test + 2 for first record + 3 for second record
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3); // 1 warning for first record, 2 for second record
    consoleWarnSpy.mockRestore();
  });

  it('should throw error after 3 failed attempts', async () => {
    mockEmbed.mockReset();
    mockEnsureColl.mockReset();
    mockUpsert.mockReset();

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockEmbed
      .mockResolvedValueOnce([0.1, 0.2]) // testEmbed
      .mockRejectedValue(new Error('Persistent API Error')); // all subsequent attempts fail

    await expect(runIngestionPipeline('data/theses.parquet')).rejects.toThrow('Persistent API Error');
    expect(mockEmbed).toHaveBeenCalledTimes(4); // 1 test + 3 attempts for first record
    consoleWarnSpy.mockRestore();
  });
});
