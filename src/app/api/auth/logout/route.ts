import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  revokeAuthSession,
} from '@/lib/mysql-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await revokeAuthSession(request);
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('Failed to close the MySQL login session.', error);
    return Response.json(
      { error: 'Unable to sign out right now.' },
      { status: 503 }
    );
  }
}
