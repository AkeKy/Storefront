import type { CartItem } from '@/features/cart/CartContext';

export type OrderSubmissionResult = { mode: 'demo' | 'submitted' };

export async function createOrder(
  items: CartItem[],
  token?: string
): Promise<OrderSubmissionResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !token) return { mode: 'demo' };

  const payload = items.map((item) => ({ product_id: item.product.id, amount: item.quantity }));
  if (
    payload.some(
      ({ product_id, amount }) =>
        !Number.isSafeInteger(product_id) ||
        product_id <= 0 ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    )
  ) {
    throw new Error('Invalid cart item. Please update your cart and try again.');
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('We could not submit your order. Please try again.');
  return { mode: 'submitted' };
}
