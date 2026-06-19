import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQdrantClient, ensureCollectionExists, upsertTheses, searchTheses } from '../src/qdrant';

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

  it('should throw an error if QDRANT_URL is not set', () => {
    delete process.env.QDRANT_URL;
    expect(() => getQdrantClient()).toThrow('QDRANT_URL is not defined in the environment.');
  });

  it('should create collection and indexes if not exists', async () => {
    mockGetCollections.mockResolvedValue({ collections: [] });

    await ensureCollectionExists(384);

    expect(mockGetCollections).toHaveBeenCalled();
    expect(mockCreateCollection).toHaveBeenCalledWith('theses', {
      vectors: {
        size: 384,
        distance: 'Cosine',
      },
    });
    expect(mockCreatePayloadIndex).toHaveBeenCalledTimes(2);
    expect(mockCreatePayloadIndex).toHaveBeenNthCalledWith(1, 'theses', {
      field_name: 'year',
      field_schema: 'integer',
    });
    expect(mockCreatePayloadIndex).toHaveBeenNthCalledWith(2, 'theses', {
      field_name: 'division',
      field_schema: 'keyword',
    });
  });

  it('should not create collection if it already exists', async () => {
    mockGetCollections.mockResolvedValue({ collections: [{ name: 'theses' }] });

    await ensureCollectionExists(384);

    expect(mockGetCollections).toHaveBeenCalled();
    expect(mockCreateCollection).not.toHaveBeenCalled();
    expect(mockCreatePayloadIndex).not.toHaveBeenCalled();
  });

  it('should upsert theses points correctly', async () => {
    mockUpsert.mockResolvedValue({ status: 'completed' });

    const points = [
      {
        id: '1',
        vector: [0.1, 0.2],
        payload: {
          id: '1',
          title: 'Title',
          abstract: 'Abstract',
          authors: ['Author'],
          year: 2024,
          division: 'FIP',
          url: 'https://repository.upi.edu/1',
          keywords: ['keyword'],
        },
      },
    ];

    await upsertTheses(points);

    expect(mockUpsert).toHaveBeenCalledWith('theses', {
      points: [
        {
          id: '1',
          vector: [0.1, 0.2],
          payload: points[0].payload,
        },
      ],
    });
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

    const results = await searchTheses([0.1, 0.2, 0.3], { yearFrom: 2020, division: 'FIP' });
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(0.88);
    expect(results[0].title).toBe('Metode Pembelajaran');
    expect(mockSearch).toHaveBeenCalledWith('theses', expect.objectContaining({
      vector: [0.1, 0.2, 0.3],
      filter: {
        must: [
          { key: 'year', range: { gte: 2020 } },
          { key: 'division', match: { value: 'FIP' } },
        ],
      },
    }));
  });
});
