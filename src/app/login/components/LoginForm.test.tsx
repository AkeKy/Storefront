import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/features/i18n/LanguageContext';
import LoginForm from './LoginForm';

const mocks = vi.hoisted(() => ({ login: vi.fn(), replace: vi.fn() }));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ login: mocks.login }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

const renderForm = (returnTo?: string) =>
  render(
    <LanguageProvider>
      <LoginForm returnTo={returnTo} />
    </LanguageProvider>
  );

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('shows localized required-field errors without submitting', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findAllByRole('alert')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveAttribute(
      'aria-describedby',
      'login-username-error'
    );
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('prevents a duplicate submit while login is pending', async () => {
    let resolveLogin!: (value: { ok: true }) => void;
    mocks.login.mockImplementation(
      () => new Promise<{ ok: true }>((resolve) => (resolveLogin = resolve))
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    const submit = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submit);
    await user.click(submit);

    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    expect(submit.closest('form')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Signing in...');
    await act(async () => resolveLogin({ ok: true }));
  });

  it('shows invalid credentials as a prominent field error and clears it on edit', async () => {
    mocks.login.mockResolvedValue({ ok: false, error: 'invalidCredentials' });
    const user = userEvent.setup();
    renderForm();

    const username = screen.getByLabelText('Username');
    const password = screen.getByLabelText('Password');
    await user.type(username, 'buyer');
    await user.type(password, 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid username or password.');
    expect(alert).toHaveClass('border-destructive/40', 'bg-destructive/10');
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-describedby', 'login-submission-error');
    expect(password).toHaveValue('');
    expect(password).toHaveFocus();

    await user.type(password, 'n');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(username).toHaveAttribute('aria-invalid', 'false');
    expect(password).toHaveAttribute('aria-invalid', 'false');
  });

  it('returns to a valid internal path after login', async () => {
    mocks.login.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderForm('/checkout');

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.replace).toHaveBeenCalledWith('/checkout');
  });

  it('preserves a safe internal query and hash after login', async () => {
    mocks.login.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderForm('/checkout?step=review#summary');

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.replace).toHaveBeenCalledWith('/checkout?step=review#summary');
  });

  it.each([
    ['protocol-relative path', '//attacker.example.test'],
    ['raw carriage return', '/checkout\r//attacker.example.test'],
    ['raw line feed', '/checkout\n//attacker.example.test'],
    ['raw tab', '/checkout\t//attacker.example.test'],
    ['encoded carriage return', '/checkout%0d%0a//attacker.example.test'],
    ['encoded tab', '/checkout%09//attacker.example.test'],
    ['raw backslash', '/\\attacker.example.test'],
    ['encoded backslash', '/%5cattacker.example.test'],
    ['absolute scheme after normalization', '/%2f%2fattacker.example.test'],
    ['encoded dot segment then protocol-relative path', '/%2e%2e//attacker.example.test'],
    ['double-encoded dot and slash segments', '/%252e%252e%252f%252fattacker.example.test'],
    ['encoded dot segment and backslash', '/%2e%2e%5cattacker.example.test'],
    ['double-encoded carriage return', '/checkout%250d%250a//attacker.example.test'],
    ['double-encoded backslash', '/%255cattacker.example.test'],
  ])('rejects %s as a return target', async (_name, returnTo) => {
    mocks.login.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderForm(returnTo);

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.replace).toHaveBeenCalledWith('/');
    expect(mocks.replace).not.toHaveBeenCalledWith(returnTo);
  });
});
