import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { backendRequest, BackendError } from '@/server/backend-client';
import { assertSameOrigin, OriginError } from '@/server/origin-guard';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/server/session-cookie';
import { parsePublicSessionUser, type PublicSessionUser } from '@/server/session-user';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type LoginSession = {
  accessToken: string;
  expiresAt: number;
  maxAge: number;
  user: PublicSessionUser;
};

const parseLoginSession = (value: unknown, nowInSeconds: number): LoginSession | undefined => {
  if (!isRecord(value) || typeof value.access_token !== 'string') return undefined;
  const accessToken = value.access_token.trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)) return undefined;
  const expiresAt = value.expires_at;
  if (
    typeof expiresAt !== 'number' ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= nowInSeconds
  ) {
    return undefined;
  }

  const user = parsePublicSessionUser(value.user);
  if (!user) return undefined;

  const maxAge = expiresAt - nowInSeconds;
  if (!Number.isSafeInteger(maxAge) || maxAge <= 0) return undefined;
  return { accessToken, expiresAt, maxAge, user };
};

const errorResponse = (error: unknown) => {
  if (error instanceof OriginError)
    return NextResponse.json({ code: 'invalid_origin' }, { status: 403 });
  if (error instanceof BackendError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json({ code: 'invalid_request' }, { status: 400 });
};

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.username !== 'string' || typeof body.password !== 'string') {
      throw new Error('Invalid login request.');
    }

    const result = await backendRequest<unknown>('/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: body.username, password: body.password }),
    });
    const session = parseLoginSession(result, Math.floor(Date.now() / 1000));
    if (!session) throw new Error('Invalid login response.');

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.accessToken, sessionCookieOptions(session.maxAge));
    return NextResponse.json({ user: session.user, expiresAt: session.expiresAt });
  } catch (error) {
    return errorResponse(error);
  }
}
