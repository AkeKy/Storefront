import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/features/cart/CartContext';
import { HomeCatalog } from './HomeCatalog';

vi.mock('@/features/catalog/catalog-service', () => ({
  catalogService: {
    listProducts: vi.fn().mockResolvedValue({
      products: [
        {
          id: 1,
          slug: 'keychron-q6-max',
          name: 'Keychron Q6 Max',
          brand: 'Keychron',
          categoryId: 'keyboards',
          categoryName: 'Keyboards',
          priceTHB: 8990,
          image: '/images/products/keychron-q6-max.jpg',
          imageAlt: 'Keychron Q6 Max mechanical keyboard',
          stockQuantity: 8,
        },
      ],
      total: 1,
    }),
  },
}));

function CartItemCount() {
  const { itemCount } = useCart();

  return <output aria-label="Cart item count" aria-live="polite">{itemCount}</output>;
}

describe('HomeCatalog', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a factual product section and adds in-stock products to the cart', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <HomeCatalog />
        <CartItemCount />
      </CartProvider>,
    );

    expect(await screen.findByRole('heading', { name: /selected gear/i })).toBeInTheDocument();
    expect(screen.queryByText(/12,000|happy gamers|real gamers/i)).not.toBeInTheDocument();

    const addToCart = screen.getByRole('button', { name: /add keychron q6 max to cart/i });
    expect(addToCart).toBeEnabled();

    await user.click(addToCart);

    expect(screen.getByLabelText('Cart item count')).toHaveTextContent('1');
  });
});
