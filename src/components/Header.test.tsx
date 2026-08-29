import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/features/cart/CartContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { LanguageProvider } from '@/features/i18n/LanguageContext';

describe('Header', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ code: 'unauthorized' }), { status: 401 }))
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('switches the visible navigation from English to Thai', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ThemeProvider>
          <CartProvider>
            <AuthProvider>
              <Header />
            </AuthProvider>
          </CartProvider>
        </ThemeProvider>
      </LanguageProvider>
    );

    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' }).parentElement).not.toHaveClass(
      'absolute'
    );
    expect((await screen.findByRole('link', { name: 'Sign in' })).parentElement).toHaveClass(
      'hidden',
      'xl:flex'
    );

    await user.click(screen.getByRole('button', { name: 'Switch language to Thai' }));

    expect(screen.getByRole('link', { name: 'สินค้า' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เปลี่ยนภาษาเป็นอังกฤษ' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('shows member account navigation and limits Admin to permission ID 1', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            member_id: 1,
            username: 'admin',
            first_name: 'Admin',
            permission_id: 1,
            permission_name: 'Administrator',
          },
        }),
        { status: 200 }
      )
    );

    render(
      <LanguageProvider>
        <ThemeProvider>
          <CartProvider>
            <AuthProvider>
              <Header />
            </AuthProvider>
          </CartProvider>
        </ThemeProvider>
      </LanguageProvider>
    );

    expect(await screen.findByRole('link', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Account' })).toHaveClass('xl:flex');
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveClass('xl:flex');
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveClass('xl:hidden');
  });
});
