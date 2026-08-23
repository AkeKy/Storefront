'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage, type MessageKey } from '@/features/i18n/LanguageContext';
import type { RegistrationData } from '@/features/auth/types';

type FormState = RegistrationData & { confirmPassword: string };
type FormErrors = Partial<Record<keyof FormState, MessageKey>>;

const initialForm: FormState = {
  username: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  birth_date: '',
};

const fields: Array<{
  name: Exclude<keyof FormState, 'confirmPassword'>;
  label: MessageKey;
  type?: string;
  autoComplete?: string;
}> = [
  { name: 'username', label: 'auth.username', autoComplete: 'username' },
  { name: 'first_name', label: 'auth.firstName', autoComplete: 'given-name' },
  { name: 'last_name', label: 'auth.lastName', autoComplete: 'family-name' },
  { name: 'phone', label: 'auth.phone', type: 'tel', autoComplete: 'tel' },
  { name: 'email', label: 'auth.email', type: 'email', autoComplete: 'email' },
  { name: 'birth_date', label: 'auth.birthDate', type: 'date', autoComplete: 'bday' },
];

const fieldOrder: Array<keyof FormState> = [
  'username',
  'first_name',
  'last_name',
  'phone',
  'email',
  'birth_date',
  'password',
  'confirmPassword',
];

const errorKey = (error: string): MessageKey => {
  switch (error) {
    case 'accountConflict':
      return 'auth.accountConflict';
    case 'invalidRequest':
      return 'auth.invalidRequest';
    default:
      return 'auth.unavailable';
  }
};

export default function RegisterForm() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<MessageKey>();
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Partial<Record<keyof FormState, HTMLInputElement | null>>>({});

  const update = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: FormErrors = {};
    for (const [name, value] of Object.entries(form) as Array<[keyof FormState, string]>) {
      if (!value.trim()) nextErrors[name] = 'validation.required';
    }
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
      nextErrors.confirmPassword = 'auth.passwordMismatch';
    setErrors(nextErrors);
    setSubmissionError(undefined);
    const firstInvalidField = fieldOrder.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      inputs.current[firstInvalidField]?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword: _confirmPassword, ...registration } = form;
      const result = await register(registration);
      if (result.ok) router.replace('/login');
      else setSubmissionError(errorKey(result.error));
    } finally {
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setSubmitting(false);
    }
  };

  return (
    <form className="surface-card p-6 sm:p-8" onSubmit={submit} noValidate aria-busy={submitting}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const fieldError = errors[field.name];
          return (
            <label key={field.name} className={field.name === 'username' ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block text-sm font-semibold">{t(field.label)}</span>
              <input
                ref={(input) => {
                  inputs.current[field.name] = input;
                }}
                id={`register-${field.name}`}
                className="checkout-input"
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? `register-${field.name}-error` : undefined}
                value={form[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
              />
              {fieldError && (
                <p
                  id={`register-${field.name}-error`}
                  role="alert"
                  className="mt-1 text-sm text-destructive"
                >
                  {t(fieldError)}
                </p>
              )}
            </label>
          );
        })}
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.password')}</span>
          <input
            ref={(input) => {
              inputs.current.password = input;
            }}
            id="register-password"
            className="checkout-input"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
          />
          {errors.password && (
            <p id="register-password-error" role="alert" className="mt-1 text-sm text-destructive">
              {t(errors.password)}
            </p>
          )}
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.confirmPassword')}</span>
          <input
            ref={(input) => {
              inputs.current.confirmPassword = input;
            }}
            id="register-confirmPassword"
            className="checkout-input"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'register-confirmPassword-error' : undefined}
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
          />
          {errors.confirmPassword && (
            <p
              id="register-confirmPassword-error"
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {t(errors.confirmPassword)}
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
          {t('auth.creatingAccount')}
        </p>
      )}
      <button className="btn-primary mt-6 w-full justify-center" disabled={submitting}>
        {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
      </button>
    </form>
  );
}
