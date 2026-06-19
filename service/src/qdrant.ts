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
