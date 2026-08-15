'use client';

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { catalogService } from '@/features/catalog/catalog-service';
import type { Product } from '@/features/catalog/types';
import { useCart } from '@/features/cart/CartContext';
import { useLanguage } from '@/features/i18n/LanguageContext';

export function HomeCatalog() {
  const { addItem } = useCart();
  const { t } = useLanguage();
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
      setError(t('homeCatalog.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [t]);

  return (
    <section id="featured-gear" className="px-6 py-20" aria-labelledby="selected-gear-heading">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 max-w-2xl">
          <span className="tag-neon mb-3 inline-block">{t('homeCatalog.tag')}</span>
          <h2 id="selected-gear-heading" className="text-display-md text-foreground">
            {t('homeCatalog.heading')}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t('homeCatalog.description')}
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
