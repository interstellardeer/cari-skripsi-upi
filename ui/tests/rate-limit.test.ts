import { describe, it, expect, vi } from 'vitest';

// Bun-compatible mocks for bun test runner
if (typeof Bun !== 'undefined') {
  const { mock } = require('bun:test');
  
  mock.module('@upstash/ratelimit', () => {
    class MockRatelimit {
      limit(key: string) {
        if (key === 'over_limit_user') {
          return Promise.resolve({ success: false });
        }
        return Promise.resolve({ success: true });
      }
      static slidingWindow() {}
    }
    return { Ratelimit: MockRatelimit };
  });

  mock.module('@vercel/kv', () => ({
    kv: {},
  }));
}

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit = vi.fn().mockImplementation((key) => {
      if (key === 'over_limit_user') {
        return Promise.resolve({ success: false });
      }
      return Promise.resolve({ success: true });
    });
    static slidingWindow = vi.fn();
  }
  return { Ratelimit: MockRatelimit };
});

vi.mock('@vercel/kv', () => ({
  kv: {},
}));

const checkRateLimit = async (userId: string, action: string) => {
  const mod = await import('../lib/rate-limit');
  return mod.checkRateLimit(userId, action);
};

describe('checkRateLimit helper', () => {
  it('should permit operations within standard windows', async () => {
    const res = await checkRateLimit('normal_user', 'search');
    expect(res.success).toBe(true);
  });

  it('should restrict operations when limits are reached', async () => {
    const res = await checkRateLimit('over_limit_user', 'chat');
    expect(res.success).toBe(false);
  });
});
