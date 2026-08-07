'use client';

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { Product } from '@/features/catalog/types';
import { useCart } from '@/features/cart/CartContext';

export function HomeCatalog() {
  const { addItem } = useCart();
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
    <section id="featured-gear" className="px-6 py-20" aria-labelledby="selected-gear-heading">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 max-w-2xl">
          <span className="tag-neon mb-3 inline-block">Featured gear</span>
          <h2 id="selected-gear-heading" className="text-display-md text-foreground">
            TOP <span className="gradient-text-primary">PICKS</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A practical starting point from the current Gadget Arena catalog.
          </p>
        </div>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={loadProducts}
          onAddToCart={addItem}
        />
      </div>
    </section>
  );
}
