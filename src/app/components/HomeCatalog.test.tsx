import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from '@/features/cart/CartContext';
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

describe('HomeCatalog', () => {
  it('shows a factual product section without fabricated social proof', async () => {
    render(<CartProvider><HomeCatalog /></CartProvider>);

    expect(await screen.findByRole('heading', { name: /selected gear/i })).toBeInTheDocument();
    expect(screen.queryByText(/12,000|happy gamers|real gamers/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add .* to cart/i })).not.toBeInTheDocument();
  });
});
