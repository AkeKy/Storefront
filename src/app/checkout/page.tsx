import React from 'react';
import Header from '@/components/Header';
import CheckoutContent from '@/app/checkout/components/CheckoutContent';

export default function CheckoutPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header cartCount={3} />
      <CheckoutContent />
    </main>
  );
}
