import { describe, expect, it } from 'vitest';
import { addItem, updateQuantity } from './CartContext';

const product = {
  id: 42,
  slug: 'stock-aware-mouse',
  name: 'Stock-aware Mouse',
  brand: 'ByteForge',
  categoryId: 'mice',
  categoryName: 'Mice',
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
});
