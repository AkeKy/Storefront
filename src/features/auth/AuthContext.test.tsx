import { act, render, screen, waitFor } from '@testing-library/react';
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
      <button onClick={() => void auth.refresh()}>Refresh</button>
    </>
  );
}

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('purges legacy browser tokens without reading their values', async () => {
    window.localStorage.setItem('byteforge-token', 'legacy-local-token');
    window.sessionStorage.setItem('byteforge-token', 'legacy-session-token');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    vi.mocked(fetch).mockResolvedValueOnce(response({ code: 'unauthorized' }, 401));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByTestId('status')).toHaveTextContent('anonymous');
    expect(getItem).not.toHaveBeenCalledWith('byteforge-token');
    expect(window.localStorage.getItem('byteforge-token')).toBeNull();
    expect(window.sessionStorage.getItem('byteforge-token')).toBeNull();
  });

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

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
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

  it('becomes anonymous when login fails after cancelling pending session restoration', async () => {
    const mountSession = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(mountSession.promise)
      .mockResolvedValueOnce(response({ code: 'invalid_credentials' }, 401));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('becomes anonymous when login has a network error after cancelling restoration', async () => {
    const mountSession = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(mountSession.promise)
      .mockRejectedValueOnce(new Error('offline'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('preserves an authenticated user when a replacement login is rejected', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ user: validUser }))
      .mockResolvedValueOnce(response({ code: 'invalid_credentials' }, 401));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('authenticated');

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('buyer');
  });

  it('aborts a pending login when logout starts', async () => {
    let loginSignal: AbortSignal | undefined;
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockImplementationOnce((_input, init) => {
        loginSignal = init?.signal ?? undefined;
        return new Promise<Response>(() => undefined);
      })
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('anonymous');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(loginSignal?.aborted).toBe(true);
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
  });

  it('ignores a stale successful login response after logout', async () => {
    const pendingLogin = deferred<Response>();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockReturnValueOnce(pendingLogin.promise)
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('anonymous');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await act(async () => {
      pendingLogin.resolve(response({ user: validUser, expiresAt: 1_800_000_000 }));
      await Promise.resolve();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
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

  it('keeps a successful login when a stale mount session response resolves afterward', async () => {
    const mountSession = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(mountSession.promise)
      .mockResolvedValueOnce(response({ user: validUser, expiresAt: 1_800_000_000 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByTestId('user')).toHaveTextContent('buyer');

    await act(async () => {
      mountSession.resolve(
        response({
          user: { ...validUser, username: 'stale-member', permission_id: 2 },
        })
      );
      await Promise.resolve();
    });
    expect(screen.getByTestId('user')).toHaveTextContent('buyer');
  });

  it('keeps logout anonymous when a stale mount session response resolves afterward', async () => {
    const mountSession = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(mountSession.promise)
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(await screen.findByTestId('status')).toHaveTextContent('anonymous');

    await act(async () => {
      mountSession.resolve(response({ user: validUser }));
      await Promise.resolve();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
  });

  it('keeps the newest refresh result when responses finish out of order', async () => {
    const firstRefresh = deferred<Response>();
    const secondRefresh = deferred<Response>();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ code: 'unauthorized' }, 401))
      .mockReturnValueOnce(firstRefresh.promise)
      .mockReturnValueOnce(secondRefresh.promise);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('anonymous');
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    secondRefresh.resolve(
      response({
        user: {
          ...validUser,
          username: 'newest-admin',
          permission_id: 1,
          permission_name: 'Admin',
        },
      })
    );
    expect(await screen.findByTestId('user')).toHaveTextContent('newest-admin');

    await act(async () => {
      firstRefresh.resolve(response({ user: { ...validUser, username: 'stale-member' } }));
      await Promise.resolve();
    });
    expect(screen.getByTestId('user')).toHaveTextContent('newest-admin');
  });
});
