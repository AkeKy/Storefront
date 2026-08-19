# Gadget Arena Catalog API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Storefront catalog to the public Go API while preserving the current UI and automatically falling back to safe fixture data.

**Architecture:** Keep the existing 'CatalogService' facade, move current in-memory behavior into 'fixtureCatalogService', and add an API adapter that validates and maps Go DTOs. The facade selects fixtures when no API URL exists and catches configured API failures to repeat the same operation against fixtures.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Testing Library, Go/Echo, MySQL 8.4, Docker Compose

**Spec:** `docs/superpowers/specs/2026-08-20-catalog-api-integration-design.md`

## Global Constraints

- Retain the existing 'CatalogService' boundary used by the home and products pages.
- Automatically use fixture data when 'NEXT_PUBLIC_API_URL' is absent or an API catalog request fails.
- A fallback emits exactly 'Catalog API unavailable; using demo data.' in the developer console and does not expose raw errors.
- Category keys use NFKD normalization, lowercase Unicode letters/numbers/combining marks, hyphenated separators, and no surrounding hyphens.
- Public catalog requests send no credentials, cookies, or authorization headers.
- Product list requests use 'page=1&limit=100'.
- Supported sorts are exactly 'featured', 'price-asc', and 'price-desc'; review-based sorts are removed.
- Missing or blank API image URLs map to '/assets/images/no_image.png'.
- API requests time out after exactly 5 seconds through an 'AbortController'.
- Do not read, print, or copy values from the existing tracked '.env'.
- Keep the local '.env' file on disk, remove it only from Git tracking, ignore '.env*', and track only '.env.example'.
- Use npm commands for Storefront setup and verification.
- Push only branch 'test' in each repository. Do not merge 'main' and do not open a pull request.

---

## Preflight: Verify the isolated workspaces and clean baselines

**Storefront worktree:** 'C:\Users\akebu\Documents\Codex\2026-08-06\new-chat-2\work\Storefront\.worktrees\Storefront'

**Backend worktree:** 'C:\Users\akebu\Documents\Codex\2026-08-06\new-chat-2\work\project_intern1\.worktrees\catalog-api'

- [ ] **Step 1: Confirm both worktrees are isolated and on branch 'test'**

Run in each repository:

~~~powershell
git rev-parse --git-dir
git rev-parse --git-common-dir
git rev-parse --show-superproject-working-tree
git branch --show-current
git status --short
~~~

Expected: Git dir differs from the common dir, no superproject path is returned, branch is 'test', and the worktree has no uncommitted changes.

- [ ] **Step 2: Install Storefront dependencies with the repository standard**

Run:

~~~powershell
npm install
~~~

Expected: exit 0 and no package-manager migration.

- [ ] **Step 3: Verify the Storefront baseline**

Run:

~~~powershell
npm test
npm run type-check
~~~

Expected: both commands exit 0 before implementation.

- [ ] **Step 4: Verify the Backend baseline and local database**

Run:

~~~powershell
go test ./...
go vet ./...
docker compose ps
~~~

Expected: Go checks exit 0 and 'gadget-arena-backend-mysql-1' is healthy on '127.0.0.1:3307'.

---

### Task 1: Isolate fixture behavior and remove unsupported sort choices

**Files:**
- Create: 'src/features/catalog/fixture-catalog-service.ts'
- Modify: 'src/features/catalog/catalog-service.ts:1-45'
- Modify: 'src/features/catalog/types.ts:1-40'
- Modify: 'src/app/products/components/ProductsContent.tsx:39-45'
- Modify: 'src/app/products/components/ProductsContent.test.tsx:62-83'
- Modify: 'src/features/i18n/messages.ts:57-61,177-181'
- Test: 'src/features/catalog/catalog-service.test.ts'

**Interfaces:**
- Consumes: existing 'CatalogService', 'CatalogFilter', 'CatalogResult', 'Category', and 'Product' types.
- Produces: 'fixtureCatalogService: CatalogService'; the public 'catalogService' continues to expose the same two methods.

- [ ] **Step 1: Add a failing UI test for the factual sort contract**

Inside the existing accessible-sidebar test, after obtaining the sort combobox, add:

