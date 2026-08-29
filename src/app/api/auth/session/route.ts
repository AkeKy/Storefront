import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { authenticatedBackendRequest, BackendError } from '@/server/backend-client';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/server/session-cookie';
import { parsePublicSessionUser } from '@/server/session-user';

export async function GET(_request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ code: 'unauthorized' }, { status: 401 });

  try {
    const user = await authenticatedBackendRequest<Record<string, unknown>>('/api/v1/me', token);
    const publicUser = parsePublicSessionUser(user);
    if (!publicUser) throw new Error('Invalid session user.');
    return NextResponse.json({ user: publicUser });
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
