import { ApiError } from './apiError';
import { createHttpClient } from './httpClient';
const json = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-request-id': 'server-1',
  },
) => new Response(JSON.stringify(body), { status, headers });
test('constructs safe JSON requests and omits undefined fields', async () => {
  const fetcher = jest.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    json({ ok: true }),
  );
  const request = createHttpClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: fetcher,
    requestIdFactory: () => 'generated-1',
  });
  await expect(
    request({
      path: '/api/v1/auth/sessions',
      method: 'POST',
      body: { email: 'a@example.test', optional: undefined },
      expectedStatuses: [200],
      requestId: 'caller-1',
      credential: 'access',
    }),
  ).resolves.toEqual({ ok: true });
  expect(fetcher).toHaveBeenCalledTimes(1);
  const [url, init] = fetcher.mock.calls[0]!;
  expect(init).toBeDefined();
  expect(url).toBe('https://api.example.test/api/v1/auth/sessions');
  expect(init!.headers).toEqual(
    expect.objectContaining({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Request-ID': 'caller-1',
      Authorization: 'Bearer access',
    }),
  );
  expect(init!.body).toBe('{"email":"a@example.test"}');
  expect(init!.credentials).toBe('omit');
  expect(init!.redirect).toBe('error');
});
test('replaces invalid request IDs and rejects credential injection and paths', async () => {
  const fetcher = jest.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json({}));
  const request = createHttpClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: fetcher,
    requestIdFactory: () => 'safe-1',
  });
  await request({ path: '/health', method: 'GET', expectedStatuses: [200], requestId: 'bad id' });
  expect(fetcher.mock.calls[0]![1]!.headers).toEqual(
    expect.objectContaining({ 'X-Request-ID': 'safe-1' }),
  );
  await expect(
    request({
      path: '/api/v1/auth/session',
      method: 'GET',
      expectedStatuses: [200],
      credential: 'bad\ntoken',
    }),
  ).rejects.toMatchObject({ category: 'configuration' });
  await expect(
    request({ path: 'https://evil.test', method: 'GET', expectedStatuses: [200] }),
  ).rejects.toBeInstanceOf(ApiError);
});
test('handles JSON, 204, backend errors and invalid content safely', async () => {
  const responses = [
    new Response(null, { status: 204 }),
    json(
      {
        code: 'rate_limited',
        request_id: 'req-1',
        retry_after_seconds: 30,
        retry_at: '2026-09-15T12:00:30Z',
        actions: ['verify_email', 'untrusted_action'],
        details: [{ field: 'email', message: 'Invalid' }],
        raw: 'secret',
      },
      429,
      {
        'content-type': 'application/json',
        'x-request-id': 'server-1',
        'retry-after': '45',
      },
    ),
    new Response('<html>secret</html>', { status: 502, headers: { 'content-type': 'text/html' } }),
  ];
  const request = createHttpClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: jest.fn(async () => responses.shift()!),
    requestIdFactory: () => 'id-1',
  });
  await expect(
    request({ path: '/api/v1/auth/session', method: 'DELETE', expectedStatuses: [204] }),
  ).resolves.toBeUndefined();
  await expect(
    request({ path: '/api/v1/auth/sessions', method: 'POST', expectedStatuses: [200] }),
  ).rejects.toMatchObject({
    category: 'http',
    metadata: {
      status: 429,
      code: 'rate_limited',
      requestId: 'req-1',
      retryAfterSeconds: 45,
      retryAt: '2026-09-15T12:00:30Z',
      actions: ['verify_email'],
    },
  });
  const error = await request({ path: '/health', method: 'GET', expectedStatuses: [200] }).catch(
    (e) => e,
  );
  expect(error).toMatchObject({ category: 'invalidResponse' });
  expect(JSON.stringify(error)).not.toContain('secret');
});
test('distinguishes timeout, cancellation and network without retry', async () => {
  jest.useFakeTimers();
  const never = jest.fn(
    (_u: unknown, init?: RequestInit) =>
      new Promise((_r, reject) =>
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        ),
      ),
  );
  const request = createHttpClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: never as typeof fetch,
    requestIdFactory: () => 'id-1',
  });
  const timed = request({ path: '/health', method: 'GET', expectedStatuses: [200], timeoutMs: 5 });
  const timedExpectation = expect(timed).rejects.toMatchObject({ category: 'timeout' });
  await jest.advanceTimersByTimeAsync(5);
  await timedExpectation;
  expect(never).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
  const controller = new AbortController();
  controller.abort();
  await expect(
    request({ path: '/health', method: 'GET', expectedStatuses: [200], signal: controller.signal }),
  ).rejects.toMatchObject({ category: 'cancelled' });
  const offline = createHttpClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: jest.fn(async () => {
      throw new TypeError('network');
    }),
  });
  await expect(
    offline({ path: '/health', method: 'GET', expectedStatuses: [200] }),
  ).rejects.toMatchObject({ category: 'network' });
});
