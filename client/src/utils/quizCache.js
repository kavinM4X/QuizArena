const cache = new Map();

export const getCachedQuiz = async (code, apiCall) => {
  const key = code.toUpperCase();
  const cached = cache.get(key);
  const now = Date.now();

  // Return instantly from memory if fetched in the last 60 seconds
  if (cached && now - cached.timestamp < 60000) {
    return cached.data;
  }

  const data = await apiCall();
  cache.set(key, { data, timestamp: now });
  return data;
};

export const clearQuizCache = (code) => {
  if (code) cache.delete(code.toUpperCase());
  else cache.clear();
};
