import { NextResponse } from 'next/server';

import { backendRequest, BackendError } from '@/server/backend-client';
import { assertSameOrigin, OriginError } from '@/server/origin-guard';

const approvedFields = [
  'username',
  'password',
  'first_name',
  'last_name',
  'email',
  'phone',
  'birth_date',
] as const;
type RegisterField = (typeof approvedFields)[number];
type RegisterPayload = Record<RegisterField, string>;

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

const approvedRegistrationPayload = (body: unknown): RegisterPayload | undefined => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const record = body as Record<string, unknown>;
  const result = {} as RegisterPayload;
  for (const field of approvedFields) {
    if (typeof record[field] !== 'string') return undefined;
    result[field] = record[field];
  }
  return result;
};

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const payload = approvedRegistrationPayload(await request.json());
    if (!payload) throw new Error('Invalid registration request.');
    await backendRequest<void>('/api/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({});
  } catch (error) {
    return errorResponse(error);
  }
}
