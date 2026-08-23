'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage, type MessageKey } from '@/features/i18n/LanguageContext';

type LoginFormProps = { returnTo?: string };
type FormErrors = Partial<Record<'username' | 'password', MessageKey>>;

const hasForbiddenCharacter = (value: string) =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return character === '\\' || code <= 0x1f || code === 0x7f;
  });

const fullyDecode = (value: string): string | undefined => {
  let decoded = value;
  for (let index = 0; index < 8; index += 1) {
    if (hasForbiddenCharacter(decoded)) return undefined;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const safeReturnTo = (returnTo?: string) => {
  if (
    !returnTo ||
    hasForbiddenCharacter(returnTo) ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//')
  )
    return '/';
  const decoded = fullyDecode(returnTo);
  if (!decoded || !decoded.startsWith('/') || decoded.startsWith('//')) return '/';
  try {
    const destination = new URL(returnTo, window.location.origin);
    if (destination.origin !== window.location.origin) return '/';
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/';
  }
};

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
  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: FormErrors = {};
    if (!username.trim()) nextErrors.username = 'validation.required';
    if (!password) nextErrors.password = 'validation.required';
    setErrors(nextErrors);
    setSubmissionError(undefined);
    if (Object.keys(nextErrors).length) {
      (nextErrors.username ? usernameInput : passwordInput).current?.focus();
      return;
    }

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
    <form className="surface-card p-6 sm:p-8" onSubmit={submit} noValidate aria-busy={submitting}>
      <div className="space-y-4">
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.username')}</span>
          <input
            ref={usernameInput}
            id="login-username"
            className="checkout-input"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'login-username-error' : undefined}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setErrors((current) => ({ ...current, username: undefined }));
            }}
          />
          {errors.username && (
            <p id="login-username-error" role="alert" className="mt-1 text-sm text-destructive">
              {t(errors.username)}
            </p>
          )}
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.password')}</span>
          <input
            ref={passwordInput}
            id="login-password"
            className="checkout-input"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-sm text-destructive">
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
      {submitting && (
        <p role="status" aria-live="polite" className="sr-only">
          {t('auth.signingIn')}
        </p>
      )}
      <button className="btn-primary mt-6 w-full justify-center" disabled={submitting}>
        {submitting ? t('auth.signingIn') : t('auth.signIn')}
      </button>
    </form>
  );
}
