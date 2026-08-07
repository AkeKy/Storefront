import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsContent from '@/app/products/components/ProductsContent';

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;
  const initialCategoryId = typeof category === 'string' ? category : undefined;

  return (
    <main className="bg-background min-h-screen">
      <Header cartCount={3} />
      <ProductsContent initialCategoryId={initialCategoryId} />
      <Footer />
    </main>
  );
}
