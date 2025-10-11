// /lib/cache/cache.js
import { redis } from "../redis";

export async function cacheGet(key, fetchFn, ttl = 60) {
  try {
    const cached = await redis.get(key);
    if (cached) return cached;

    const data = await fetchFn();
    await redis.set(key, data, { ex: ttl });
    return data;
  } catch (err) {
    console.error("Redis cache error:", err);
    // Fail gracefully — return live data if Redis unavailable
    return fetchFn();
  }
}
