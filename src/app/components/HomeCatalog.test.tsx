import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/features/cart/CartContext';
import { LanguageProvider } from '@/features/i18n/LanguageContext';
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

  return (
    <output aria-label="Cart item count" aria-live="polite">
      {itemCount}
    </output>
  );
}

describe('HomeCatalog', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a factual product section and adds in-stock products to the cart', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CartProvider>
          <HomeCatalog />
          <CartItemCount />
        </CartProvider>
      </LanguageProvider>
    );

    expect(await screen.findByRole('heading', { name: /top picks/i })).toBeInTheDocument();
    expect(screen.queryByText(/12,000|happy gamers|real gamers/i)).not.toBeInTheDocument();

    const addToCart = screen.getByRole('button', { name: /add keychron q6 max to cart/i });
    expect(addToCart).toBeEnabled();

    await user.click(addToCart);

    expect(screen.getByLabelText('Cart item count')).toHaveTextContent('1');
  });

  it('translates the section copy without translating a product model name', async () => {
    window.localStorage.setItem('gadget-arena-locale', 'th');

    render(
      <LanguageProvider>
        <CartProvider>
          <HomeCatalog />
        </CartProvider>
      </LanguageProvider>
    );

    expect(await screen.findByRole('heading', { name: 'สินค้าแนะนำ' })).toBeInTheDocument();
    expect(screen.getByText('Keychron Q6 Max')).toBeInTheDocument();
  });
});
