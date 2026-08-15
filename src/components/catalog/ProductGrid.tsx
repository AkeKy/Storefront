'use client';

import type { Product } from '@/features/catalog/types';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/features/i18n/LanguageContext';

type ProductGridProps = {
  products: Product[];
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  onAddToCart?: (product: Product) => void;
};

export function ProductGrid({
  products,
  isLoading,
  error,
  onRetry,
  onAddToCart,
}: ProductGridProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return <StatusMessage state="loading" />;
  }

  if (error) {
    return <StatusMessage state="error" description={error} onRetry={onRetry} />;
  }

  if (products.length === 0) {
    return <StatusMessage state="empty" />;
  }

  return (
    <section
      aria-label={t('catalog.productsLabel')}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </section>
  );
}
