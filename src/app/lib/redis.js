import { Redis } from "@upstash/redis";

// Use Upstash REST API client instead of ioredis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
