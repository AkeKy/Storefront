import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOrder } from './order-service';

describe('createOrder', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('always returns a demo preview without making a browser API request', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const legacyCaller = createOrder as unknown as (
      ...args: unknown[]
    ) => ReturnType<typeof createOrder>;

    await expect(legacyCaller([], 'browser-token')).resolves.toEqual({ mode: 'demo' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
