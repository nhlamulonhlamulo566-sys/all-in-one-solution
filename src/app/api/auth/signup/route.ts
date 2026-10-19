import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAccount,
  createAuthSession,
} from '@/lib/mysql-auth';

export const runtime = 'nodejs';

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a valid name and email, and a password of at least 12 characters.' },
      { status: 400 }
    );
  }

  try {
    const user = await createAccount(parsed.data);
    const sessionToken = await createAuthSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      return Response.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }
    console.error('Failed to create a MySQL account.', error);
    return Response.json(
      { error: 'Unable to create your account right now.' },
      { status: 503 }
    );
  }
}
