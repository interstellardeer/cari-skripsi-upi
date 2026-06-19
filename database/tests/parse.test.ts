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
