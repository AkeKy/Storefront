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

  it('opens the authenticated username menu with Products, Checkout, and Sign out', async () => {
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

    const accountMenu = await screen.findByRole('button', { name: 'admin' });
    expect(accountMenu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(accountMenu);

    expect(accountMenu).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('menuitem', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
    expect(screen.queryByRole('menuitem', { name: 'My orders' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Admin dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveClass('text-destructive');
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveClass('xl:hidden');
  });

  it('closes the authenticated username menu with Escape', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            member_id: 2,
            username: 'buyer',
            first_name: 'Buy',
            permission_id: 2,
            permission_name: 'Member',
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

    const accountMenu = await screen.findByRole('button', { name: 'buyer' });
    await userEvent.click(accountMenu);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(accountMenu).toHaveFocus();
  });
});
