import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsContent from '@/app/products/components/ProductsContent';

export default function ProductsPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header cartCount={3} />
      <ProductsContent />
      <Footer />
    </main>
  );
}