~~~tsx
const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
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
~~~

The production change this test catches is reintroducing a sort option that neither data source can honor.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

~~~powershell
npm test -- src/app/products/components/ProductsContent.test.tsx
~~~

Expected: FAIL because the selector currently contains five options instead of the three literal supported options.

- [ ] **Step 3: Narrow the domain contract and UI**

Change 'CatalogSortOption' to:

~~~ts
export type CatalogSortOption = 'featured' | 'price-asc' | 'price-desc';
~~~

Change 'Product.badge' to:

~~~ts
badge?: string;
~~~

Change 'sortOptions' in 'ProductsContent.tsx' to:

~~~tsx
const sortOptions: Array<{ value: CatalogSortOption; label: string }> = [
  { value: 'featured', label: t('catalog.sortFeatured') },
  { value: 'price-asc', label: t('catalog.sortPriceAsc') },
  { value: 'price-desc', label: t('catalog.sortPriceDesc') },
];
~~~

Delete 'catalog.sortBestRated' and 'catalog.sortMostReviews' from both the English and Thai message maps. No source-text test is added; the rendered selector test covers the customer-visible behavior.

- [ ] **Step 4: Move current in-memory behavior behind a dedicated adapter**

Create 'fixture-catalog-service.ts' with the existing filtering logic:

~~~ts
import { catalogCategories, catalogProducts } from './catalog-fixtures';
import type { CatalogFilter, CatalogResult, CatalogService, Category, Product } from './types';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const sortProducts = (products: Product[], sort: CatalogFilter['sort']): Product[] => {
  if (sort === 'price-asc') {
    return [...products].sort((left, right) => left.priceTHB - right.priceTHB);
  }

  if (sort === 'price-desc') {
    return [...products].sort((left, right) => right.priceTHB - left.priceTHB);
  }

  return products;
};

export const fixtureCatalogService: CatalogService = {
  async listProducts(filter: CatalogFilter = {}): Promise<CatalogResult> {
    const query = filter.query ? normalize(filter.query) : undefined;
    const categoryId = filter.categoryId ? normalize(filter.categoryId) : undefined;
    const brand = filter.brand ? normalize(filter.brand) : undefined;

    const products = sortProducts(
      catalogProducts.filter((product) => {
        const matchesQuery =
          !query ||
          normalize(product.name).includes(query) ||
          normalize(product.brand).includes(query);
        const matchesCategory = !categoryId || normalize(product.categoryId) === categoryId;
        const matchesBrand = !brand || normalize(product.brand) === brand;
        const matchesPrice = filter.maxPrice === undefined || product.priceTHB <= filter.maxPrice;
        const matchesStock = !filter.inStockOnly || product.stockQuantity > 0;

        return matchesQuery && matchesCategory && matchesBrand && matchesPrice && matchesStock;
      }),
      filter.sort
    );

    return { products, total: products.length };
  },

  async listCategories(): Promise<Category[]> {
    return catalogCategories;
  },
};
~~~

Replace 'catalog-service.ts' temporarily with:

~~~ts
export { fixtureCatalogService as catalogService } from './fixture-catalog-service';
~~~

The existing catalog-service tests are the characterization guard for this refactor. Do not add a test that asserts the adapter's filename or source layout.

- [ ] **Step 5: Verify GREEN**

Run:

~~~powershell
npm test -- src/features/catalog/catalog-service.test.ts src/app/products/components/ProductsContent.test.tsx
npm run type-check
~~~

Expected: both focused suites and TypeScript pass.

- [ ] **Step 6: Commit Task 1**

~~~powershell
git add src/features/catalog/fixture-catalog-service.ts src/features/catalog/catalog-service.ts src/features/catalog/types.ts src/app/products/components/ProductsContent.tsx src/app/products/components/ProductsContent.test.tsx src/features/i18n/messages.ts
git commit -m "refactor: isolate fixture catalog service"
~~~

---

### Task 2: Add the validated Go API adapter and automatic fallback

**Files:**
- Create: 'src/features/catalog/api-catalog-service.ts'
- Modify: 'src/features/catalog/catalog-service.ts'
- Modify: 'src/features/catalog/catalog-service.test.ts'

