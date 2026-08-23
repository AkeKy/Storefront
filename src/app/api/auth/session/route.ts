import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { authenticatedBackendRequest, BackendError } from '@/server/backend-client';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/server/session-cookie';

const publicUser = (value: Record<string, unknown>) => {
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

export async function GET(_request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ code: 'unauthorized' }, { status: 401 });

  try {
    const user = await authenticatedBackendRequest<Record<string, unknown>>('/api/v1/me', token);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) cookieStore.set(SESSION_COOKIE_NAME, '', sessionCookieOptions(0));
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ code: 'backend_unavailable' }, { status: 502 });
  }
}
