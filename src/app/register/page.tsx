'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import RegisterForm from './components/RegisterForm';
import { useLanguage } from '@/features/i18n/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <main className="dot-pattern-dark min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-2xl px-6 pb-16 pt-32">
        <p className="tag-neon">{t('auth.memberAccess')}</p>
        <h1 className="mt-4 text-display-md">{t('auth.createAccount')}</h1>
        <p className="mt-3 text-muted-foreground">{t('auth.registerDescription')}</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link className="font-bold text-primary hover:underline" href="/login">
            {t('auth.signIn')}
          </Link>
        </p>
      </section>
    </main>
  );
}