**Interfaces:**
- Consumes: 'fixtureCatalogService', 'CatalogService', and optional 'NEXT_PUBLIC_API_URL'.
- Produces: 'createApiCatalogService(apiUrl, fetcher?)' for the resilient facade; 'catalogService' remains the only UI import.
- Go endpoints: 'GET /api/v1/categories' and 'GET /api/v1/products'.

- [ ] **Step 1: Add shared API fixtures and cleanup to the existing service test**

Change the Vitest import to include 'afterEach' and 'vi', then append these helpers:

~~~ts
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
        category: { category_id: 7, category_name: 'Keyboards' },
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

const importConfiguredCatalog = async (fetcher: typeof fetch, apiUrl = ' http://localhost:1323/ ') => {
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
~~~

- [ ] **Step 2: Add the healthy configured-API test**

~~~ts
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
~~~

This test catches using fixture data despite a configured healthy API, wrong DTO mapping, duplicate category lookup, incorrect query names, or sending a review-based sort.

- [ ] **Step 3: Run the focused suite and verify RED**

Run:

~~~powershell
npm test -- src/features/catalog/catalog-service.test.ts
~~~

Expected: FAIL because the public facade still returns fixture products and does not call 'fetch'.

- [ ] **Step 4: Implement the API adapter**

Create 'api-catalog-service.ts':

~~~ts
import type { CatalogFilter, CatalogResult, CatalogService, Category, Product } from './types';

const REQUEST_TIMEOUT_MS = 5_000;
const NO_IMAGE = '/assets/images/no_image.png';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type ApiCategory = {
  category_id: number;
  category_name: string;
  description: string;
};
type ApiProduct = {
  product_id: number;
  slug: string;
  product_name: string;
  description: string;
  brand: string;
  category: ApiCategory;
  price: number;
  stock_quantity: number;
  image_url?: string;
  badge?: string;
};
type ApiProductList = {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const invalidResponse = () => new Error('Invalid catalog response.');

const requiredString = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') throw invalidResponse();
  return value;
};

const optionalString = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw invalidResponse();
  return value;
};

const positiveSafeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw invalidResponse();
  }
  return value;
};

const nonNegativeSafeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw invalidResponse();
  }
  return value;
};

const finiteNonNegativeNumber = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw invalidResponse();
  }
  return value;
};

const nonAlphaNumeric = new RegExp('[^\\p{L}\\p{N}\\p{M}]+', 'gu');

export const canonicalCategoryKey = (value: string): string =>
  value
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(nonAlphaNumeric, '-')
    .replace(/^-+|-+$/g, '');

const parseCategory = (value: unknown): ApiCategory => {
  if (!isRecord(value)) throw invalidResponse();
  const category = {
    category_id: positiveSafeInteger(value.category_id),
    category_name: requiredString(value.category_name),
    description: typeof value.description === 'string' ? value.description : '',
  };
  if (!canonicalCategoryKey(category.category_name)) throw invalidResponse();
  return category;
};

const parseProduct = (value: unknown): ApiProduct => {
  if (!isRecord(value)) throw invalidResponse();
  return {
    product_id: positiveSafeInteger(value.product_id),
    slug: requiredString(value.slug),
    product_name: requiredString(value.product_name),
    description: typeof value.description === 'string' ? value.description : '',
    brand: requiredString(value.brand),
    category: parseCategory(value.category),
    price: finiteNonNegativeNumber(value.price),
    stock_quantity: nonNegativeSafeInteger(value.stock_quantity),
    image_url: optionalString(value.image_url),
    badge: optionalString(value.badge),
  };
};

const parseProductList = (value: unknown): ApiProductList => {
  if (!isRecord(value) || !Array.isArray(value.items)) throw invalidResponse();
  return {
    items: value.items.map(parseProduct),
    total: nonNegativeSafeInteger(value.total),
    page: positiveSafeInteger(value.page),
    limit: positiveSafeInteger(value.limit),
  };
};

const mapCategory = (category: ApiCategory): Category => ({
  id: canonicalCategoryKey(category.category_name),
  name: category.category_name,
});

