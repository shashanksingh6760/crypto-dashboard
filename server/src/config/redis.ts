// Mock Redis client using in-memory Map for local dev without Docker
const cache = new Map<string, { value: string; expiry: number | null }>();

export const redis = {
  get: async (key: string): Promise<string | null> => {
    const item = cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key: string, value: string): Promise<void> => {
    cache.set(key, { value, expiry: null });
  },
  setex: async (key: string, seconds: number, value: string): Promise<void> => {
    cache.set(key, { value, expiry: Date.now() + seconds * 1000 });
  },
  publish: async (channel: string, message: string): Promise<void> => {
    // We will call the subscriber directly since it's now in the same process
    const { handleLocalPubSub } = require('../services/subscriber.service');
    handleLocalPubSub(channel, message);
  }
};

export default redis;
