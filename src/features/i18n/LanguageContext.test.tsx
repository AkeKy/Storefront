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
      <p>{`${locale}:${t('nav.home')}:${categoryLabel('mouse', 'Mouse')}:${stockLabel(true)}:${badgeLabel('New')}:${t('auth.invalidPhone')}`}</p>
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

    expect(
      screen.getByText(`en:Home:Mouse:In stock:New:Enter a 10-digit Thai phone number.`)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch' }));

    expect(
      screen.getByText('th:หน้าหลัก:เมาส์:มีสินค้า:ใหม่:กรอกเบอร์โทรศัพท์ไทย 10 หลัก')
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('th');
  });

  it('restores a valid Thai preference and ignores malformed stored values', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'th');
    const { unmount } = render(
      <LanguageProvider>
        <LocaleProbe />
      </LanguageProvider>
    );

    expect(
      await screen.findByText('th:หน้าหลัก:เมาส์:มีสินค้า:ใหม่:กรอกเบอร์โทรศัพท์ไทย 10 หลัก')
    ).toBeInTheDocument();

    unmount();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    render(
      <LanguageProvider>
        <LocaleProbe />
      </LanguageProvider>
    );

    expect(
      screen.getByText(
        `${DEFAULT_LOCALE}:Home:Mouse:In stock:New:Enter a 10-digit Thai phone number.`
      )
    ).toBeInTheDocument();
  });
});