const mapProduct = (product: ApiProduct): Product => ({
  id: product.product_id,
  slug: product.slug,
  name: product.product_name,
  brand: product.brand,
  categoryId: canonicalCategoryKey(product.category.category_name),
  categoryName: product.category.category_name,
  priceTHB: product.price,
  image: product.image_url?.trim() || NO_IMAGE,
  imageAlt: product.product_name,
  stockQuantity: product.stock_quantity,
  ...(product.badge?.trim() ? { badge: product.badge.trim() } : {}),
});

export function createApiCatalogService(
  rawBaseUrl: string,
  fetcher: Fetcher = (input, init) => globalThis.fetch(input, init)
): CatalogService {
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Catalog API URL is required.');

  const requestData = async (path: string): Promise<unknown> => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetcher(baseUrl + path, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Catalog request failed.');

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw invalidResponse();
      }

      if (
        !isRecord(body) ||
        body.status !== 200 ||
        typeof body.message !== 'string' ||
        !Object.prototype.hasOwnProperty.call(body, 'data')
      ) {
        throw invalidResponse();
      }
      return body.data;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  };

  let categoriesPromise: Promise<ApiCategory[]> | undefined;
  const loadCategories = (): Promise<ApiCategory[]> => {
    if (!categoriesPromise) {
      categoriesPromise = requestData('/api/v1/categories')
        .then((data) => {
          if (!Array.isArray(data)) throw invalidResponse();
          return data.map(parseCategory);
        })
        .catch((error: unknown) => {
          categoriesPromise = undefined;
          throw error;
        });
    }
    return categoriesPromise;
  };

  return {
    async listCategories(): Promise<Category[]> {
      return (await loadCategories()).map(mapCategory);
    },

    async listProducts(filter: CatalogFilter = {}): Promise<CatalogResult> {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      const query = filter.query?.trim();
      const brand = filter.brand?.trim();

      if (query) params.set('q', query);
      if (brand) params.set('brand', brand);
      if (filter.maxPrice !== undefined) {
        if (!Number.isFinite(filter.maxPrice) || filter.maxPrice < 0) {
          throw new Error('Invalid catalog filter.');
        }
        params.set('max_price', String(filter.maxPrice));
      }
      if (filter.inStockOnly) params.set('in_stock', 'true');

      const sortMap = {
        featured: 'featured',
        'price-asc': 'price_asc',
        'price-desc': 'price_desc',
      } as const;
      params.set('sort', sortMap[filter.sort ?? 'featured']);

      if (filter.categoryId) {
        const selectedKey = canonicalCategoryKey(filter.categoryId);
        const categories = await loadCategories();
        const selected = categories.find(
          (category) => canonicalCategoryKey(category.category_name) === selectedKey
        );
        if (!selected) return { products: [], total: 0 };
        params.set('category_id', String(selected.category_id));
      }

      const data = parseProductList(
        await requestData('/api/v1/products?' + params.toString())
      );
      return { products: data.items.map(mapProduct), total: data.total };
    },
  };
}
~~~

- [ ] **Step 5: Implement the resilient public facade**

Replace 'catalog-service.ts' with:

~~~ts
import { createApiCatalogService } from './api-catalog-service';
import { fixtureCatalogService } from './fixture-catalog-service';
import type { CatalogService } from './types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

const withFixtureFallback = (apiService: CatalogService): CatalogService => ({
  async listProducts(filter) {
    try {
      return await apiService.listProducts(filter);
    } catch {
      console.warn('Catalog API unavailable; using demo data.');
      return fixtureCatalogService.listProducts(filter);
    }
  },

  async listCategories() {
    try {
      return await apiService.listCategories();
    } catch {
      console.warn('Catalog API unavailable; using demo data.');
      return fixtureCatalogService.listCategories();
    }
  },
});

const createCatalogService = (): CatalogService => {
  if (!apiUrl) return fixtureCatalogService;

  try {
    return withFixtureFallback(createApiCatalogService(apiUrl));
  } catch {
    console.warn('Catalog API unavailable; using demo data.');
    return fixtureCatalogService;
  }
};

export const catalogService: CatalogService = createCatalogService();
~~~

