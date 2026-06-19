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
