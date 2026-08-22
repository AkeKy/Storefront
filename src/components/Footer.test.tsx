import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';
import { LanguageProvider } from '@/features/i18n/LanguageContext';

describe('Footer', () => {
  it('provides Gadget Arena navigation that customers can use', () => {
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
    expect(screen.getByText(/© 2026 GadgetArena/i)).toBeInTheDocument();
  });

  it('translates customer navigation when Thai is selected', async () => {
    window.localStorage.setItem('gadget-arena-locale', 'th');

    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(await screen.findByRole('link', { name: 'สินค้า' })).toHaveAttribute(
      'href',
      '/products'
    );
  });
});
