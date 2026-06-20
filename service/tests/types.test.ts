import { describe, it, expect } from 'vitest';
import { ThesisRecordSchema, SearchResultSchema, SearchFiltersSchema } from '../src/types';

describe('ThesisRecordSchema', () => {
  it('should validate correct thesis records', () => {
    const validData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract_id: "Penelitian ini membahas tentang penerapan machine learning...",
      abstract_en: "This research discusses the application of machine learning...",
      author: "Asep",
      year: 2025,
      degree_type: "S1",
      division_name: "Program Studi Ilmu Komputer",
      division_code: "IKOM",
      eprint_url: "https://repository.upi.edu/123",
      subject_codes: ["AI", "ML", "UPI"],
    };
    expect(ThesisRecordSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject invalid thesis records missing fields', () => {
    const invalidData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning",
      // missing abstract_id
      abstract_en: "",
      author: "Asep",
      year: 2025,
      degree_type: "S1",
      division_name: "Program Studi Ilmu Komputer",
      division_code: "IKOM",
      eprint_url: "https://repository.upi.edu/123",
      subject_codes: ["AI", "ML", "UPI"],
    };
    expect(ThesisRecordSchema.safeParse(invalidData).success).toBe(false);
  });
});

describe('SearchResultSchema', () => {
  it('should validate correct search results including score', () => {
    const validData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract_id: "Penelitian ini membahas tentang penerapan machine learning...",
      abstract_en: "This research discusses the application of machine learning...",
      author: "Asep",
      year: 2025,
      degree_type: "S1",
      division_name: "Program Studi Ilmu Komputer",
      division_code: "IKOM",
      eprint_url: "https://repository.upi.edu/123",
      subject_codes: ["AI", "ML", "UPI"],
      score: 0.95,
    };
    expect(SearchResultSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject search results missing score', () => {
    const invalidData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract_id: "Penelitian ini membahas tentang penerapan machine learning...",
      abstract_en: "This research discusses the application of machine learning...",
      author: "Asep",
      year: 2025,
      degree_type: "S1",
      division_name: "Program Studi Ilmu Komputer",
      division_code: "IKOM",
      eprint_url: "https://repository.upi.edu/123",
      subject_codes: ["AI", "ML", "UPI"],
      // missing score
    };
    expect(SearchResultSchema.safeParse(invalidData).success).toBe(false);
  });
});

describe('SearchFiltersSchema', () => {
  it('should validate correct search filters', () => {
    const validData = {
      yearFrom: 2020,
      yearTo: 2025,
      division: "FPMIPA",
    };
    expect(SearchFiltersSchema.safeParse(validData).success).toBe(true);
  });

  it('should validate empty search filters', () => {
    const validData = {};
    expect(SearchFiltersSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject non-integer years', () => {
    const invalidData = {
      yearFrom: 2020.5,
    };
    expect(SearchFiltersSchema.safeParse(invalidData).success).toBe(false);
  });
});

