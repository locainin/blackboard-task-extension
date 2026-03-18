import fetchBlackboardJson from './fetchJson';

describe('fetchBlackboardJson', () => {
  const mockedFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockedFetch as typeof fetch;
  });

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('requests Blackboard data as json and includes cookies', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/json',
      }),
      text: async () => '{"results":[{"id":"course-1"}]}',
    } as Response);

    const res = await fetchBlackboardJson<{ results: { id: string }[] }>(
      'https://example.edu/learn/api/public/v1/calendars',
      'Blackboard API request'
    );

    expect(res.results[0].id).toBe('course-1');
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://example.edu/learn/api/public/v1/calendars',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });

  it('throws a clear error when Blackboard answers with xml', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/xml',
      }),
      text: async () => '<?xml version="1.0"?><error>nope</error>',
    } as Response);

    await expect(
      fetchBlackboardJson(
        'https://example.edu/learn/api/public/v1/calendars',
        'Blackboard API request'
      )
    ).rejects.toThrow(
      'Blackboard API request returned non-JSON content (application/xml)'
    );
  });
});
