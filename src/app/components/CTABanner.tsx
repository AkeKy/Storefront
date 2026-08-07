import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const CTABanner: React.FC = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-primary/20 neon-glow p-10 md:p-16 text-center">
          {/* Background blobs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 blob-primary opacity-30 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 blob-accent opacity-20 pointer-events-none" />
          <div className="absolute inset-0 scanline-overlay pointer-events-none" />

          <div className="relative z-10">
            <span className="tag-neon mb-4 inline-block">Limited Time</span>
            <h2 className="text-display-md mb-4">
              BUILD YOUR <span className="gradient-text-primary">DREAM RIG</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium max-w-xl mx-auto mb-8">
              Every peripheral. Every component. One checkout. Free shipping on orders over $75 —
              shipped same day before 3PM.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/products" className="btn-primary text-sm py-4 px-8">
                Shop All Gear
                <Icon name="ArrowRightIcon" size={16} />
              </Link>
              <Link href="/checkout" className="btn-outline text-sm py-4 px-8">
                View Cart
                <Icon name="ShoppingCartIcon" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