- [ ] **Step 6: Run the healthy-path test and verify GREEN**

Run:

~~~powershell
npm test -- src/features/catalog/catalog-service.test.ts
~~~

Expected: the configured API mapping/filter test passes along with all fixture behavior tests.

- [ ] **Step 7: Add failure-mode tests**

Append these customer-visible behavior tests:

~~~ts
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

  expect(result.products.map((product) => product.name)).toEqual(['Keychron Q6 Max']);
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

  expect(result.products.map((product) => product.name)).toEqual(['Keychron Q6 Max']);
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
    products: [expect.objectContaining({ name: 'Keychron Q6 Max' })],
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
~~~

The production changes these tests catch are accidental mandatory networking, outage propagation, malformed cart products, missing timeout fallback, or fabricated numeric category IDs.

- [ ] **Step 8: Run focused and full frontend checks**

Run:

~~~powershell
npm test -- src/features/catalog/catalog-service.test.ts src/app/products/components/ProductsContent.test.tsx src/app/components/HomeCatalog.test.tsx src/components/catalog/ProductCard.test.tsx
npm test
npm run type-check
~~~

Expected: all focused tests, all project tests, and TypeScript pass with no unhandled warnings.

- [ ] **Step 9: Commit Task 2**

~~~powershell
git add src/features/catalog/api-catalog-service.ts src/features/catalog/catalog-service.ts src/features/catalog/catalog-service.test.ts
git commit -m "feat: connect catalog to backend API"
~~~

---

### Task 3: Protect local environment files and document full-stack startup

**Files:**
- Modify: '.gitignore'
- Stop tracking without deleting: '.env'
- Create: '.env.example'
- Modify: 'README.md'

**Interfaces:**
- Produces: optional public browser variable 'NEXT_PUBLIC_API_URL=http://localhost:1323'.
- Preserves: the developer's existing local '.env' file exactly as-is.

This task changes developer configuration and human documentation only. The user explicitly approved removing '.env' from Git tracking while preserving it locally. Do not add source-text unit tests; verify filesystem and Git behavior directly.

- [ ] **Step 1: Record the safe precondition without reading the file**

Run:

~~~powershell
Test-Path -LiteralPath .env
git ls-files -- .env
~~~

Expected before the change: 'True' and '.env'. Do not run 'Get-Content', 'type', 'cat', or any command that prints '.env'.

- [ ] **Step 2: Ignore local environments while allowing the template**

Add to '.gitignore':

~~~gitignore
# Local environment files
.env*
!.env.example
~~~

Create '.env.example':

~~~dotenv
NEXT_PUBLIC_API_URL=http://localhost:1323
~~~

- [ ] **Step 3: Remove '.env' from the index only**

Run:

~~~powershell
git rm --cached -- .env
~~~

This stages deletion from Git but leaves the local file on disk.

- [ ] **Step 4: Replace the obsolete backend-status copy in README**

Document these exact facts:

- The catalog uses the public Go API when 'NEXT_PUBLIC_API_URL' is configured.
- Missing/unavailable/invalid API responses fall back to local fixtures.
- Catalog calls require no token; checkout remains demo-first without a developer-provided authenticated session.
- 'NEXT_PUBLIC_*' values are browser-visible and must never contain secrets.
- Copy '.env.example' to '.env.local' for full-stack local development.
- Backend local startup uses Docker MySQL, generated dev keys, all documented process-local 'DATABASE_*' values, and port '1323'.
- Storefront continues to use 'npm install' and 'npm run dev' on port '4028'.
- Removing '.env' now does not remove historic values; real credentials must be rotated.

Use this full-stack quick-start block:

~~~markdown
### Run with the local Go API

In 'project_intern1/.worktrees/catalog-api':

```powershell
Copy-Item .env.example .env
docker compose up -d
go run ./cmd/generate-dev-keys
$env:DATABASE_USER = 'gadget_arena'
$env:DATABASE_PASSWORD = 'local_app_password'
$env:DATABASE_ADDR = '127.0.0.1'
$env:DATABASE_DBNAME = 'gadget_arena'
$env:DATABASE_PORT = '3307'
$env:SERVER_PORT = '1323'
go run .
```

