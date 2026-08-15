import { describe, expect, it } from 'vitest';
import { addItem, sanitizeStoredItems, updateQuantity } from './CartContext';

const product = {
  id: 42,
  slug: 'stock-aware-mouse',
  name: 'Stock-aware Mouse',
  brand: 'ByteForge',
  categoryId: 'mouse',
  categoryName: 'Mouse',
  priceTHB: 1990,
  image: '/mouse.jpg',
  imageAlt: 'Mouse',
  stockQuantity: 3,
};

describe('cart actions', () => {
  it('merges duplicate products and clamps quantity to stock', () => {
    const cart = addItem([], product);
    const updated = addItem(cart, product);

    expect(updated[0].quantity).toBe(2);
    expect(updateQuantity(updated, product.id, 9)[0].quantity).toBe(3);
  });

  it('discards malformed persisted entries', () => {
    expect(
      sanitizeStoredItems([
        { product: { ...product, id: 0 }, quantity: 1 },
        { product, quantity: 1.5 },
        { product, quantity: 2 },
      ])
    ).toEqual([{ product, quantity: 2 }]);
  });
});
