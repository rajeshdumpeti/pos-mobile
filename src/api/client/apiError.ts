export type ApiErrorCategory =
  'configuration' | 'cancelled' | 'timeout' | 'network' | 'http' | 'invalidResponse' | 'unexpected';
export class ApiError extends Error {
  readonly name = 'ApiError';
  constructor(
    readonly category: ApiErrorCategory,
    message: string,
    readonly metadata: {
      status?: number;
      code?: string;
      requestId?: string;
      retryAfterSeconds?: number;
      fields?: ReadonlyArray<{ field: string; message: string }>;
    } = {},
  ) {
    super(message);
  }
}
