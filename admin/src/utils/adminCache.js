const cache = new Map();
const pendingRequests = new Map();

export const getCachedAdminData = async (key, fetcher, ttlMs = 15000) => {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
};

export const clearAdminCache = (key) => {
  if (key) cache.delete(key);
  else cache.clear();
};
