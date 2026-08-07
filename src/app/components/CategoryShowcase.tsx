import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Category {
  name: string;
  subtitle: string;
  image: string;
  alt: string;
  href: string;
  count: string;
}

const categories: Category[] = [
  {
    name: 'Mice & Pads',
    subtitle: 'Precision control',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1eb9e1c8e-1767122926047.png',
    alt: 'Gaming mouse with precise sensor on dark mousepad, dim studio lighting, deep shadows',
    href: '/products',
    count: '320+ items',
  },
  {
    name: 'Keyboards',
    subtitle: 'Mechanical feel',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_135ae548d-1774761145135.png',
    alt: 'RGB mechanical keyboard with backlit keys in dim room, dark background, moody lighting',
    href: '/products',
    count: '180+ items',
  },
  {
    name: 'Headsets',
    subtitle: 'Immersive audio',
    image: 'https://images.unsplash.com/photo-1636487658531-16237360bc30',
    alt: 'Gaming headset with large ear cups on dark background with minimal ambient light',
    href: '/products',
    count: '95+ items',
  },
  {
    name: 'Monitors',
    subtitle: 'High refresh rates',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_12678af9e-1772760628472.png',
    alt: 'Gaming monitor displaying vivid game in darkened room, strong contrast, atmospheric glow',
    href: '/products',
    count: '140+ items',
  },
];

const CategoryShowcase: React.FC = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 section-reveal-el">
          <div>
            <span className="tag-cyan mb-3 inline-block">Browse by Category</span>
            <h2 className="text-display-md">
              GEAR <span className="gradient-text-primary">UP</span>
            </h2>
          </div>
          <Link href="/products" className="btn-outline text-sm py-3 px-6 self-start sm:self-auto">
            All Categories
            <Icon name="ArrowRightIcon" size={14} />
          </Link>
        </div>

        {/* 4-col category grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-card block section-reveal-el"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              <AppImage
                src={cat.image}
                alt={cat.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Dark scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              {/* Hover neon border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-all duration-300" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {cat.subtitle}
                </p>
                <h3 className="font-black text-xl text-foreground leading-tight mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-primary font-bold">{cat.count}</p>
              </div>

              {/* Arrow on hover */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/0 group-hover:bg-primary/20 border border-transparent group-hover:border-primary/40 flex items-center justify-center transition-all duration-300">
                <Icon
                  name="ArrowRightIcon"
                  size={14}
                  className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
