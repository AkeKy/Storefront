import type { CatalogFilter, CatalogResult, CatalogService, Category, Product } from './types';

const REQUEST_TIMEOUT_MS = 5_000;
const NO_IMAGE = '/assets/images/no_image.png';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type ApiCategory = {
  category_id: number;
  category_name: string;
};
type ApiProduct = {
  product_id: number;
  slug: string;
  product_name: string;
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
        credentials: 'omit',
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
  let categoryIdsByKey: Map<string, number> | undefined;
  const loadCategories = (): Promise<ApiCategory[]> => {
    if (!categoriesPromise) {
      categoriesPromise = requestData('/api/v1/categories')
        .then((data) => {
          if (!Array.isArray(data)) throw invalidResponse();
          const categories = data.map(parseCategory);
          categoryIdsByKey = new Map(
            categories.map((category) => [
              canonicalCategoryKey(category.category_name),
              category.category_id,
            ])
          );
          return categories;
        })
        .catch((error: unknown) => {
          categoriesPromise = undefined;
          categoryIdsByKey = undefined;
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
        await loadCategories();
        const selectedId = categoryIdsByKey?.get(selectedKey);
        if (!selectedId) return { products: [], total: 0 };
        params.set('category_id', String(selectedId));
      }

      const data = parseProductList(await requestData('/api/v1/products?' + params.toString()));
      return { products: data.items.map(mapProduct), total: data.total };
    },
  };
}
