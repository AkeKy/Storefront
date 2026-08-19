import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogService } from './catalog-service';

const apiCategories = {
  status: 200,
  message: 'success',
  data: [
    { category_id: 7, category_name: 'Keyboards', description: 'Mechanical keyboards' },
    { category_id: 8, category_name: 'เมาส์ เกมมิ่ง', description: 'Gaming mouse' },
  ],
};

const apiProducts = {
  status: 200,
  message: 'success',
  data: {
    items: [
      {
        product_id: 91,
        slug: 'api-keyboard',
        product_name: 'API Keyboard',
        description: 'Loaded from Go',
        brand: 'Acme',
        category: {
          category_id: 7,
          category_name: 'Keyboards',
          description: 'Mechanical keyboards',
        },
        price: 1990,
        stock_quantity: 3,
        image_url: '',
        badge: 'Limited',
      },
    ],
    total: 1,
    page: 1,
    limit: 100,
  },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const importConfiguredCatalog = async (
  fetcher: typeof fetch,
  apiUrl = ' http://localhost:1323/ '
) => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', apiUrl);
  vi.stubGlobal('fetch', fetcher);
  vi.resetModules();
  return (await import('./catalog-service')).catalogService;
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

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

  it('filters products below or equal to maxPrice', async () => {
    const result = await catalogService.listProducts({
      maxPrice: 5000,
    });

    expect(result.products.map((product) => product.name)).toEqual(
      expect.arrayContaining([
        'Logitech G Pro X Superlight 2',
        'HyperX Cloud III',
        'Samsung 990 EVO Plus 1TB',
      ])
    );
    expect(result.products.map((product) => product.name)).not.toContain('Keychron Q6 Max');
    expect(result.products.every((product) => product.priceTHB <= 5000)).toBe(true);
  });

  it('returns deterministic categories', async () => {
    await expect(catalogService.listCategories()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'keyboards', name: 'Keyboards' }),
        expect.objectContaining({ id: 'mouse', name: 'Mouse' }),
      ])
    );
  });

  it('maps the configured Go API and translates every supported filter', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(apiCategories))
      .mockResolvedValueOnce(jsonResponse(apiProducts));
    const service = await importConfiguredCatalog(fetcher);

    const [categories, result] = await Promise.all([
      service.listCategories(),
      service.listProducts({
        query: 'API',
        categoryId: 'keyboards',
        brand: 'Acme',
        maxPrice: 2000,
        inStockOnly: true,
        sort: 'price-desc',
      }),
    ]);

    expect(categories).toEqual([
      { id: 'keyboards', name: 'Keyboards' },
      { id: 'เมาส์-เกมมิ่ง', name: 'เมาส์ เกมมิ่ง' },
    ]);
    expect(result).toEqual({
      products: [
        {
          id: 91,
          slug: 'api-keyboard',
          name: 'API Keyboard',
          brand: 'Acme',
          categoryId: 'keyboards',
          categoryName: 'Keyboards',
          priceTHB: 1990,
          image: '/assets/images/no_image.png',
          imageAlt: 'API Keyboard',
          stockQuantity: 3,
          badge: 'Limited',
        },
      ],
      total: 1,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);

    const productsUrl = new URL(String(fetcher.mock.calls[1]?.[0]));
    expect(productsUrl.origin + productsUrl.pathname).toBe(
      'http://localhost:1323/api/v1/products'
    );
    expect(Object.fromEntries(productsUrl.searchParams)).toEqual({
      page: '1',
      limit: '100',
      q: 'API',
      category_id: '7',
      brand: 'Acme',
      max_price: '2000',
      in_stock: 'true',
      sort: 'price_desc',
    });
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      headers: { Accept: 'application/json' },
    });
    const requestInit = fetcher.mock.calls[1]?.[1];
    expect(requestInit).not.toHaveProperty('credentials');
    expect(new Headers(requestInit?.headers).has('Authorization')).toBe(false);
  });

  it('uses fixtures without a network request when the API URL is absent', async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubGlobal('fetch', fetcher);
    vi.resetModules();
    const service = (await import('./catalog-service')).catalogService;

    const result = await service.listProducts({ query: 'Keychron' });

    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('falls back to fixtures when the configured API is offline', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'));
    const service = await importConfiguredCatalog(fetcher);

    const result = await service.listProducts({ query: 'Keychron' });

    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
    expect(warning).toHaveBeenCalledWith('Catalog API unavailable; using demo data.');
  });

  it.each([
    ['a non-2xx response', new Response('{}', { status: 503 })],
    ['invalid JSON', new Response('{', { status: 200 })],
    [
      'a malformed product DTO',
      jsonResponse({
        status: 200,
        message: 'success',
        data: { items: [{ product_id: 0 }], total: 1, page: 1, limit: 100 },
      }),
    ],
  ])('falls back to fixtures for %s', async (_case, response) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);
    const service = await importConfiguredCatalog(fetcher);

    const result = await service.listProducts({ query: 'Keychron' });

    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
  });

  it('falls back to fixture categories for a malformed category description', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        ...apiCategories,
        data: [{ ...apiCategories.data[0], description: '' }],
      })
    );
    const service = await importConfiguredCatalog(fetcher);

    const categories = await service.listCategories();

    expect(categories).toContainEqual({ id: 'keyboards', name: 'Keyboards' });
    expect(warning).toHaveBeenCalledWith('Catalog API unavailable; using demo data.');
  });

  it('falls back to fixture products for a malformed product description', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        ...apiProducts,
        data: {
          ...apiProducts.data,
          items: [{ ...apiProducts.data.items[0], description: '' }],
        },
      })
    );
    const service = await importConfiguredCatalog(fetcher);

    const result = await service.listProducts({ query: 'Keychron' });

    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
    expect(warning).toHaveBeenCalledWith('Catalog API unavailable; using demo data.');
  });

  it('falls back after the five-second API timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true }
          );
        })
    );
    const service = await importConfiguredCatalog(fetcher);

    const resultPromise = service.listProducts({ query: 'Keychron' });
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(resultPromise).resolves.toMatchObject({
      products: expect.arrayContaining([expect.objectContaining({ name: 'Keychron Q6 Max' })]),
    });
  });

  it('returns an empty result for an unknown canonical category without a product request', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(apiCategories));
    const service = await importConfiguredCatalog(fetcher);

    await expect(service.listProducts({ categoryId: 'not-a-category' })).resolves.toEqual({
      products: [],
      total: 0,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
