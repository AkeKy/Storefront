import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_LOCALE,
  LanguageProvider,
  LOCALE_STORAGE_KEY,
  useLanguage,
} from './LanguageContext';

function LocaleProbe() {
  const { badgeLabel, categoryLabel, locale, setLocale, stockLabel, t } = useLanguage();

  return (
    <>
      <p>{`${locale}:${t('nav.home')}:${categoryLabel('mice', 'Mice')}:${stockLabel(true)}:${badgeLabel('New')}`}</p>
      <button type="button" onClick={() => setLocale('th')}>
        Switch
      </button>
    </>
  );
}

afterEach(() => window.localStorage.clear());

describe('LanguageProvider', () => {
  it('uses English until a customer chooses Thai', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <LocaleProbe />
      </LanguageProvider>
    );

    expect(screen.getByText(`en:Home:Mice:In stock:New`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch' }));

    expect(screen.getByText('th:หน้าหลัก:เมาส์:มีสินค้า:ใหม่')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('th');
  });

  it('restores a valid Thai preference and ignores malformed stored values', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'th');
    const { unmount } = render(
      <LanguageProvider>
        <LocaleProbe />
      </LanguageProvider>
    );

    expect(await screen.findByText('th:หน้าหลัก:เมาส์:มีสินค้า:ใหม่')).toBeInTheDocument();

    unmount();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    render(
      <LanguageProvider>
        <LocaleProbe />
      </LanguageProvider>
    );

    expect(screen.getByText(`${DEFAULT_LOCALE}:Home:Mice:In stock:New`)).toBeInTheDocument();
  });
});
