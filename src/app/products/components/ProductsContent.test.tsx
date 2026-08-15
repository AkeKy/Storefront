import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from '@/features/cart/CartContext';
import { LanguageProvider } from '@/features/i18n/LanguageContext';
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
    categoryId: 'mouse',
    categoryName: 'Mouse',
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
      { id: 'mouse', name: 'Mouse' },
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
  it('groups catalogue filters in an accessible sidebar', async () => {
    render(
      <LanguageProvider>
        <CartProvider>
          <ProductsContent initialCategoryId={undefined} />
        </CartProvider>
      </LanguageProvider>
    );

    const filters = await screen.findByRole('complementary', { name: /filters/i });

    expect(screen.getByRole('searchbox', { name: /search products/i })).toBeInTheDocument();
    expect(within(filters).getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(within(filters).getByRole('combobox', { name: /brand/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
  });

  it('filters products when a customer searches by brand', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CartProvider>
          <ProductsContent initialCategoryId={undefined} />
        </CartProvider>
      </LanguageProvider>
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
      <LanguageProvider>
        <CartProvider>
          <ProductsContent initialCategoryId={undefined} />
        </CartProvider>
      </LanguageProvider>
    );

    await screen.findByText('Razer DeathAdder V3');
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'not-a-product');

    await screen.findByRole('heading', { name: /no products found/i });
    expect(screen.getByRole('option', { name: 'Razer' })).toBeInTheDocument();
  });

  it('translates catalog labels and categories without changing model names', async () => {
    window.localStorage.setItem('gadget-arena-locale', 'th');

    render(
      <LanguageProvider>
        <CartProvider>
          <ProductsContent initialCategoryId={undefined} />
        </CartProvider>
      </LanguageProvider>
    );

    expect(await screen.findByRole('heading', { name: 'สินค้าทั้งหมด' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'คีย์บอร์ด' })).toBeInTheDocument();
    expect(screen.getByText('Keychron Q6 Max')).toBeInTheDocument();
  });
});
