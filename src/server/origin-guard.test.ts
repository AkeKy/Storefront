import { describe, expect, it } from 'vitest';

import { OriginError, assertSameOrigin } from './origin-guard';

describe('assertSameOrigin', () => {
  it('allows a state-changing request from its own origin', () => {
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
    expect(() =>
      assertSameOrigin(
        new Request('https://store.example.test/api/auth/login', {
          method: 'POST',
          headers: { Origin: 'https://attacker.example.test' },
        })
      )
    ).toThrow(OriginError);
  });
});
