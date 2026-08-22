'use client';

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { useLanguage } from '@/features/i18n/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="hidden text-sm font-black uppercase tracking-tighter text-foreground sm:block">
              Gadget<span className="text-primary">Arena</span>
            </span>
          </Link>
          <nav
            aria-label="Footer navigation"
            className="flex items-center gap-6 text-sm font-medium text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              {t('nav.home')}
            </Link>
            <Link href="/products" className="transition-colors hover:text-foreground">
              {t('nav.products')}
            </Link>
            <Link href="/checkout" className="transition-colors hover:text-foreground">
              {t('nav.checkout')}
            </Link>
          </nav>
        </div>
        <span className="text-xs text-muted-foreground">© 2026 GadgetArena</span>
      </div>
    </footer>
  );
};

export default Footer;
