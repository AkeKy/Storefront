import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-16 pt-28">
      <div className="blob-primary pointer-events-none absolute left-1/4 top-20 h-[500px] w-[500px] opacity-60" />
      <div className="blob-accent pointer-events-none absolute bottom-10 right-1/4 h-[400px] w-[400px] opacity-50" />
      <div className="scanline-overlay pointer-events-none absolute inset-0" />

      <div className="grid-12 relative z-10 mx-auto w-full max-w-screen-xl items-center">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
          <span className="tag-neon w-fit">Gaming gear &amp; PC setup</span>
          <h1 className="text-display text-foreground">
            PLAY AT
            <br />
            <span className="gradient-text-primary">THE EDGE</span>
            <br />
            OF POWER.
          </h1>
          <p className="max-w-lg text-lg font-medium leading-relaxed text-muted-foreground">
            Browse gaming peripherals and PC gear with current stock status and Thai baht pricing.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/products" className="btn-primary group">
              Shop the catalog
              <Icon
                name="ArrowRightIcon"
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link href="#featured-gear" className="btn-outline">
              See featured gear
            </Link>
          </div>
        </div>

        <div className="relative col-span-12 mt-12 lg:col-span-5 lg:mt-0">
          <div className="card-dark neon-glow overflow-hidden rounded-2xl border-primary/20 p-3">
            <AppImage
              src="https://images.unsplash.com/photo-1636036704268-017faa3b6557"
              alt="Gaming desk setup with an RGB keyboard and mouse"
              width={900}
              height={600}
              priority
              className="h-[340px] w-full rounded-xl object-cover md:h-[420px]"
            />
          </div>
          <div className="floating-badge absolute -bottom-4 -left-4 min-w-[140px] rounded-2xl border border-border bg-card p-4 shadow-2xl lg:-left-10">
            <div className="mb-1 flex items-center gap-2">
              <div className="pulse-dot h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Live catalog
              </span>
            </div>
            <p className="text-lg font-black text-foreground">Stock-aware</p>
            <p className="text-xs text-muted-foreground">Add available gear to cart</p>
          </div>
        </div>
      </div>
    </section>
  );
}
