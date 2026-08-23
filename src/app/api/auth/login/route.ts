import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { backendRequest, BackendError } from '@/server/backend-client';
import { assertSameOrigin, OriginError } from '@/server/origin-guard';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/server/session-cookie';

type SessionUser = Record<string, unknown>;
type LoginResult = { access_token: string; expires_at: number; user: SessionUser };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const publicUser = (value: SessionUser) => {
  if (
    !Number.isSafeInteger(value.member_id) ||
    typeof value.username !== 'string' ||
    typeof value.first_name !== 'string' ||
    !Number.isSafeInteger(value.permission_id) ||
    typeof value.permission_name !== 'string'
  ) {
    throw new Error('Invalid session user.');
  }
  return {
    member_id: value.member_id,
    username: value.username,
    first_name: value.first_name,
    permission_id: value.permission_id,
    permission_name: value.permission_name,
    ...(typeof value.profile_image === 'string' && value.profile_image
      ? { profile_image: value.profile_image }
      : {}),
  };
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

    const result = await backendRequest<LoginResult>('/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: body.username, password: body.password }),
    });
    if (
      !isRecord(result) ||
      typeof result.access_token !== 'string' ||
      !Number.isFinite(result.expires_at) ||
      !isRecord(result.user)
    ) {
      throw new Error('Invalid login response.');
    }

    const maxAge = Math.max(0, Math.floor(result.expires_at - Date.now() / 1000));
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, result.access_token, sessionCookieOptions(maxAge));
    return NextResponse.json({ user: publicUser(result.user), expiresAt: result.expires_at });
  } catch (error) {
    return errorResponse(error);
  }
}
