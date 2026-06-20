import { z } from 'zod';

export const ThesisRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Indonesian abstract */
  abstract_id: z.string(),
  /** English abstract (may be null/empty for older records) */
  abstract_en: z.string(),
  author: z.string(),
  year: z.number().int(),
  degree_type: z.string(),
  division_name: z.string(),
  division_code: z.string(),
  eprint_url: z.string(),
  subject_codes: z.array(z.string()),
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
  degree_type: z.string().optional(),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
