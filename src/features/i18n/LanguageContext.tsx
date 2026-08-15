'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  badgeMessages,
  categoryMessages,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  messages,
  type Locale,
  type MessageKey,
} from './messages';

export { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from './messages';
export type { Locale, MessageKey } from './messages';

type TranslationValues = Record<string, string | number>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: TranslationValues) => string;
  categoryLabel: (categoryId: string, fallback: string) => string;
  stockLabel: (isInStock: boolean) => string;
  badgeLabel: (badge?: string) => string | undefined;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const isLocale = (value: string | null): value is Locale => value === 'en' || value === 'th';

const formatMessage = (message: string, values?: TranslationValues) =>
  message.replace(/{{(\w+)}}/g, (_, key: string) => String(values?.[key] ?? `{{${key}}}`));

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(storedLocale)) setLocaleState(storedLocale);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: MessageKey, values?: TranslationValues) =>
      formatMessage(messages[locale][key] ?? messages.en[key], values);

    return {
      locale,
      setLocale: (nextLocale) => {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        setLocaleState(nextLocale);
      },
      t,
      categoryLabel: (categoryId, fallback) => categoryMessages[locale][categoryId] ?? fallback,
      stockLabel: (isInStock) => t(isInStock ? 'catalog.inStock' : 'catalog.outOfStock'),
      badgeLabel: (badge) => (badge ? badgeMessages[locale][badge] ?? badge : undefined),
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider.');
  return context;
}
