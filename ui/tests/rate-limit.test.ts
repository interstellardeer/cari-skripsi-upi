import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from '../lib/rate-limit';

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
