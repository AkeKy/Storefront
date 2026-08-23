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
    await act(async () => resolveLogin({ ok: true }));
  });

  it('shows a generic message for invalid credentials and clears the password', async () => {
    mocks.login.mockResolvedValue({ ok: false, error: 'invalidCredentials' });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('returns to a valid internal path after login and rejects external return targets', async () => {
    mocks.login.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { rerender } = renderForm('/checkout');

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.replace).toHaveBeenCalledWith('/checkout');

    mocks.replace.mockClear();
    rerender(
      <LanguageProvider>
        <LoginForm key="unsafe" returnTo="//attacker.example.test" />
      </LanguageProvider>
    );
    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
