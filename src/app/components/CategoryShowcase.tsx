'use client';

import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/features/i18n/LanguageContext';

const categories = [
  {
    id: 'mouse',
    name: 'Mouse & Pads',
    subtitleKey: 'categories.mouse.subtitle',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1eb9e1c8e-1767122926047.png',
    alt: 'Gaming mouse on a dark mousepad',
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    subtitleKey: 'categories.keyboards.subtitle',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_135ae548d-1774761145135.png',
    alt: 'RGB mechanical keyboard',
  },
  {
    id: 'headsets',
    name: 'Headsets',
    subtitleKey: 'categories.headsets.subtitle',
    image: 'https://images.unsplash.com/photo-1636487658531-16237360bc30',
    alt: 'Gaming headset on a dark background',
  },
  {
    id: 'monitors',
    name: 'Monitors',
    subtitleKey: 'categories.monitors.subtitle',
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_12678af9e-1772760628472.png',
    alt: 'Gaming monitor in a dark room',
  },
] as const;

export default function CategoryShowcase() {
  const { categoryLabel, t } = useLanguage();

  return (
    <section className="px-6 py-16" aria-labelledby="category-heading">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="tag-cyan mb-3 inline-block">{t('categories.tag')}</span>
            <h2 id="category-heading" className="text-display-md text-foreground">
              {t('categories.heading.before')}{' '}
              <span className="gradient-text-primary">{t('categories.heading.highlight')}</span>
            </h2>
          </div>
          <Link href="/products" className="btn-outline self-start px-6 py-3 text-sm sm:self-auto">
            {t('categories.all')}
            <Icon name="ArrowRightIcon" size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-card"
            >
              <AppImage
                src={category.image}
                alt={category.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 group-hover:border-primary/50" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t(category.subtitleKey)}
                </p>
                <h3 className="text-xl font-black leading-tight text-foreground">
                  {categoryLabel(category.id, category.name)}
                </h3>
              </div>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/20">
                <Icon
                  name="ArrowRightIcon"
                  size={14}
                  className="text-primary opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
