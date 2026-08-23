'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/features/cart/CartContext';
import { useLanguage } from '@/features/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';

function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  const isThai = locale === 'th';

  return (
    <button
      type="button"
      onClick={() => setLocale(isThai ? 'en' : 'th')}
      className="rounded-xl border border-border px-2.5 py-2 text-xs font-black tracking-wide text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary"
      aria-label={t(isThai ? 'language.switchToEnglish' : 'language.switchToThai')}
      aria-pressed={isThai}
    >
      EN <span aria-hidden="true">/</span> TH
    </button>
  );
}

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { itemCount } = useCart();
  const { t } = useLanguage();
  const { status, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.products'), href: '/products' },
    { label: t('nav.checkout'), href: '/checkout' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 flex items-center gap-4 px-6 py-5 transition-all duration-500 ${
          scrolled ? 'nav-scrolled' : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <AppLogo size={36} />
          <span className="font-black text-xl tracking-tighter text-foreground uppercase hidden sm:block">
            Gadget<span className="text-primary">Arena</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden shrink-0 items-center gap-4 xl:flex xl:mx-4 2xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2 xl:gap-3">
          <LanguageToggle />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border hover:border-primary transition-all duration-200 group"
            aria-label={t(theme === 'dark' ? 'header.switchToLight' : 'header.switchToDark')}
          >
            {theme === 'dark' ? (
              <Icon
                name="SunIcon"
                size={20}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            ) : (
              <Icon
                name="MoonIcon"
                size={20}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            )}
          </button>

          <Link
            href="/checkout"
            className="relative p-2.5 rounded-xl border border-border hover:border-primary transition-all duration-200 group"
            aria-label={t('header.cart')}
          >
            <Icon
              name="ShoppingCartIcon"
              size={20}
              className="text-muted-foreground group-hover:text-primary transition-colors"
            />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <div className="hidden xl:flex">
            <Link href="/products" className="btn-primary text-xs py-2.5 px-5">
              {t('header.shopNow')}
            </Link>
          </div>

          {status === 'anonymous' ? (
            <div className="hidden xl:flex">
              <Link href="/login" className="btn-outline text-xs py-2.5 px-5">
                {t('auth.signIn')}
              </Link>
            </div>
          ) : status === 'authenticated' ? (
            <>
              <Link
                href="/account/orders"
                className="hidden xl:flex text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.account')}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden xl:flex text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('auth.admin')}
                </Link>
              )}
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden xl:flex text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.logout')}
              </button>
            </>
          ) : null}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="xl:hidden p-2.5 rounded-xl border border-border hover:border-primary transition-all"
            aria-label={t('header.openMenu')}
          >
            <Icon name="Bars3Icon" size={20} className="text-foreground" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] mobile-menu-overlay flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <AppLogo size={32} />
              <span className="font-black text-lg tracking-tighter uppercase">
                Gadget<span className="text-primary">Arena</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-xl border border-border"
              aria-label={t('header.closeMenu')}
            >
              <Icon name="XMarkIcon" size={20} className="text-foreground" />
            </button>
          </div>

          <div className="flex flex-col gap-2 px-6 pt-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                {link.label}
              </Link>
            ))}
            {status === 'anonymous' ? (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                {t('auth.signIn')}
              </Link>
            ) : status === 'authenticated' ? (
              <>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
                >
                  {t('auth.account')}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="text-2xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
                  >
                    {t('auth.admin')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void logout();
                    setMobileOpen(false);
                  }}
                  className="text-left text-2xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
                >
                  {t('auth.logout')}
                </button>
              </>
            ) : null}
          </div>

          <div className="px-6 mt-8">
            <div className="mb-4">
              <LanguageToggle />
            </div>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="btn-primary w-full justify-center text-sm py-4"
            >
              {t('header.shopAll')}
              <Icon name="ArrowRightIcon" size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
