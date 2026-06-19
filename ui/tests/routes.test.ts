import { describe, it, expect, vi } from 'vitest';

const searchHandler = async (req: Request) => {
  const mod = await import('../app/api/search/route');
  return mod.POST(req);
};

const chatHandler = async (req: Request) => {
  const mod = await import('../app/api/chat/route');
  return mod.POST(req);
};

let mockSessionValue: any = { user: { email: 'mhs@upi.edu' } };

// Bun-compatible mocks for bun test runner
if (typeof Bun !== 'undefined') {
  const { mock } = require('bun:test');
  
  mock.module('service', () => ({
    semanticSearch: () => Promise.resolve([
      { id: '1', title: 'Skripsi Mock', score: 0.99 }
    ]),
  }));

  mock.module('next-auth', () => ({
    getServerSession: () => Promise.resolve(mockSessionValue),
  }));

  mock.module('ai', () => ({
    streamText: () => Promise.resolve({
      toDataStreamResponse: () => new Response('Mock stream response'),
    }),
    embed: () => Promise.resolve({
      embedding: [0.1, 0.2],
    }),
    generateText: () => Promise.resolve({
      text: 'pembelajaran matematika',
    }),
  }));

  mock.module('@ai-sdk/openai', () => {
    const mockOpenAI = () => 'mock-model';
    (mockOpenAI as any).embedding = () => 'mock-embedding-model';
    return {
      createOpenAI: () => mockOpenAI,
    };
  });

  mock.module('@qdrant/js-client-rest', () => {
    class MockQdrantClient {
      search() {
        return Promise.resolve([
          {
            payload: {
              title: 'Skripsi Mock Chat',
              abstract: 'Abstrak...',
              authors: ['Penulis'],
              year: 2026,
              division: 'IK',
              url: 'https://upi.edu/1',
            },
          },
        ]);
      }
    }
    return {
      QdrantClient: MockQdrantClient,
    };
  });
}

vi.mock('service', () => ({
  semanticSearch: vi.fn().mockResolvedValue([
    { id: '1', title: 'Skripsi Mock', score: 0.99 }
  ]),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockImplementation(() => Promise.resolve(mockSessionValue)),
}));

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    toDataStreamResponse: vi.fn().mockReturnValue(new Response('Mock stream response')),
  }),
  embed: vi.fn().mockResolvedValue({
    embedding: [0.1, 0.2],
  }),
  generateText: vi.fn().mockResolvedValue({
    text: 'pembelajaran matematika',
  }),
}));

vi.mock('@ai-sdk/openai', () => {
  const mockOpenAI = vi.fn().mockReturnValue('mock-model');
  (mockOpenAI as any).embedding = vi.fn().mockReturnValue('mock-embedding-model');
  return {
    createOpenAI: vi.fn().mockReturnValue(mockOpenAI),
  };
});

vi.mock('@qdrant/js-client-rest', () => {
  class MockQdrantClient {
    search = vi.fn().mockResolvedValue([
      {
        payload: {
          title: 'Skripsi Mock Chat',
          abstract: 'Abstrak...',
          authors: ['Penulis'],
          year: 2026,
          division: 'IK',
          url: 'https://upi.edu/1',
        },
      },
    ]);
  }
  return {
    QdrantClient: MockQdrantClient,
  };
});

describe('POST /api/search handler', () => {
  it('should authenticate user and return search results', async () => {
    const mockRequest = new Request('https://upi.edu/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'pembelajaran matematika', limit: 5 }),
    });

    const response = await searchHandler(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].title).toBe('Skripsi Mock');
  });

  it('should return 401 when there is no active session', async () => {
    mockSessionValue = null;
    const mockRequest = new Request('https://upi.edu/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'pembelajaran matematika', limit: 5 }),
    });

    const response = await searchHandler(mockRequest);
    expect(response.status).toBe(401);
    mockSessionValue = { user: { email: 'mhs@upi.edu' } };
  });
});

describe('POST /api/chat handler', () => {
  it('should authenticate user and return streaming chat response', async () => {
    const mockRequest = new Request('https://upi.edu/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Cari skripsi tentang AI' }],
      }),
    });

    const response = await chatHandler(mockRequest);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('Mock stream response');
  });

  it('should return 401 when there is no active session', async () => {
    mockSessionValue = null;
    const mockRequest = new Request('https://upi.edu/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Cari skripsi tentang AI' }],
      }),
    });

    const response = await chatHandler(mockRequest);
    expect(response.status).toBe(401);
    mockSessionValue = { user: { email: 'mhs@upi.edu' } };
  });
});
