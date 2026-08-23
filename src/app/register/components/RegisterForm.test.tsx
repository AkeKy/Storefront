import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/features/i18n/LanguageContext';
import RegisterForm from './RegisterForm';

const mocks = vi.hoisted(() => ({ register: vi.fn(), replace: vi.fn() }));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ register: mocks.register }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

const renderForm = () =>
  render(
    <LanguageProvider>
      <RegisterForm />
    </LanguageProvider>
  );

describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits exactly the public member registration fields', async () => {
    mocks.register.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'correct-horse-123');
    await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-123');
    await user.type(screen.getByLabelText('First name'), 'Buy');
    await user.type(screen.getByLabelText('Last name'), 'Er');
    await user.type(screen.getByLabelText('Phone number'), '0812345678');
    await user.type(screen.getByLabelText('Email address'), 'buyer@example.test');
    await user.type(screen.getByLabelText('Birth date'), '2000-01-02');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(mocks.register).toHaveBeenCalledWith({
      username: 'buyer',
      password: 'correct-horse-123',
      first_name: 'Buy',
      last_name: 'Er',
      phone: '0812345678',
      email: 'buyer@example.test',
      birth_date: '2000-01-02',
    });
    expect(Object.keys(mocks.register.mock.calls[0][0])).not.toEqual(
      expect.arrayContaining(['permission_id', 'created_at', 'updated_at', 'audit'])
    );
    expect(mocks.replace).toHaveBeenCalledWith('/login');
  });

  it('focuses the first invalid field and associates its error text', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findAllByRole('alert')).toHaveLength(8);
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveAttribute(
      'aria-describedby',
      'register-username-error'
    );
  });

  it('announces registration submission while the request is pending', async () => {
    let resolveRegistration!: (value: { ok: true }) => void;
    mocks.register.mockImplementation(
      () => new Promise<{ ok: true }>((resolve) => (resolveRegistration = resolve))
    );
    const user = userEvent.setup();
    renderForm();
    await completeRegistration(user);

    const submit = screen.getByRole('button', { name: 'Create account' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    expect(submit.closest('form')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Creating account...');
    await act(async () => resolveRegistration({ ok: true }));
  });

  it('clears both password fields after an unsuccessful request without showing raw errors', async () => {
    mocks.register.mockResolvedValue({ ok: false, error: 'accountConflict' });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Username'), 'buyer');
    await user.type(screen.getByLabelText('Password'), 'correct-horse-123');
    await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-123');
    await user.type(screen.getByLabelText('First name'), 'Buy');
    await user.type(screen.getByLabelText('Last name'), 'Er');
    await user.type(screen.getByLabelText('Phone number'), '0812345678');
    await user.type(screen.getByLabelText('Email address'), 'buyer@example.test');
    await user.type(screen.getByLabelText('Birth date'), '2000-01-02');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with these details already exists.'
    );
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm password')).toHaveValue('');
  });
});

async function completeRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Username'), 'buyer');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-123');
  await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-123');
  await user.type(screen.getByLabelText('First name'), 'Buy');
  await user.type(screen.getByLabelText('Last name'), 'Er');
  await user.type(screen.getByLabelText('Phone number'), '0812345678');
  await user.type(screen.getByLabelText('Email address'), 'buyer@example.test');
  await user.type(screen.getByLabelText('Birth date'), '2000-01-02');
}
