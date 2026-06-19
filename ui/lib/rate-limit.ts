import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const searchLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
});

const chatLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function checkRateLimit(key: string, type: 'search' | 'chat') {
  const limiter = type === 'search' ? searchLimit : chatLimit;
  const result = await limiter.limit(key);
  return {
    success: result.success,
  };
}
