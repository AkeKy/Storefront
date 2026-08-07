import type { CartItem } from '@/features/cart/CartContext';

export type OrderSubmissionResult = { mode: 'demo' | 'submitted' };

export async function createOrder(items: CartItem[], token?: string): Promise<OrderSubmissionResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !token) return { mode: 'demo' };

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items.map((item) => ({ product_id: item.product.id, amount: item.quantity }))),
  });
  if (!response.ok) throw new Error('We could not submit your order. Please try again.');
  return { mode: 'submitted' };
}
