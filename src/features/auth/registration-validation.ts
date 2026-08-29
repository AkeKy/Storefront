import type { MessageKey } from '@/features/i18n/LanguageContext';
import type { RegistrationData } from './types';

export type RegistrationErrors = Partial<Record<keyof RegistrationData, MessageKey>>;

const requiredFields = [
  'username',
  'password',
  'first_name',
  'last_name',
  'phone',
  'email',
  'birth_date',
] as const satisfies ReadonlyArray<keyof RegistrationData>;

const emailLocalAtom = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+";
const emailDomainLabel = '[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?';
const validEmail = (email: string) =>
  new RegExp(
    `^${emailLocalAtom}(?:\\.${emailLocalAtom})*@${emailDomainLabel}(?:\\.${emailDomainLabel})+$`
  ).test(email);

const parseBirthDate = (value: string): Date | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return undefined;
  return date;
};

const isAtLeastSeven = (birthDate: Date, now: Date) => {
  const seventhBirthday = new Date(birthDate);
  seventhBirthday.setUTCFullYear(birthDate.getUTCFullYear() + 7);
  const currentUtcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return seventhBirthday.getTime() <= currentUtcDate;
};

export function validateRegistration(
  registration: RegistrationData,
  now = new Date()
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  for (const field of requiredFields) {
    if (!registration[field].trim()) errors[field] = 'validation.required';
  }

  const email = registration.email.trim();
  if (email && !validEmail(email)) errors.email = 'validation.email';

  const phone = registration.phone.trim();
  if (phone && !/^0\d{9}$/.test(phone)) errors.phone = 'auth.invalidPhone';

  const birthDateValue = registration.birth_date.trim();
  if (birthDateValue) {
    const birthDate = parseBirthDate(birthDateValue);
    if (!birthDate) errors.birth_date = 'auth.invalidBirthDate';
    else if (!isAtLeastSeven(birthDate, now)) errors.birth_date = 'auth.minimumAge';
  }

  if (registration.password.trim()) {
    if (Array.from(registration.password).length < 12) {
      errors.password = 'auth.passwordTooShort';
    } else if (new TextEncoder().encode(registration.password).byteLength > 72) {
      errors.password = 'auth.passwordTooLong';
    }
  }

  return errors;
}
