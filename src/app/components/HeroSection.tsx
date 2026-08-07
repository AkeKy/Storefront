import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
  return (
    <section className="px-6 pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div className="mx-auto max-w-screen-xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">ByteForge computer gear</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Straightforward gear for the way you work and play.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Browse keyboards, mice, headsets, monitors, and storage with prices shown in Thai baht.
          </p>
          <Link href="/products" className="btn-primary mt-8">
            Browse the catalog
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
