import {
  getBlackboardRequestCacheSize,
  getCachedBlackboardRequest,
  mapWithConcurrency,
  resetBlackboardRequestCache,
} from './requestCache';

describe('requestCache', () => {
  beforeEach(() => {
    resetBlackboardRequestCache();
  });

  it('reuses cached blackboard responses inside the ttl', async () => {
    const loader = jest.fn().mockResolvedValue({ ok: true });

    await getCachedBlackboardRequest('cache-key', 5_000, loader);
    await getCachedBlackboardRequest('cache-key', 5_000, loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(getBlackboardRequestCacheSize()).toBe(1);
  });

  it('limits concurrent work', async () => {
    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency(
      [1, 2, 3, 4, 5],
      2,
      async (value) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        active -= 1;
        return value * 2;
      }
    );

    expect(results).toStrictEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
