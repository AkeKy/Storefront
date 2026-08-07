'use client';

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { CatalogFilter, Category, Product } from '@/features/catalog/types';
import { useCart } from '@/features/cart/CartContext';

type ProductsContentProps = {
  initialCategoryId?: string;
};

const sortOptions: Array<{ value: NonNullable<CatalogFilter['sort']>; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

const selectClassName = 'checkout-input w-full cursor-pointer py-2.5';

export default function ProductsContent({ initialCategoryId }: ProductsContentProps) {
  const { addItem } = useCart();
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
        if (isCurrent) setError('We could not load products. Please try again.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [query, categoryId, brand, sort, inStockOnly, retryCount]);

  const resetFilters = () => {
    setQuery('');
    setCategoryId('');
    setBrand('');
    setSort('featured');
    setInStockOnly(false);
  };

  return (
    <section className="bg-background py-10 sm:py-14">
      <div className="container">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              ByteForge catalogue
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Build your setup
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Prices shown in Thai baht</p>
        </div>

        <div className="surface-card mb-8 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-search"
            >
              Search products
            </label>
            <input
              id="product-search"
              className="checkout-input w-full py-2.5"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or brands"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-category"
            >
              Category
            </label>
            <select
              id="product-category"
              className={selectClassName}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-brand"
            >
              Brand
            </label>
            <select
              id="product-brand"
              className={selectClassName}
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((productBrand) => (
                <option key={productBrand} value={productBrand}>
                  {productBrand}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-foreground"
              htmlFor="product-sort"
            >
              Sort by
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
          <div className="flex items-end gap-4 sm:col-span-2 lg:col-span-5">
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
              In stock only
            </label>
            <button
              className="ml-auto text-sm font-semibold text-primary hover:underline"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
        </div>

        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          onAddToCart={addItem}
        />
      </div>
    </section>
  );
}
