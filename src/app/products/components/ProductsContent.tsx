'use client';

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { CatalogFilter, Category, Product } from '@/features/catalog/types';
import { useCart } from '@/features/cart/CartContext';
import { useLanguage } from '@/features/i18n/LanguageContext';

type ProductsContentProps = {
  initialCategoryId?: string;
};

const selectClassName = 'checkout-input w-full cursor-pointer py-2.5';

export default function ProductsContent({ initialCategoryId }: ProductsContentProps) {
  const { addItem } = useCart();
  const { categoryLabel, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? '');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState<NonNullable<CatalogFilter['sort']>>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);
  const sortOptions: Array<{ value: NonNullable<CatalogFilter['sort']>; label: string }> = [
    { value: 'featured', label: t('catalog.sortFeatured') },
    { value: 'price-asc', label: t('catalog.sortPriceAsc') },
    { value: 'price-desc', label: t('catalog.sortPriceDesc') },
  ];

  useEffect(() => {
    let isCurrent = true;

    catalogService
      .listCategories()
      .then((availableCategories) => {
        if (isCurrent) setCategories(availableCategories);
      })
      .catch(() => {
        if (isCurrent) setCategories([]);
      });

    catalogService
      .listProducts()
      .then((result) => {
        if (isCurrent)
          setBrands(Array.from(new Set(result.products.map((product) => product.brand))).sort());
      })
      .catch(() => {
        if (isCurrent) setBrands([]);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const filter: CatalogFilter = {
      ...(query ? { query } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brand ? { brand } : {}),
      sort,
      ...(inStockOnly ? { inStockOnly: true } : {}),
    };

    setIsLoading(true);
    setError(undefined);

    catalogService
      .listProducts(filter)
      .then((result) => {
        if (isCurrent) setProducts(result.products);
      })
      .catch(() => {
        if (isCurrent) setError(t('catalog.loadError'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [query, categoryId, brand, sort, inStockOnly, retryCount, t]);

  const resetFilters = () => {
    setQuery('');
    setCategoryId('');
    setBrand('');
    setSort('featured');
    setInStockOnly(false);
  };

  return (
    <section className="dot-pattern-dark bg-background pb-16 pt-32 sm:pt-36">
      <div className="mx-auto max-w-screen-2xl px-6">
        <header className="mb-8">
          <span className="tag-neon mb-3 inline-block">{t('catalog.tag')}</span>
          <h1 className="text-display-md text-foreground">{t('catalog.heading')}</h1>
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? t('catalog.loadingProducts')
              : t('catalog.productCount', { count: products.length })}
          </p>
        </header>

        <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-search"
            >
              {t('catalog.search')}
            </label>
            <input
              id="product-search"
              className="checkout-input w-full py-2.5"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-sort"
            >
              {t('catalog.sortBy')}
            </label>
            <select
              id="product-sort"
              className={selectClassName}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as NonNullable<CatalogFilter['sort']>)
              }
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="catalog-layout">
          <aside
            className="filter-sidebar h-fit p-5 lg:sticky lg:top-28"
            aria-labelledby="catalog-filters-heading"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2
                id="catalog-filters-heading"
                className="text-base font-black uppercase tracking-tight text-foreground"
              >
                {t('catalog.filters')}
              </h2>
              <button
                className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
                type="button"
                onClick={resetFilters}
              >
                {t('catalog.resetAll')}
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  htmlFor="product-category"
                >
                  {t('catalog.category')}
                </label>
                <select
                  id="product-category"
                  className={selectClassName}
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">{t('catalog.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryLabel(category.id, category.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  htmlFor="product-brand"
                >
                  {t('catalog.brand')}
                </label>
                <select
                  id="product-brand"
                  className={selectClassName}
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                >
                  <option value="">{t('catalog.allBrands')}</option>
                  {brands.map((productBrand) => (
                    <option key={productBrand} value={productBrand}>
                      {productBrand}
                    </option>
                  ))}
                </select>
              </div>

              <label
                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                htmlFor="in-stock-only"
              >
                <input
                  id="in-stock-only"
                  className="h-4 w-4 accent-primary"
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                {t('catalog.inStockOnly')}
              </label>
            </div>
          </aside>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            error={error}
            onRetry={() => setRetryCount((count) => count + 1)}
            onAddToCart={addItem}
          />
        </div>
      </div>
    </section>
  );
}
