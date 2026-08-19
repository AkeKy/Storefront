'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { CatalogFilter, CatalogSortOption, Category, Product } from '@/features/catalog/types';
import { useCart } from '@/features/cart/CartContext';
import { useLanguage } from '@/features/i18n/LanguageContext';

type ProductsContentProps = {
  initialCategoryId?: string;
};

const MIN_PRICE = 0;
const MAX_PRICE_LIMIT = 10000;

const priceFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

export default function ProductsContent({ initialCategoryId }: ProductsContentProps) {
  const { addItem } = useCart();
  const { categoryLabel, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? '');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState<CatalogSortOption>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE_LIMIT);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);

  const sortOptions: Array<{ value: CatalogSortOption; label: string }> = [
    { value: 'featured', label: t('catalog.sortFeatured') },
    { value: 'price-asc', label: t('catalog.sortPriceAsc') },
    { value: 'price-desc', label: t('catalog.sortPriceDesc') },
    { value: 'best-rated', label: t('catalog.sortBestRated') },
    { value: 'most-reviews', label: t('catalog.sortMostReviews') },
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
      ...(maxPrice < MAX_PRICE_LIMIT ? { maxPrice } : {}),
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
  }, [query, categoryId, brand, maxPrice, sort, inStockOnly, retryCount, t]);

  const resetFilters = () => {
    setQuery('');
    setCategoryId('');
    setBrand('');
    setMaxPrice(MAX_PRICE_LIMIT);
    setSort('featured');
    setInStockOnly(false);
  };

  const pricePercentage = useMemo(() => {
    return Math.min(
      100,
      Math.max(0, ((maxPrice - MIN_PRICE) / (MAX_PRICE_LIMIT - MIN_PRICE)) * 100)
    );
  }, [maxPrice]);

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

        {/* Top Search and Sort Bar */}
        <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <label className="sr-only" htmlFor="product-search">
              {t('catalog.search')}
            </label>
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="product-search"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
            />
          </div>

          <div className="relative">
            <label className="sr-only" htmlFor="product-sort">
              {t('catalog.sortBy')}
            </label>
            <select
              id="product-sort"
              className="w-full appearance-none rounded-xl border border-border bg-card py-2.5 pl-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSortOption)}
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-card text-card-foreground"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="catalog-layout">
          {/* Redesigned Filter Sidebar */}
          <aside
            className="filter-sidebar h-fit rounded-2xl bg-card border border-border p-6 shadow-sm lg:sticky lg:top-28"
            aria-labelledby="catalog-filters-heading"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2
                id="catalog-filters-heading"
                className="text-base font-black tracking-tight text-foreground"
              >
                {t('catalog.filters')}
              </h2>
              <button
                className="text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity cursor-pointer"
                type="button"
                onClick={resetFilters}
              >
                {t('catalog.resetAll')}
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('catalog.category')}
                </span>
                <div className="flex flex-col items-start space-y-1">
                  <button
                    type="button"
                    onClick={() => setCategoryId('')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      categoryId === ''
                        ? 'border border-primary text-primary font-semibold shadow-[0_0_12px_rgba(0,255,135,0.15)]'
                        : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {t('catalog.all')}
                  </button>
                  {categories.map((category) => {
                    const isSelected = categoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border border-primary text-primary font-semibold shadow-[0_0_12px_rgba(0,255,135,0.15)]'
                            : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {categoryLabel(category.id, category.name)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('catalog.brand')}
                </span>
                <div className="flex max-h-48 flex-col items-start space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setBrand('')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      brand === ''
                        ? 'border border-primary text-primary font-semibold shadow-[0_0_12px_rgba(0,255,135,0.15)]'
                        : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {t('catalog.allBrands')}
                  </button>
                  {brands.map((productBrand) => {
                    const isSelected = brand === productBrand;
                    return (
                      <button
                        key={productBrand}
                        type="button"
                        onClick={() => setBrand(productBrand)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border border-primary text-primary font-semibold shadow-[0_0_12px_rgba(0,255,135,0.15)]'
                            : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {productBrand}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max Price Range Slider */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t('catalog.maxPrice')}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {priceFormatter.format(maxPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE_LIMIT}
                  step={100}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="range-slider w-full cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${pricePercentage}%, var(--border) ${pricePercentage}%)`,
                  }}
                  aria-label={t('catalog.maxPrice')}
                />
                <div className="mt-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{priceFormatter.format(MIN_PRICE)}</span>
                  <span>{priceFormatter.format(MAX_PRICE_LIMIT)}</span>
                </div>
              </div>

              {/* In Stock Only Switch */}
              <div className="pt-1">
                <label
                  htmlFor="in-stock-only"
                  className="group flex cursor-pointer select-none items-center gap-3"
                >
                  <div className="relative inline-flex items-center">
                    <input
                      id="in-stock-only"
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(event) => setInStockOnly(event.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                        inStockOnly ? 'bg-primary' : 'bg-muted border border-border'
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                          inStockOnly ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {t('catalog.inStockOnly')}
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid - Untouched card components */}
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
