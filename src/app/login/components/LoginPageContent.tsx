'use client';

import Link from 'next/link';
import LoginForm from './LoginForm';
import { useLanguage } from '@/features/i18n/LanguageContext';

export default function LoginPageContent({ returnTo }: { returnTo?: string }) {
  const { t } = useLanguage();
  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-6 pt-24">
      <div className="w-full">
        <p className="tag-neon">{t('auth.memberAccess')}</p>
        <h1 className="mt-4 text-display-md">{t('auth.signIn')}</h1>
        <p className="mt-3 text-muted-foreground">{t('auth.loginDescription')}</p>
        <div className="mt-6">
          <LoginForm returnTo={returnTo} />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link className="font-bold text-primary hover:underline" href="/register">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </section>
  );
}
