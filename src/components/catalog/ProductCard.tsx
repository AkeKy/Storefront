import type { Product } from '@/features/catalog/types';
import AppImage from '@/components/ui/AppImage';

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

const priceFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isInStock = product.stockQuantity > 0;

  return (
    <article className="product-card catalog-product-card group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <AppImage
          className="product-card-img h-full w-full object-cover"
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.badge && (
          <span className="tag-neon absolute left-3 top-3">
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="mt-1 text-base font-bold leading-tight text-card-foreground">{product.name}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{product.categoryName}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="text-xl font-black text-primary">
            {priceFormatter.format(product.priceTHB)}
          </p>
          {onAddToCart && (
            <button
              className="catalog-add-button disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={!isInStock}
              aria-label={isInStock ? `Add ${product.name} to cart` : 'Out of stock'}
              onClick={() => onAddToCart(product)}
            >
              <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
        <p className={isInStock ? 'mt-2 text-xs font-semibold text-primary' : 'mt-2 text-xs font-semibold text-muted-foreground'}>
          {isInStock ? 'In stock' : 'Out of stock'}
        </p>
      </div>
    </article>
  );
}
