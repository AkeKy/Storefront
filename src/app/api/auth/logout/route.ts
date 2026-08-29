import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { assertSameOrigin, OriginError } from '@/server/origin-guard';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/server/session-cookie';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof OriginError) {
      return NextResponse.json({ code: 'invalid_origin' }, { status: 403 });
    }
    return NextResponse.json({ code: 'invalid_request' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', sessionCookieOptions(0));
  return new NextResponse(null, { status: 204 });
}
