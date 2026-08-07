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
    <article className="product-card card-dark group flex h-full flex-col overflow-hidden">
      <div className="relative h-52 overflow-hidden bg-muted">
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
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="mt-1 text-base font-bold leading-tight text-card-foreground">{product.name}</h3>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xl font-black text-primary">
            {priceFormatter.format(product.priceTHB)}
          </p>
          <span
            className={
              isInStock
                ? 'rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary'
                : 'rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground'
            }
          >
            {isInStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        {onAddToCart && (
          <button
            className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!isInStock}
            aria-label={isInStock ? `Add ${product.name} to cart` : 'Out of stock'}
            onClick={() => onAddToCart(product)}
          >
            {isInStock ? 'Add to cart' : 'Out of stock'}
          </button>
        )}
      </div>
    </article>
  );
}