In the Storefront:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```
~~~

- [ ] **Step 5: Verify environment safety and documentation hygiene**

Run:

~~~powershell
Test-Path -LiteralPath .env
git ls-files -- .env
git check-ignore -v .env
git check-ignore -v .env.local
git check-ignore -v .env.example
git status --short
git diff --check
~~~

Expected:

- 'Test-Path' remains 'True'.
- 'git ls-files -- .env' prints nothing.
- '.env' and '.env.local' are ignored.
- '.env.example' is not ignored and is staged/tracked.
- No '.env' contents appear in command output or staged additions.
- Whitespace check exits 0.

- [ ] **Step 6: Commit Task 3**

~~~powershell
git add .gitignore .env.example README.md
git commit -m "docs: configure full-stack catalog development"
~~~

---

### Task 4: Verify the live integration and publish both test branches

**Files:** No production files. This task verifies the committed result and publishes already-approved branch state.

**Interfaces:**
- Backend URL: 'http://127.0.0.1:1323'
- Storefront URL: 'http://localhost:4028'
- Database: local Docker 'gadget_arena' only

- [ ] **Step 1: Run complete static verification**

In Storefront:

~~~powershell
npm test
npm run type-check
npm run build
git diff --check
git status --short
~~~

In Backend:

~~~powershell
go test ./...
go vet ./...
docker compose ps
git diff --check
git status --short
~~~

Expected: all commands exit 0, MySQL is healthy, and both worktrees are clean.

- [ ] **Step 2: Start the Backend with local-only process variables**

In a dedicated terminal session in the Backend worktree:

~~~powershell
$env:DATABASE_USER = 'gadget_arena'
$env:DATABASE_PASSWORD = 'local_app_password'
$env:DATABASE_ADDR = '127.0.0.1'
$env:DATABASE_DBNAME = 'gadget_arena'
$env:DATABASE_PORT = '3307'
$env:SERVER_PORT = '1323'
go run .
~~~

Do not start the server without every variable above. Confirm the process listens on port '1323'.

- [ ] **Step 3: Verify the live API contract**

Run:

~~~powershell
Invoke-RestMethod http://127.0.0.1:1323/health
Invoke-RestMethod http://127.0.0.1:1323/api/v1/categories
Invoke-RestMethod 'http://127.0.0.1:1323/api/v1/products?q=Keychron&sort=price_desc&in_stock=true&page=1&limit=100'
~~~

Expected: health/database are 'ok', category data is non-empty, and the filtered product list contains Keychron products.

- [ ] **Step 4: Start Storefront against the live API**

In a dedicated Storefront terminal session:

~~~powershell
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:1323'
npm run dev
~~~

Open 'http://localhost:4028/products'. Confirm products render, a request reaches '/api/v1/products', category filtering works, and adding an in-stock product still updates the cart.

- [ ] **Step 5: Verify automatic fixture fallback**

Stop only the temporary Go API process, leave MySQL running, reload 'http://localhost:4028/products', and confirm:

- Products still render.
- Search/category filters still work.
- The browser console contains 'Catalog API unavailable; using demo data.'.
- The customer UI does not show a backend error.

Then stop the temporary Storefront dev process. Verify port '1323' and port '4028' no longer have test listeners.

- [ ] **Step 6: Request whole-branch review and address any blocking findings**

Generate a review package from 'origin/test' to the current Storefront 'HEAD'. The reviewer must check spec compliance and code quality, with special attention to DTO validation, fallback consistency, secret handling, and misleading review/rating UI. Apply one reviewed fix wave if necessary, then rerun all checks from Step 1.

- [ ] **Step 7: Push Backend branch 'test' without a PR**

Run:

~~~powershell
git push -u origin test
git rev-list --left-right --count origin/test...test
~~~

Expected: push succeeds and the count is '0 0'.

- [ ] **Step 8: Push Storefront branch 'test' without a PR**

Run:

~~~powershell
git push origin test
git rev-list --left-right --count origin/test...test
~~~

Expected: push succeeds and the count is '0 0'. Do not run 'gh pr create' and do not merge either branch.
