'use client';

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { Product } from '@/features/catalog/types';

export function HomeCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadProducts = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await catalogService.listProducts({ inStockOnly: true, sort: 'featured' });
      setProducts(result.products.slice(0, 4));
    } catch {
      setError('Selected products are unavailable right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  return (
    <section className="px-6 py-16" aria-labelledby="selected-gear-heading">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-primary">Catalog highlights</p>
          <h2 id="selected-gear-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Selected gear
          </h2>
          <p className="mt-3 text-muted-foreground">A practical starting point from the current ByteForge catalog.</p>
        </div>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={loadProducts}
          onAddToCart={() => undefined}
        />
      </div>
    </section>
  );
}
