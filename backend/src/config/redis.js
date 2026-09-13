const Redis = require("ioredis");

let redisClient = null;
let isConnected = false;

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying aggressively if Redis server is not running locally
        return null;
      }
      return Math.min(times * 100, 2000);
    },
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isConnected = true;
    console.log("[Redis Cache] Connected to Redis server successfully at", redisUrl);
  }).catch((err) => {
    isConnected = false;
    console.warn(`[Redis Cache] Redis server not detected (${err.message}). Using In-Memory fallback cache.`);
  });

  redisClient.on("error", (err) => {
    isConnected = false;
    // Log once as warning to prevent log flooding
  });

  redisClient.on("ready", () => {
    isConnected = true;
  });

  redisClient.on("close", () => {
    isConnected = false;
  });
} catch (err) {
  isConnected = false;
  console.warn("[Redis Cache] Initialization skipped, utilizing in-memory cache.");
}

/**
 * Retrieves cached value by key from Redis.
 */
const getCache = async (key) => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Sets key-value pair in Redis with TTL in seconds.
 */
const setCache = async (key, value, ttlSeconds = 10800) => {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Deletes a cached key from Redis.
 */
const deleteCache = async (key) => {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    return false;
  }
};

const isRedisAvailable = () => isConnected;

module.exports = {
  redisClient,
  getCache,
  setCache,
  deleteCache,
  isRedisAvailable,
};
