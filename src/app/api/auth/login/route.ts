import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAuthSession,
  findAccountByEmail,
  verifyPassword,
} from '@/lib/mysql-auth';
import { isStaffRole } from '@/lib/roles';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  }

  try {
    const account = await findAccountByEmail(parsed.data.email);
    const passwordValid = account && isStaffRole(account.role)
      ? await verifyPassword(parsed.data.password, account.password_hash)
      : false;
    if (!account || !passwordValid) {
      return Response.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      );
    }

    const sessionToken = await createAuthSession(account.user_id);
    const response = NextResponse.json({
      user: {
        id: account.user_id,
        fullName: account.full_name,
        email: account.email_address,
        role: account.role,
      },
    });
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('Failed to authenticate against MySQL.', error);
    return Response.json(
      { error: 'Unable to sign in right now.' },
      { status: 503 }
    );
  }
}
