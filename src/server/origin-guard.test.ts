import { afterEach, describe, expect, it, vi } from 'vitest';

import { OriginError, assertSameOrigin } from './origin-guard';

describe('assertSameOrigin', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('allows a state-changing request from its own origin', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(() =>
      assertSameOrigin(
        new Request('https://store.example.test/api/auth/login', {
          method: 'POST',
          headers: { Origin: 'https://store.example.test' },
        })
      )
    ).not.toThrow();
  });

  it('rejects a cross-origin state-changing request', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(() =>
      assertSameOrigin(
        new Request('https://store.example.test/api/auth/login', {
          method: 'POST',
          headers: { Origin: 'https://attacker.example.test' },
        })
      )
    ).toThrow(OriginError);
  });

  it('uses the configured public origin when Next receives an internal request URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://store.example.test');

    expect(() =>
      assertSameOrigin(
        new Request('http://127.0.0.1:3000/api/auth/login', {
          method: 'POST',
          headers: {
            Origin: 'https://store.example.test',
            Host: 'store.example.test',
            'X-Forwarded-Host': 'store.example.test',
            'X-Forwarded-Proto': 'https',
          },
        })
      )
    ).not.toThrow();
  });

  it('rejects a public-origin mismatch even when forwarded headers claim the matching host', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://store.example.test');

    expect(() =>
      assertSameOrigin(
        new Request('http://127.0.0.1:3000/api/auth/login', {
          method: 'POST',
          headers: {
            Origin: 'https://attacker.example.test',
            Host: 'attacker.example.test',
            'X-Forwarded-Host': 'attacker.example.test',
            'X-Forwarded-Proto': 'https',
          },
        })
      )
    ).toThrow(OriginError);
  });

  it('fails closed in production when the canonical public URL is invalid', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'not-a-url');

    expect(() =>
      assertSameOrigin(
        new Request('https://store.example.test/api/auth/login', {
          method: 'POST',
          headers: { Origin: 'https://store.example.test' },
        })
      )
    ).toThrow(OriginError);
  });
});
