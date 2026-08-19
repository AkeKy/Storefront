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
    listProducts: vi
      .fn()
      .mockImplementation(({ query = '', categoryId, brand, maxPrice, inStockOnly } = {}) => {
        const normalizedQuery = query.toLowerCase();
        const filteredProducts = products.filter((product) => {
          const matchesQuery =
            !query ||
            product.name.toLowerCase().includes(normalizedQuery) ||
            product.brand.toLowerCase().includes(normalizedQuery);
          const matchesCategory = !categoryId || product.categoryId === categoryId;
          const matchesBrand = !brand || product.brand === brand;
          const matchesPrice = maxPrice === undefined || product.priceTHB <= maxPrice;
          const matchesStock = !inStockOnly || product.stockQuantity > 0;
          return matchesQuery && matchesCategory && matchesBrand && matchesPrice && matchesStock;
        });

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
    expect(within(filters).getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(within(filters).getByRole('button', { name: /all brands/i })).toBeInTheDocument();
    expect(within(filters).getByRole('slider', { name: /max price/i })).toBeInTheDocument();
    expect(within(filters).getByRole('checkbox', { name: /in stock only/i })).toBeInTheDocument();
    const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
    expect(sortSelect).toBeInTheDocument();
    expect(
      within(sortSelect)
        .getAllByRole('option')
        .map((option) => ({
          label: option.textContent,
          value: option.getAttribute('value'),
        }))
    ).toEqual([
      { label: 'Featured', value: 'featured' },
      { label: 'Price: Low to High', value: 'price-asc' },
      { label: 'Price: High to Low', value: 'price-desc' },
    ]);
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

  it('filters products by selecting a category pill', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CartProvider>
          <ProductsContent initialCategoryId={undefined} />
        </CartProvider>
      </LanguageProvider>
    );

    await screen.findByText('Razer DeathAdder V3');
    const mousePill = await screen.findByRole('button', { name: 'Mouse' });
    await user.click(mousePill);

    expect(await screen.findByText('Razer DeathAdder V3')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Keychron Q6 Max')).not.toBeInTheDocument();
    });
  });

  it('resets all filters when clicking Reset All', async () => {
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

    await waitFor(() => {
      expect(screen.queryByText('Razer DeathAdder V3')).not.toBeInTheDocument();
    });

    const resetButton = screen.getByRole('button', { name: /reset all/i });
    await user.click(resetButton);

    expect(await screen.findByText('Razer DeathAdder V3')).toBeInTheDocument();
    expect(await screen.findByText('Keychron Q6 Max')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Razer' })).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'คีย์บอร์ด' })).toBeInTheDocument();
    expect(screen.getByText('Keychron Q6 Max')).toBeInTheDocument();
  });
});
