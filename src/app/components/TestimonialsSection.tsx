import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  quote: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  avatarAlt: string;
  product: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'Ordered the Razer DeathAdder V3 Pro and it arrived next morning. The sensor is insane — zero smoothing, zero acceleration. My aim in Valorant improved within a week.',
    name: 'Marcus Rivera',
    handle: '@mrvlays',
    role: 'Valorant Diamond II',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1ddb9b8cc-1763295110271.png',
    avatarAlt: 'Young Hispanic man with short dark hair smiling at camera',
    product: 'Razer DeathAdder V3 Pro',
    rating: 5,
  },
  {
    quote:
      'Finally found a shop that stocks the ROG Swift 360Hz without markup. Price matched Amazon and shipped same day. The monitor is absolutely worth every dollar for competitive play.',
    name: 'Jordan Lee',
    handle: '@jlee_fps',
    role: 'CS2 Faceit Level 10',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_184f78312-1772293644649.png',
    avatarAlt: 'Young woman with dark hair and confident expression in natural lighting',
    product: 'ASUS ROG Swift 360Hz',
    rating: 5,
  },
  {
    quote:
      'Bought the HyperX Cloud III and the SteelSeries Apex Pro in one order. Both arrived in perfect condition with all accessories. Customer support helped me with key remapping — above and beyond.',
    name: 'Devon Okafor',
    handle: '@devokafor',
    role: 'Content Creator & Streamer',
    avatar: 'https://images.unsplash.com/photo-1633511069517-ca47ffe1f27f',
    avatarAlt: 'Man with glasses and beard in casual setting with soft background blur',
    product: 'HyperX Cloud III + SteelSeries Apex',
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 px-6 relative">
      <div className="absolute inset-0 blob-purple opacity-20 pointer-events-none" />
      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 section-reveal-el">
          <span className="tag-neon mb-3 inline-block">Real Gamers</span>
          <h2 className="text-display-md">
            THEY <span className="gradient-text-primary">SAID IT</span>
          </h2>
        </div>

        {/* 3-col testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="card-dark p-6 flex flex-col justify-between section-reveal-el"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, si) => (
                    <Icon
                      key={si}
                      name="StarIcon"
                      size={14}
                      variant="solid"
                      className="text-yellow-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-muted-foreground leading-relaxed text-sm italic mb-4">
                  &quot;{t.quote}&quot;
                </p>
                {/* Product badge */}
                <span className="tag-neon text-[10px]">{t.product}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                <AppImage
                  src={t.avatar}
                  alt={t.avatarAlt}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />

                <div>
                  <p className="font-bold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.handle} · {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
