'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  alt: string;
  tag?: string;
  tagType?: 'neon' | 'cyan';
  category: string;
}

const featuredProducts: Product[] = [
  {
    id: 1,
    name: 'Razer DeathAdder V3 Pro',
    brand: 'Razer',
    price: 149.99,
    originalPrice: 179.99,
    rating: 4.9,
    reviewCount: 2847,
    image: 'https://images.unsplash.com/photo-1598569666598-49f7bbde8cba',
    alt: 'Black gaming mouse with ergonomic design on dark surface with subtle RGB lighting',
    tag: 'Best Seller',
    tagType: 'neon',
    category: 'Mice',
  },
  {
    id: 2,
    name: 'HyperX Cloud III Wireless',
    brand: 'HyperX',
    price: 199.99,
    rating: 4.8,
    reviewCount: 1923,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_15350b1ea-1772901666425.png',
    alt: 'Black over-ear gaming headset with cushioned ear cups on dark background',
    tag: 'New',
    tagType: 'cyan',
    category: 'Headsets',
  },
  {
    id: 3,
    name: 'ASUS ROG Swift 360Hz Monitor',
    brand: 'ASUS ROG',
    price: 699.99,
    originalPrice: 799.99,
    rating: 4.7,
    reviewCount: 876,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1ddad982e-1772313920948.png',
    alt: 'Ultrawide gaming monitor with slim bezels displaying vivid game graphics in dark room',
    tag: '360Hz',
    tagType: 'neon',
    category: 'Monitors',
  },
  {
    id: 4,
    name: 'SteelSeries Apex Pro TKL',
    brand: 'SteelSeries',
    price: 179.99,
    rating: 4.8,
    reviewCount: 3104,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_105bf7c98-1772728124841.png',
    alt: 'Tenkeyless mechanical gaming keyboard with RGB backlighting on dark desk',
    tag: 'Top Pick',
    tagType: 'neon',
    category: 'Keyboards',
  },
  {
    id: 5,
    name: 'NVIDIA RTX 5090 FE',
    brand: 'NVIDIA',
    price: 1999.99,
    rating: 4.9,
    reviewCount: 542,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1e3517593-1765198830166.png',
    alt: 'High-end graphics card with large heatsink and RGB lighting on dark background',
    tag: 'New',
    tagType: 'cyan',
    category: 'GPUs',
  },
  {
    id: 6,
    name: 'Elgato Stream Deck MK.2',
    brand: 'Elgato',
    price: 149.99,
    originalPrice: 169.99,
    rating: 4.6,
    reviewCount: 4217,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1727c2045-1764792423119.png',
    alt: 'Stream deck controller with LCD buttons on white background, studio setup accessory',
    tag: 'Sale',
    tagType: 'cyan',
    category: 'Streaming',
  },
];

const FeaturedProducts: React.FC = () => {
  const [addedId, setAddedId] = useState<number | null>(null);

  const handleAddToCart = (id: number) => {
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-screen-xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 section-reveal-el">
          <div>
            <span className="tag-neon mb-3 inline-block">Featured Gear</span>
            <h2 className="text-display-md text-foreground">
              TOP <span className="gradient-text-primary">PICKS</span>
            </h2>
          </div>
          <Link href="/products" className="btn-outline text-sm py-3 px-6 self-start sm:self-auto">
            View All
            <Icon name="ArrowRightIcon" size={14} />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="product-card card-dark overflow-hidden group section-reveal-el"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              {/* Image */}
              <div className="relative overflow-hidden h-52 bg-muted">
                <AppImage
                  src={product.image}
                  alt={product.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="product-card-img object-cover"
                />

                {/* Tag */}
                {product.tag && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className={product.tagType === 'cyan' ? 'tag-cyan' : 'tag-neon'}>
                      {product.tag}
                    </span>
                  </div>
                )}
                {/* Quick add overlay */}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="btn-primary text-xs py-2.5 px-5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                  >
                    {addedId === product.id ? (
                      <>
                        <Icon name="CheckIcon" size={14} />
                        Added!
                      </>
                    ) : (
                      <>
                        <Icon name="ShoppingCartIcon" size={14} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {product.brand}
                  </span>
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
                <h3 className="font-bold text-foreground text-base leading-tight mb-2">
                  {product.name}
                </h3>
                {/* Stars */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        name="StarIcon"
                        size={12}
                        variant="solid"
                        className={
                          i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-muted'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                </div>
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all group/btn"
                    aria-label="Add to cart"
                  >
                    <Icon
                      name="PlusIcon"
                      size={16}
                      className="text-muted-foreground group-hover/btn:text-primary transition-colors"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
