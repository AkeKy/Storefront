import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/features/catalog/types';
import { ProductCard } from './ProductCard';

const product: Product = {
  id: 1,
  slug: 'keychron-q6-max',
  name: 'Keychron Q6 Max',
  brand: 'Keychron',
  categoryId: 'keyboards',
  categoryName: 'Keyboards',
  priceTHB: 7990,
  image: '/images/products/keychron-q6-max.jpg',
  imageAlt: 'Keychron Q6 Max mechanical keyboard',
  stockQuantity: 8,
};

describe('ProductCard', () => {
  it('formats the price and adds an in-stock product to the cart', async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();

    render(<ProductCard product={product} onAddToCart={onAddToCart} />);

    expect(screen.getByText('฿7,990')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Keychron Q6 Max to cart' }));

    expect(onAddToCart).toHaveBeenCalledWith(product);
  });

  it('replaces a failed product image with the local catalog placeholder', () => {
    render(<ProductCard product={product} />);

    const image = screen.getByRole('img', { name: product.imageAlt });
    fireEvent.error(image);

    expect(screen.getByRole('img', { name: product.imageAlt })).toHaveAttribute('src', '/assets/images/no_image.png');
  });
});
