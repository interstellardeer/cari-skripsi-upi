import { describe, it, expect } from 'vitest';
import { ThesisRecordSchema, SearchResultSchema, SearchFiltersSchema } from '../src/types';

describe('ThesisRecordSchema', () => {
  it('should validate correct thesis records', () => {
    const validData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract: "Penelitian ini membahas tentang penerapan machine learning...",
      authors: ["Asep", "Susi"],
      year: 2025,
      division: "FPMIPA",
      url: "https://repository.upi.edu/123",
      keywords: ["AI", "ML", "UPI"],
    };
    expect(ThesisRecordSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject invalid thesis records missing fields', () => {
    const invalidData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning",
      // missing abstract
      authors: ["Asep"],
      year: 2025,
      division: "FPMIPA",
    };
    expect(ThesisRecordSchema.safeParse(invalidData).success).toBe(false);
  });
});

describe('SearchResultSchema', () => {
  it('should validate correct search results including score', () => {
    const validData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract: "Penelitian ini membahas tentang penerapan machine learning...",
      authors: ["Asep", "Susi"],
      year: 2025,
      division: "FPMIPA",
      url: "https://repository.upi.edu/123",
      keywords: ["AI", "ML", "UPI"],
      score: 0.95,
    };
    expect(SearchResultSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject search results missing score', () => {
    const invalidData = {
      id: "thesis-123",
      title: "Penerapan Machine Learning di Kampus",
      abstract: "Penelitian ini membahas tentang penerapan machine learning...",
      authors: ["Asep", "Susi"],
      year: 2025,
      division: "FPMIPA",
      url: "https://repository.upi.edu/123",
      keywords: ["AI", "ML", "UPI"],
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

