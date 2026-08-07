'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/features/cart/CartContext';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { itemCount } = useCart();

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
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Checkout', href: '/checkout' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-5 flex items-center justify-between ${
          scrolled ? 'nav-scrolled' : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <AppLogo size={36} />
          <span className="font-black text-xl tracking-tighter text-foreground uppercase hidden sm:block">
            Byte<span className="text-primary">Forge</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
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
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border hover:border-primary transition-all duration-200 group"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
            aria-label="Cart"
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

          <Link href="/products" className="hidden md:flex btn-primary text-xs py-2.5 px-5">
            Shop Now
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2.5 rounded-xl border border-border hover:border-primary transition-all"
            aria-label="Open menu"
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
                Byte<span className="text-primary">Forge</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-xl border border-border"
              aria-label="Close menu"
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
          </div>

          <div className="px-6 mt-8">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="btn-primary w-full justify-center text-sm py-4"
            >
              Shop All Products
              <Icon name="ArrowRightIcon" size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
