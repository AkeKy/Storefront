import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('provides only ByteForge navigation that customers can use', () => {
    render(<Footer />);

    expect(screen.getByText('Byte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
    expect(screen.queryByText('Privacy')).not.toBeInTheDocument();
    expect(screen.queryByText('Terms')).not.toBeInTheDocument();
  });
});
