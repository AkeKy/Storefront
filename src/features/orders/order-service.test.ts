import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOrder } from './order-service';
import type { CartItem } from '@/features/cart/CartContext';

const items = [{ quantity: 2, product: { id: 7 } }] as unknown as CartItem[];

describe('createOrder', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('posts the exact backend order payload when configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test/');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await createOrder(items, 'token');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/v1/orders', expect.objectContaining({
      method: 'POST', body: JSON.stringify([{ product_id: 7, amount: 2 }]),
    }));
  });
});
