import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const cookieSet = vi.fn();
  return {
    cookieSet,
    cookieStore: { get: vi.fn(), set: cookieSet },
    backendRequest: vi.fn(),
    authenticatedBackendRequest: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock('@/server/backend-client', () => ({
  BackendError: class BackendError extends Error {},
  backendRequest: mocks.backendRequest,
  authenticatedBackendRequest: mocks.authenticatedBackendRequest,
}));

import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { POST as register } from './register/route';
import { GET as session } from './session/route';

const sameOrigin = { Origin: 'https://store.example.test' };
const request = (url: string, init: RequestInit = {}) =>
  new Request(url, { ...init, headers: { ...sameOrigin, ...init.headers } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieStore.get.mockReturnValue(undefined);
});

describe('auth BFF routes', () => {
  it('stores the login token in the cookie and returns only the browser session fields', async () => {
    mocks.backendRequest.mockResolvedValue({
      access_token: 'jwt-never-for-browser',
      expires_at: 1_800_000_000,
      user: {
        member_id: 17,
        username: 'buyer',
        first_name: 'Buy',
        permission_id: 2,
        permission_name: 'Member',
      },
    });
    vi.spyOn(Date, 'now').mockReturnValue(1_799_992_800_000);

    const response = await login(
      request('https://store.example.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'buyer', password: 'submitted-password' }),
      })
    );

    const browserBody = await response.json();
    expect(browserBody).toEqual({
      user: {
        member_id: 17,
        username: 'buyer',
        first_name: 'Buy',
        permission_id: 2,
        permission_name: 'Member',
      },
      expiresAt: 1_800_000_000,
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'gadget_arena_session',
      'jwt-never-for-browser',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7200 })
    );
    expect(JSON.stringify(browserBody)).not.toContain('access_token');
  });

  it('forwards exactly the seven approved registration fields', async () => {
    mocks.backendRequest.mockResolvedValue(undefined);
    const payload = {
      username: 'buyer',
      password: 'submitted-password',
      first_name: 'Buy',
      last_name: 'Er',
      email: 'buyer@example.test',
      phone: '0812345678',
      birth_date: '2000-01-02',
      permission_id: 1,
      audit_note: 'forged',
    };

    const response = await register(
      request('https://store.example.test/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.backendRequest).toHaveBeenCalledWith(
      '/api/v1/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'buyer',
          password: 'submitted-password',
          first_name: 'Buy',
          last_name: 'Er',
          email: 'buyer@example.test',
          phone: '0812345678',
          birth_date: '2000-01-02',
        }),
      })
    );
  });

  it('rejects a cross-origin POST before it calls the backend', async () => {
    const response = await login(
      new Request('https://store.example.test/api/auth/login', {
        method: 'POST',
        headers: { Origin: 'https://attacker.example.test' },
        body: '{}',
      })
    );

    expect(response.status).toBe(403);
    expect(mocks.backendRequest).not.toHaveBeenCalled();
  });

  it('clears the session cookie on same-origin logout without needing the backend', async () => {
    const response = await logout(
      request('https://store.example.test/api/auth/logout', { method: 'POST' })
    );

    expect(response.status).toBe(204);
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'gadget_arena_session',
      '',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
    );
    expect(mocks.backendRequest).not.toHaveBeenCalled();
  });

  it('allows a safe GET with no Origin and restores the server-validated user', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'cookie-jwt' });
    mocks.authenticatedBackendRequest.mockResolvedValue({
      member_id: 17,
      username: 'buyer',
      first_name: 'Buy',
      permission_id: 2,
      permission_name: 'Member',
      access_token: 'must-not-reach-browser',
    });

    const response = await session(new Request('https://store.example.test/api/auth/session'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        member_id: 17,
        username: 'buyer',
        first_name: 'Buy',
        permission_id: 2,
        permission_name: 'Member',
      },
    });
    expect(mocks.authenticatedBackendRequest).toHaveBeenCalledWith('/api/v1/me', 'cookie-jwt');
  });
});
