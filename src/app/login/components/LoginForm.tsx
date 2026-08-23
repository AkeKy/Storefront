'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage, type MessageKey } from '@/features/i18n/LanguageContext';

type LoginFormProps = { returnTo?: string };
type FormErrors = Partial<Record<'username' | 'password', MessageKey>>;

const safeReturnTo = (returnTo?: string) =>
  returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
    ? returnTo
    : '/';

const errorKey = (error: string): MessageKey => {
  switch (error) {
    case 'invalidCredentials':
      return 'auth.invalidCredentials';
    case 'invalidRequest':
      return 'auth.invalidRequest';
    default:
      return 'auth.unavailable';
  }
};

export default function LoginForm({ returnTo }: LoginFormProps) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<MessageKey>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: FormErrors = {};
    if (!username.trim()) nextErrors.username = 'validation.required';
    if (!password) nextErrors.password = 'validation.required';
    setErrors(nextErrors);
    setSubmissionError(undefined);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const result = await login({ username: username.trim(), password });
      if (result.ok) router.replace(safeReturnTo(returnTo));
      else setSubmissionError(errorKey(result.error));
    } finally {
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <form className="surface-card p-6 sm:p-8" onSubmit={submit} noValidate>
      <div className="space-y-4">
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.username')}</span>
          <input
            className="checkout-input"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setErrors((current) => ({ ...current, username: undefined }));
            }}
          />
          {errors.username && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {t(errors.username)}
            </p>
          )}
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.password')}</span>
          <input
            className="checkout-input"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
          />
          {errors.password && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {t(errors.password)}
            </p>
          )}
        </label>
      </div>
      {submissionError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t(submissionError)}
        </p>
      )}
      <button className="btn-primary mt-6 w-full justify-center" disabled={submitting}>
        {submitting ? t('auth.signingIn') : t('auth.signIn')}
      </button>
    </form>
  );
}
