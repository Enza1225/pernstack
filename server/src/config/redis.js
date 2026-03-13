const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis;
let useMemoryFallback = false;
const memoryStore = new Map();

try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        console.warn("Redis unavailable, falling back to in-memory store");
        useMemoryFallback = true;
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
    connectTimeout: 3000,
  });

  redis.on("error", () => {
    if (!useMemoryFallback) {
      useMemoryFallback = true;
      console.warn("Redis connection failed, using in-memory fallback");
    }
  });

  redis.on("connect", () => {
    useMemoryFallback = false;
    console.log("Redis connected");
  });

  redis.connect().catch(() => {
    useMemoryFallback = true;
    console.warn("Redis not available, using in-memory fallback");
  });
} catch {
  useMemoryFallback = true;
  console.warn("Redis not available, using in-memory fallback");
}

// Unified interface that falls back to in-memory Map
const redisClient = {
  async set(key, value, exFlag, exSeconds) {
    if (!useMemoryFallback && redis?.status === "ready") {
      return redis.set(key, value, exFlag, exSeconds);
    }
    memoryStore.set(key, { value, expiresAt: Date.now() + exSeconds * 1000 });
    return "OK";
  },

  async get(key) {
    if (!useMemoryFallback && redis?.status === "ready") {
      return redis.get(key);
    }
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  async del(key) {
    if (!useMemoryFallback && redis?.status === "ready") {
      return redis.del(key);
    }
    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return existed ? 1 : 0;
  },
};

// Periodic cleanup of expired in-memory entries
setInterval(() => {
  if (!useMemoryFallback) return;
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.expiresAt) memoryStore.delete(key);
  }
}, 60 * 1000);

module.exports = redisClient;
