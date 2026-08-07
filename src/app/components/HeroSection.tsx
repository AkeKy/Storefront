'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let gsap: any;
    let ScrollTrigger: any;

    const initGSAP = async () => {
      try {
        const gsapModule = await import('gsap');
        const stModule = await import('gsap/ScrollTrigger');
        gsap = gsapModule.gsap;
        ScrollTrigger = stModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        // Hero entrance
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.fromTo(
          '.reveal-hero-el',
          { y: 70, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }
        ).fromTo(
          '.reveal-hero-img-el',
          { x: 80, opacity: 0, rotation: 8 },
          { x: 0, opacity: 1, rotation: 0, duration: 1.5, ease: 'expo.out' },
          '-=0.9'
        );

        // Section reveals
        (gsap.utils.toArray('.section-reveal-el') as HTMLElement[]).forEach((el: HTMLElement) => {
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      } catch {
        // GSAP not available, elements remain visible
      }
    };

    initGSAP();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-28 pb-16 px-6 overflow-hidden"
    >
      {/* Atmospheric blobs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] blob-primary opacity-60 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] blob-accent opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] blob-purple pointer-events-none" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline-overlay pointer-events-none z-10" />

      <div className="relative z-20 max-w-screen-xl mx-auto w-full grid-12 items-center">
        {/* Left: Text */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="reveal-hero-el">
            <span className="tag-neon">
              <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 align-middle" />
              New Arrivals 2026
            </span>
          </div>

          <h1 className="text-display reveal-hero-el">
            PLAY AT
            <br />
            <span className="gradient-text-primary">THE EDGE</span>
            <br />
            OF POWER.
          </h1>

          <p className="reveal-hero-el text-lg text-muted-foreground font-medium leading-relaxed max-w-lg">
            From 240Hz monitors to pro-grade peripherals — GadgetArena stocks every piece of gear
            serious gamers demand. No compromises.
          </p>

          <div className="reveal-hero-el flex flex-wrap items-center gap-4">
            <Link href="/products" className="btn-primary group">
              Shop the Catalog
              <Icon
                name="ArrowRightIcon"
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <button className="btn-outline group">
              <Icon name="PlayIcon" size={16} className="text-primary" />
              Watch Highlights
            </button>
          </div>

          {/* Social proof strip */}
          <div className="reveal-hero-el flex items-center gap-6 pt-2">
            <div className="flex -space-x-3">
              {[
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
              ].map((src, i) => (
                <AppImage
                  key={i}
                  src={src}
                  alt={`Gamer customer ${i + 1}`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <div>
              <div className="stars text-xs mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    name="StarIcon"
                    size={12}
                    variant="solid"
                    className="text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                Trusted by <span className="text-foreground">12,000+</span> gamers
              </span>
            </div>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className="col-span-12 lg:col-span-5 relative mt-12 lg:mt-0">
          <div className="reveal-hero-img-el relative z-10">
            <div className="card-dark p-3 overflow-hidden rounded-2xl border-primary/20 neon-glow">
              <AppImage
                src="https://images.unsplash.com/photo-1636036704268-017faa3b6557"
                alt="Gaming setup with RGB mechanical keyboard and gaming mouse on dark desk with neon lighting"
                width={900}
                height={600}
                priority
                className="w-full rounded-xl object-cover h-[340px] md:h-[420px]"
              />
            </div>
          </div>

          {/* Floating stat badge */}
          <div className="floating-badge absolute -bottom-4 -left-4 lg:-left-10 z-20 bg-card border border-border rounded-2xl p-4 shadow-2xl min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Live Stock
              </span>
            </div>
            <p className="text-2xl font-black text-primary">5,000+</p>
            <p className="text-xs text-muted-foreground font-medium">Products In Stock</p>
          </div>

          {/* Second floating badge */}
          <div
            className="floating-badge absolute -top-4 -right-2 lg:-right-6 z-20 bg-card border border-border rounded-2xl p-4 shadow-2xl"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon name="BoltIcon" size={14} variant="solid" className="text-yellow-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fast Ship
              </span>
            </div>
            <p className="text-lg font-black text-foreground">Same Day</p>
            <p className="text-xs text-muted-foreground">Orders before 3PM</p>
          </div>

          {/* Decorative blur circles */}
          <div className="absolute -top-8 -right-8 w-48 h-48 blob-primary opacity-40 pointer-events-none" />
          <div className="absolute -bottom-8 right-8 w-32 h-32 blob-accent opacity-30 pointer-events-none" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
