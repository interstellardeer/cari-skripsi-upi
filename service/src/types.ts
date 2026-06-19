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
