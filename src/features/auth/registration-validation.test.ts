import { describe, expect, it } from 'vitest';
import type { RegistrationData } from './types';
import { validateRegistration } from './registration-validation';

const now = new Date('2026-08-23T12:00:00.000Z');

const validRegistration = (): RegistrationData => ({
  username: 'buyer',
  password: 'correct-horse-123',
  first_name: 'Buy',
  last_name: 'Er',
  phone: '0812345678',
  email: 'buyer@example.test',
  birth_date: '2000-01-02',
});

describe('validateRegistration', () => {
  it('accepts the backend registration boundaries', () => {
    expect(validateRegistration(validRegistration(), now)).toEqual({});
  });

  it.each([
    ['email', 'buyer.example.test', { email: 'validation.email' }],
    ['phone', '081234567', { phone: 'auth.invalidPhone' }],
    ['birth_date', '2020-02-30', { birth_date: 'auth.invalidBirthDate' }],
    ['birth_date', '2020-08-24', { birth_date: 'auth.minimumAge' }],
    ['password', '🔐'.repeat(11), { password: 'auth.passwordTooShort' }],
    ['password', 'é'.repeat(37), { password: 'auth.passwordTooLong' }],
  ] as const)('rejects invalid backend-bound %s data', (field, value, expected) => {
    const registration = validRegistration();
    registration[field] = value;

    expect(validateRegistration(registration, now)).toEqual(expected);
  });

  it.each([
    'buyer..name@example.test',
    '.buyer@example.test',
    'buyer.@example.test',
    'buyer@.example.test',
    'buyer@example..test',
    'buyer@example.test.',
    'buyer@-example.test',
    'buyer@example-.test',
  ])('rejects unsafe dot-atom or hostname email structure %s', (email) => {
    const registration = validRegistration();
    registration.email = email;

    expect(validateRegistration(registration, now)).toEqual({ email: 'validation.email' });
  });
});
