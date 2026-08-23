import { afterEach, describe, expect, it, vi } from 'vitest';

import { authenticatedBackendRequest, BackendError, backendRequest } from './backend-client';

const success = (data: unknown) =>
  new Response(JSON.stringify({ status: 200, code: 'success', message: 'success', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('backendRequest', () => {
  it('normalizes the server-only base URL and only permits API v1 paths', async () => {
    vi.stubEnv('BACKEND_API_URL', ' https://api.example.test/ ');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(success({ member_id: 17 }));
    vi.stubGlobal('fetch', fetcher);

    await expect(backendRequest<{ member_id: number }>('/api/v1/login')).resolves.toEqual({
      member_id: 17,
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/login',
      expect.objectContaining({ credentials: 'omit' })
    );
    await expect(backendRequest('/outside-api')).rejects.toThrow('backend path');
  });

  it('rejects missing or non-HTTP backend base URLs before making a request', async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetcher);

    await expect(backendRequest('/api/v1/login')).rejects.toThrow('BACKEND_API_URL');
    vi.stubEnv('BACKEND_API_URL', 'ftp://api.example.test');
    await expect(backendRequest('/api/v1/login')).rejects.toThrow('HTTP');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps a validated backend error envelope without exposing malformed response data', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://api.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 401,
            code: 'invalid_credentials',
            message: 'Invalid username or password',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(backendRequest('/api/v1/login')).rejects.toEqual(
      new BackendError(401, 'invalid_credentials', 'Invalid username or password')
    );
  });

  it('aborts an unfinished backend request after five seconds', async () => {
    vi.useFakeTimers();
    vi.stubEnv('BACKEND_API_URL', 'https://api.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError'))
            );
          })
      )
    );

    const pending = backendRequest('/api/v1/me');
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });

  it('attaches the bearer token only to the server-to-server request', async () => {
    vi.stubEnv('BACKEND_API_URL', 'https://api.example.test');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(success({ member_id: 17 }));
    vi.stubGlobal('fetch', fetcher);

    await authenticatedBackendRequest('/api/v1/me', 'server-only-jwt');

    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer server-only-jwt'
    );
  });
});
