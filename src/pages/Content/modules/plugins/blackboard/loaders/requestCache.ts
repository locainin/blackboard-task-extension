type BlackboardCacheEntry = {
  expiresAt: number;
  lastAccessedAt: number;
  value: unknown;
};

const MAX_CACHE_ENTRIES = 120;
const blackboardCache = new Map<string, BlackboardCacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

function pruneBlackboardCache(now: number) {
  blackboardCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) blackboardCache.delete(key);
  });

  if (blackboardCache.size <= MAX_CACHE_ENTRIES) return;

  const staleFirst = Array.from(blackboardCache.entries()).sort(
    (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
  );

  staleFirst
    .slice(0, blackboardCache.size - MAX_CACHE_ENTRIES)
    .forEach(([key]) => blackboardCache.delete(key));
}

export async function getCachedBlackboardRequest<T>(
  cacheKey: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  if (ttlMs <= 0) return loader();

  const now = Date.now();
  const cached = blackboardCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    cached.lastAccessedAt = now;
    return cached.value as T;
  }

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) return inflight as Promise<T>;

  const request = loader()
    .then((value) => {
      const nextNow = Date.now();
      blackboardCache.set(cacheKey, {
        value,
        expiresAt: nextNow + ttlMs,
        lastAccessedAt: nextNow,
      });
      pruneBlackboardCache(nextNow);
      return value;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request as Promise<unknown>);
  return request;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;

  function claimNextIndex() {
    // Hand out one index at a time so each worker owns a unique slot
    // Returning null gives the workers a clean exit without a constant loop
    if (nextIndex >= items.length) return null;

    const currentIndex = nextIndex;
    nextIndex += 1;
    return currentIndex;
  }

  const worker = async () => {
    let index = claimNextIndex();

    while (index !== null) {
      results[index] = await mapper(items[index], index);
      index = claimNextIndex();
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export function resetBlackboardRequestCache() {
  blackboardCache.clear();
  inflightRequests.clear();
}

export function getBlackboardRequestCacheSize() {
  return blackboardCache.size;
}
