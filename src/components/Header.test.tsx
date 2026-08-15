import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Header from './Header';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/features/cart/CartContext';
import { LanguageProvider } from '@/features/i18n/LanguageContext';

describe('Header', () => {
  it('switches the visible navigation from English to Thai', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ThemeProvider>
          <CartProvider>
            <Header />
          </CartProvider>
        </ThemeProvider>
      </LanguageProvider>
    );

    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch language to Thai' }));

    expect(screen.getByRole('link', { name: 'สินค้า' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เปลี่ยนภาษาเป็นอังกฤษ' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
