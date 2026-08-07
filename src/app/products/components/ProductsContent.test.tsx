import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from '@/features/cart/CartContext';
import ProductsContent from './ProductsContent';

const products = [
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
  {
    id: 2,
    slug: 'razer-deathadder-v3',
    name: 'Razer DeathAdder V3',
    brand: 'Razer',
    categoryId: 'mice',
    categoryName: 'Mice',
    priceTHB: 2990,
    image: '/images/products/razer-deathadder-v3.jpg',
    imageAlt: 'Razer DeathAdder V3 gaming mouse',
    stockQuantity: 5,
  },
];

vi.mock('@/features/catalog/catalog-service', () => ({
  catalogService: {
    listCategories: vi.fn().mockResolvedValue([
      { id: 'keyboards', name: 'Keyboards' },
      { id: 'mice', name: 'Mice' },
    ]),
    listProducts: vi.fn().mockImplementation(({ query = '' } = {}) => {
      const normalizedQuery = query.toLowerCase();
      const filteredProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.brand.toLowerCase().includes(normalizedQuery)
      );

      return Promise.resolve({ products: filteredProducts, total: filteredProducts.length });
    }),
  },
}));

describe('ProductsContent', () => {
  it('filters products when a customer searches by brand', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <ProductsContent initialCategoryId={undefined} />
      </CartProvider>
    );

    await screen.findByText('Razer DeathAdder V3');
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'Keychron');

    expect(await screen.findByText('Keychron Q6 Max')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Razer DeathAdder V3')).not.toBeInTheDocument();
    });
  });

  it('keeps brand options available after a search has no matches', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <ProductsContent initialCategoryId={undefined} />
      </CartProvider>
    );

    await screen.findByText('Razer DeathAdder V3');
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'not-a-product');

    await screen.findByRole('heading', { name: /no products found/i });
    expect(screen.getByRole('option', { name: 'Razer' })).toBeInTheDocument();
  });
});
