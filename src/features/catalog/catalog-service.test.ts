import { describe, expect, it } from 'vitest';
import { catalogService } from './catalog-service';

describe('catalogService.listProducts', () => {
  it('matches the query against a product name and brand', async () => {
    const result = await catalogService.listProducts({ query: 'Keychron' });
    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
    expect(result.products[0].image).toBe(
      'https://images.unsplash.com/photo-1725755751265-6a7b23077316'
    );
  });

  it('returns an explicit empty result for an unavailable category', async () => {
    const result = await catalogService.listProducts({ categoryId: 'monitors', inStockOnly: true });
    expect(result.products).toHaveLength(0);
  });

  it('combines category, brand, stock, and price sort filters', async () => {
    const result = await catalogService.listProducts({
      categoryId: 'keyboards',
      brand: 'Keychron',
      inStockOnly: true,
      sort: 'price-desc',
    });

    expect(result.products.map((product) => product.name)).toEqual([
      'Keychron Q6 Max',
      'Keychron K8 Pro',
    ]);
  });

  it('returns deterministic categories', async () => {
    await expect(catalogService.listCategories()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'keyboards', name: 'Keyboards' }),
        expect.objectContaining({ id: 'mice', name: 'Mice' }),
      ])
    );
  });
});
