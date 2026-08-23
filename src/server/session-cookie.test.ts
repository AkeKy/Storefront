import { afterEach, describe, expect, it, vi } from 'vitest';

import { sessionCookieOptions } from './session-cookie';

afterEach(() => vi.unstubAllEnvs());

describe('sessionCookieOptions', () => {
  it('creates the production HttpOnly same-site session cookie', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(sessionCookieOptions(7200)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 7200,
    });
  });

  it('allows secure-cookie-free local development without weakening production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(sessionCookieOptions(0)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 0,
    });
  });
});
