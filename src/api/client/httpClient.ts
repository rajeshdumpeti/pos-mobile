import { ApiError } from './apiError';
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
/** Content-free origin of a create request. Diagnostic only; the server never rejects it. */
export type EntrySource = 'manual' | 'quick_log' | 'voice';
const entrySources: readonly EntrySource[] = ['manual', 'quick_log', 'voice'];
export type HttpRequest<TBody = never> = {
  path: string;
  method: HttpMethod;
  body?: TBody;
  expectedStatuses: readonly number[];
  requestId?: string;
  credential?: string;
  idempotencyKey?: string;
  entrySource?: EntrySource;
  query?: Readonly<{
    timezone?: string;
    selected_date?: string;
    limit?: number;
    cursor?: string;
    source?: 'all' | 'today' | 'plan';
  }>;
  signal?: AbortSignal;
  timeoutMs?: number;
};
type FetchLike = typeof fetch;
const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const allowedPath =
  /^\/(?:api\/v1\/(?:auth|onboarding)(?:\/|$)|api\/v1\/account\/timezone$|api\/v1\/notifications(?:\/unread-count|\/read-all|\/[0-9a-f-]{36}\/read)?$|api\/v1\/today$|api\/v1\/features$|api\/v1\/plan$|api\/v1\/plan\/items(?:\/[0-9a-f-]{36}(?:\/complete)?)?$|health$)/i;
