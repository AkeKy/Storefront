import 'server-only';

const REQUEST_TIMEOUT_MS = 5_000;

type BackendEnvelope = {
  status: number;
  code?: string;
  message: string;
  data?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBackendEnvelope = (value: unknown): value is BackendEnvelope =>
  isRecord(value) &&
  typeof value.status === 'number' &&
  Number.isInteger(value.status) &&
  typeof value.message === 'string' &&
  (value.code === undefined || typeof value.code === 'string');

export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

const backendBaseUrl = (): URL => {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured) throw new Error('BACKEND_API_URL is required.');

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('BACKEND_API_URL must be a valid HTTP URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('BACKEND_API_URL must use HTTP or HTTPS.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('BACKEND_API_URL must be an origin URL.');
  }
  return url;
};

const backendUrl = (path: string): string => {
  if (!path.startsWith('/api/v1/')) throw new Error('Invalid backend path.');
  const baseUrl = backendBaseUrl();
  const url = new URL(path, baseUrl);
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith('/api/v1/')) {
    throw new Error('Invalid backend path.');
  }
  return url.toString();
};

const parseEnvelope = async (response: Response): Promise<BackendEnvelope> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BackendError(502, 'invalid_response', 'Invalid backend response.');
  }
  if (!isBackendEnvelope(body)) {
    throw new BackendError(502, 'invalid_response', 'Invalid backend response.');
  }
  if (body.status !== response.status) {
    throw new BackendError(502, 'invalid_response', 'Invalid backend response.');
  }
  return body;
};

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = backendUrl(path);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  try {
    let response: Response;
    try {
      response = await globalThis.fetch(url, {
        ...init,
        headers,
        credentials: 'omit',
        signal: controller.signal,
      });
    } catch (_error) {
      if (controller.signal.aborted) {
        throw new BackendError(504, 'backend_timeout', 'Backend request timed out.');
      }
      throw new BackendError(502, 'backend_unavailable', 'Backend request failed.');
    }

    const envelope = await parseEnvelope(response);
    if (!response.ok || envelope.status < 200 || envelope.status >= 300) {
      throw new BackendError(
        response.status,
        envelope.code || 'backend_error',
        envelope.message || 'Backend request failed.'
      );
    }
    return envelope.data as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export function authenticatedBackendRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return backendRequest<T>(path, { ...init, headers });
}
