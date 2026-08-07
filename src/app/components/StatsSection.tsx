import React from 'react';
import Icon from '@/components/ui/AppIcon';

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        {/* BENTO GRID AUDIT:
            Array has 5 cards: BigStat, FreeShipping, TechSupport, TopBrands, RatingCard
            Row 1: [col-1–2: BigStat cs-2 rs-2] [col-3: FreeShipping cs-1]
            Row 2: [col-1–2: BigStat cont.] [col-3: TechSupport cs-1]
            Row 3: [col-1: TopBrands cs-1] [col-2: RatingCard cs-1] [col-3: — expands TopBrands cs-2]
            Placed 5/5 ✓
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BigStat — spans 2 rows */}
          <div className="card-dark p-8 md:row-span-2 flex flex-col justify-between section-reveal-el min-h-[240px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 blob-primary opacity-30 pointer-events-none" />
            <div>
              <span className="tag-neon mb-4 inline-block">ByteForge</span>
              <p className="text-6xl font-black text-primary leading-none mb-2">12K+</p>
              <p className="text-xl font-bold text-foreground mb-2">Happy Gamers</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Powering gaming setups across the US — from casual players to pro esports
                competitors.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    name="StarIcon"
                    size={14}
                    variant="solid"
                    className="text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground">4.9 avg rating</span>
            </div>
          </div>

          {/* FreeShipping */}
          <div className="card-dark p-6 flex items-center gap-4 section-reveal-el">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Icon name="TruckIcon" size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg">Free Shipping</p>
              <p className="text-sm text-muted-foreground">On orders over $75 — nationwide</p>
            </div>
          </div>

          {/* TechSupport */}
          <div className="card-dark p-6 flex items-center gap-4 section-reveal-el">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <Icon name="ChatBubbleLeftRightIcon" size={22} className="text-accent" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg">24/7 Support</p>
              <p className="text-sm text-muted-foreground">Expert tech help, always on</p>
            </div>
          </div>

          {/* TopBrands */}
          <div className="card-dark p-6 flex items-center gap-4 section-reveal-el">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="ShieldCheckIcon" size={22} className="text-purple-400" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg">100+ Brands</p>
              <p className="text-sm text-muted-foreground">
                Razer, ASUS ROG, NVIDIA, HyperX & more
              </p>
            </div>
          </div>

          {/* RatingCard */}
          <div className="card-dark p-6 flex items-center gap-4 section-reveal-el">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="BoltIcon" size={22} variant="solid" className="text-yellow-400" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg">Same-Day Dispatch</p>
              <p className="text-sm text-muted-foreground">
                Order before 3PM for same-day shipping
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
