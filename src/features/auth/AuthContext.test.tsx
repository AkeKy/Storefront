import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const validUser = {
  member_id: 17,
  username: 'buyer',
  first_name: 'Buy',
  permission_id: 2,
  permission_name: 'Member',
};

function Probe() {
  const auth = useAuth();
  return (
    <>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="user">{auth.user?.username ?? 'none'}</p>
      <button onClick={() => void auth.login({ username: 'buyer', password: 'password' })}>
        Login
      </button>
      <button onClick={() => void auth.logout()}>Logout</button>
    </>
  );
}

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('restores a validated session without storing a token in browser storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.mocked(fetch).mockResolvedValueOnce(response({ user: validUser }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(await screen.findByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('buyer');
    expect(setItem.mock.calls.flat().join(' ')).not.toMatch(/token/i);
  });

  it('becomes anonymous when session restoration returns 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ code: 'unauthorized' }, 401));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByTestId('status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('updates the user from the BFF login response without token storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockResolvedValueOnce(response({ user: validUser, expiresAt: 1_800_000_000 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('anonymous');

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('authenticated');
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ username: 'buyer', password: 'password' }),
      })
    );
    expect(setItem.mock.calls.flat().join(' ')).not.toMatch(/token/i);
  });

  it('clears the local user after logout even when the network request fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ user: validUser }))
      .mockRejectedValueOnce(new Error('offline'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('authenticated');

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });
});