function authorization(credential?: string) {
  if (credential === undefined) return undefined;
  if (!credential || /[\r\n\s]/.test(credential))
    throw new ApiError('configuration', 'The access credential is malformed.');
  return `Bearer ${credential}`;
}
function safeEnvelope(value: unknown) {
  if (!value || typeof value !== 'object') return {};
  const v = value as Record<string, unknown>;
  const requestId =
    typeof v.request_id === 'string' && requestIdPattern.test(v.request_id)
      ? v.request_id
      : undefined;
  const code =
    typeof v.code === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(v.code) ? v.code : undefined;
  const retry =
    typeof v.retry_after_seconds === 'number' &&
    Number.isInteger(v.retry_after_seconds) &&
    v.retry_after_seconds >= 1 &&
    v.retry_after_seconds <= 3600
      ? v.retry_after_seconds
      : undefined;
  const retryAt =
    typeof v.retry_at === 'string' &&
    v.retry_at.length <= 64 &&
    Number.isFinite(Date.parse(v.retry_at))
      ? v.retry_at
      : undefined;
  const actions = Array.isArray(v.actions)
    ? v.actions.filter(
        (action): action is string =>
          typeof action === 'string' &&
          ['verify_email', 'refresh_registration_policy', 'sign_in', 'forgot_password'].includes(
            action,
          ),
      )
    : undefined;
  const fields = Array.isArray(v.details)
    ? v.details.flatMap((d) => {
        if (!d || typeof d !== 'object') return [];
        const x = d as Record<string, unknown>;
        return typeof x.field === 'string' && typeof x.message === 'string'
          ? [{ field: x.field.slice(0, 128), message: x.message.slice(0, 256) }]
          : [];
      })
    : undefined;
  return { requestId, code, retryAfterSeconds: retry, retryAt, actions, fields };
}
export function createHttpClient({
  baseUrl,
  fetchImpl = fetch,
  requestIdFactory = () => `mobile-${Date.now().toString(36)}`,
}: {
  baseUrl: string;
  fetchImpl?: FetchLike;
  requestIdFactory?: () => string;
}) {
  return async function request<TResponse, TBody = never>(
    input: HttpRequest<TBody>,
  ): Promise<TResponse> {
    if (!allowedPath.test(input.path) || input.path.includes('?') || input.path.includes('://'))
      throw new ApiError('configuration', 'The API path is not allowed.');
    const requestId =
      input.requestId && requestIdPattern.test(input.requestId)
        ? input.requestId
        : requestIdFactory();
    if (!requestIdPattern.test(requestId))
      throw new ApiError('configuration', 'Unable to create a valid request identifier.');
    const auth = authorization(input.credential);
    const keyPattern =
      input.path === '/api/v1/plan/items' ? /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/ : requestIdPattern;
    if (input.idempotencyKey && !keyPattern.test(input.idempotencyKey))
      throw new ApiError('configuration', 'The idempotency key is malformed.');
    if (
      input.entrySource !== undefined &&
      (input.path !== '/api/v1/plan/items' ||
        input.method !== 'POST' ||
        !entrySources.includes(input.entrySource))
    )
      throw new ApiError('configuration', 'The entry source is not allowed.');
    let query = '';
    if (input.query !== undefined) {
      const q = input.query;
      const plan = input.path === '/api/v1/plan';
      const inbox = input.path === '/api/v1/notifications';
      const count = input.path === '/api/v1/notifications/unread-count';
      if (
        (!plan && !inbox && !count && input.path !== '/api/v1/today') ||
        input.method !== 'GET' ||
        Object.keys(q).some(
          (key) =>
            !(
              plan
                ? ['timezone', 'selected_date', 'limit', 'cursor']
                : inbox
                  ? ['timezone', 'source', 'limit', 'cursor']
                  : count
                    ? ['source']
                    : ['timezone']
            ).includes(key),
        ) ||
        (!count && (typeof q.timezone !== 'string' || !q.timezone || q.timezone.length > 128)) ||
        (q.source !== undefined && !['all', 'today', 'plan'].includes(q.source)) ||
        (plan &&
          (typeof q.selected_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(q.selected_date))) ||
        (q.limit !== undefined && (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100)) ||
        (q.cursor !== undefined &&
          (typeof q.cursor !== 'string' || !q.cursor || q.cursor.length > 1024))
      )
        throw new ApiError('configuration', 'The API query is not allowed.');
      query =
        '?' +
        Object.entries(q)
          .filter(([, v]) => v !== undefined)
          .map(([key, v]) => `${key}=${encodeURIComponent(String(v))}`)
          .join('&');
    }
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    input.signal?.addEventListener('abort', onAbort, { once: true });
    if (input.signal?.aborted) controller.abort();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, input.timeoutMs ?? 15000);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-ID': requestId,
    };
    if (input.body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) headers.Authorization = auth;
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey;
    if (input.entrySource) headers['X-POS-Entry-Source'] = input.entrySource;
    try {
      if (input.signal?.aborted) throw new ApiError('cancelled', 'The API request was cancelled.');
      const response = await fetchImpl(`${baseUrl}${input.path}${query}`, {
        method: input.method,
        headers,
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        signal: controller.signal,
        redirect: 'error',
        credentials: 'omit',
      });
      const responseRequestId = response.headers.get('x-request-id');
      const validHeaderId =
        responseRequestId && requestIdPattern.test(responseRequestId)
          ? responseRequestId
          : undefined;
      const empty = response.status === 204 || response.headers.get('content-length') === '0';
      const contentType = response.headers.get('content-type') ?? '';
      let data: unknown;
      if (!empty) {
        if (!contentType.toLowerCase().includes('application/json'))
          throw new ApiError('invalidResponse', 'The server returned an unsupported response.', {
            status: response.status,
            requestId: validHeaderId,
          });
        try {
          data = await response.json();
        } catch {
          throw new ApiError('invalidResponse', 'The server returned an invalid response.', {
            status: response.status,
            requestId: validHeaderId,
          });
        }
      }
      if (!input.expectedStatuses.includes(response.status)) {
        const safe = safeEnvelope(data);
        const retryHeader = response.headers.get('retry-after');
        const headerSeconds =
          retryHeader && /^\d{1,4}$/.test(retryHeader) ? Number(retryHeader) : undefined;
        const retryAfterSeconds =
          headerSeconds !== undefined && headerSeconds >= 1 && headerSeconds <= 3600
            ? headerSeconds
            : safe.retryAfterSeconds;
        throw new ApiError('http', 'The API request was not accepted.', {
          status: response.status,
          code: safe.code,
          requestId: safe.requestId ?? validHeaderId,
          retryAfterSeconds,
          retryAt: safe.retryAt,
          actions: safe.actions,
          fields: safe.fields,
        });
      }
      return data as TResponse;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted)
        throw new ApiError(
          timedOut ? 'timeout' : 'cancelled',
          timedOut ? 'The API request timed out.' : 'The API request was cancelled.',
        );
      if (error instanceof TypeError) throw new ApiError('network', 'The network is unavailable.');
      throw new ApiError('unexpected', 'The API request failed.');
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener('abort', onAbort);
    }
  };
}
