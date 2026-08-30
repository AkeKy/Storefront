'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage, type MessageKey } from '@/features/i18n/LanguageContext';

type LoginFormProps = { returnTo?: string };
type FormErrors = Partial<Record<'username' | 'password', MessageKey>>;

const hasForbiddenCharacter = (value: string) =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return character === '\\' || code <= 0x1f || code === 0x7f;
  });

const INTERNAL_RETURN_TO_BASE = new URL('https://gadget-arena.invalid/');
const MAX_RETURN_TO_DECODES = 8;

const isStrictInternalPath = (value: string) =>
  value.startsWith('/') && !value.startsWith('//') && !hasForbiddenCharacter(value);

const canonicalInternalPath = (returnTo: string): string | undefined => {
  let candidate = returnTo;
  for (let index = 0; index < MAX_RETURN_TO_DECODES; index += 1) {
    if (!isStrictInternalPath(candidate)) return undefined;
    try {
      const destination = new URL(candidate, INTERNAL_RETURN_TO_BASE);
      if (destination.origin !== INTERNAL_RETURN_TO_BASE.origin) return undefined;
      const canonical = `${destination.pathname}${destination.search}${destination.hash}`;
      if (!isStrictInternalPath(canonical)) return undefined;

      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return canonical;
      candidate = decoded;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const safeReturnTo = (returnTo?: string) => {
  if (!returnTo || !isStrictInternalPath(returnTo)) return '/';
  return canonicalInternalPath(returnTo) ?? '/';
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
  const hasCredentialError = submissionError === 'auth.invalidCredentials';

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
      else {
        const nextSubmissionError = errorKey(result.error);
        setSubmissionError(nextSubmissionError);
        if (nextSubmissionError === 'auth.invalidCredentials') passwordInput.current?.focus();
      }
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
            className={`checkout-input ${
              errors.username || hasCredentialError
                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                : ''
            }`}
            autoComplete="username"
            aria-invalid={Boolean(errors.username || hasCredentialError)}
            aria-describedby={
              errors.username
                ? 'login-username-error'
                : hasCredentialError
                  ? 'login-submission-error'
                  : undefined
            }
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setErrors((current) => ({ ...current, username: undefined }));
              setSubmissionError(undefined);
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
            className={`checkout-input ${
              errors.password || hasCredentialError
                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                : ''
            }`}
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password || hasCredentialError)}
            aria-describedby={
              errors.password
                ? 'login-password-error'
                : hasCredentialError
                  ? 'login-submission-error'
                  : undefined
            }
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
              setSubmissionError(undefined);
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
        <div
          id="login-submission-error"
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <Icon name="ExclamationCircleIcon" size={20} className="mt-0.5 shrink-0" aria-hidden />
          <span>{t(submissionError)}</span>
        </div>
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
