import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('provides Gadget Arena navigation that customers can use', () => {
    render(<Footer />);

    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
    expect(screen.getByText(/© 2026 GadgetArena/i)).toBeInTheDocument();
  });
});
