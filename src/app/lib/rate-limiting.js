import { LRUCache } from 'lru-cache';

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting (Upstash, Redis Cloud)
 */

const rateLimitMap = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimit(options = {}) {
  const {
    interval = 60000, // 1 minute
    uniqueTokenPerInterval = 500,
    maxRequests = 10,
  } = options;

  return {
    check: async (limit = maxRequests, token) => {
      const tokenCount = rateLimitMap.get(token) || [0];
      
      if (tokenCount[0] === 0) {
        rateLimitMap.set(token, [1]);
      } else if (tokenCount[0] >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: Date.now() + interval,
        };
      } else {
        tokenCount[0]++;
        rateLimitMap.set(token, tokenCount);
      }

      return {
        success: true,
        limit,
        remaining: limit - tokenCount[0],
        reset: Date.now() + interval,
      };
    },
  };
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(request, identifier) {
  const limiter = rateLimit({
    interval: 60000, // 1 minute
    maxRequests: process.env.NODE_ENV === 'production' ? 50 : 1000,
  });

  const result = await limiter.check(
    process.env.NODE_ENV === 'production' ? 50 : 1000,
    identifier
  );

  // Add rate limit headers
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };

  return { result, headers };
}
