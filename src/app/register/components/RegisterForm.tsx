'use client';

import { useState } from 'react';
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
    if (Object.keys(nextErrors).length) return;

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
    <form className="surface-card p-6 sm:p-8" onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const fieldError = errors[field.name];
          return (
            <label key={field.name} className={field.name === 'username' ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block text-sm font-semibold">{t(field.label)}</span>
              <input
                className="checkout-input"
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(fieldError)}
                value={form[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
              />
              {fieldError && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {t(fieldError)}
                </p>
              )}
            </label>
          );
        })}
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.password')}</span>
          <input
            className="checkout-input"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
          />
          {errors.password && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {t(errors.password)}
            </p>
          )}
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">{t('auth.confirmPassword')}</span>
          <input
            className="checkout-input"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
          />
          {errors.confirmPassword && (
            <p role="alert" className="mt-1 text-sm text-destructive">
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
      <button className="btn-primary mt-6 w-full justify-center" disabled={submitting}>
        {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
      </button>
    </form>
  );
}
