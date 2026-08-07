import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import FeaturedProducts from '@/app/components/FeaturedProducts';
import StatsSection from '@/app/components/StatsSection';
import CategoryShowcase from '@/app/components/CategoryShowcase';
import TestimonialsSection from '@/app/components/TestimonialsSection';
import CTABanner from '@/app/components/CTABanner';

export default function HomePage() {
  return (
    <main className="bg-background min-h-screen dot-pattern-dark">
      <Header cartCount={3} />
      <HeroSection />
      <FeaturedProducts />
      <StatsSection />
      <CategoryShowcase />
      <TestimonialsSection />
      <CTABanner />
      <Footer />
    </main>
  );
}
