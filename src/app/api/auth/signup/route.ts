import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAuthSession,
  hashPassword,
  normalizeEmail,
} from '@/lib/mysql-auth';
import { getMySqlPool } from '@/lib/mysql';

export const runtime = 'nodejs';

const phoneNumberSchema = z.string().trim().min(7).max(25)
  .regex(/^[+()\d\s.-]+$/);

const signupSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  surname: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  contactNumber: phoneNumberSchema,
  workNumber: phoneNumberSchema,
  persalNumber: z.string().trim().min(1).max(32),
  password: z.string().min(12).max(128),
  confirmPassword: z.string().min(1).max(128),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
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
      { error: 'Enter valid account details and make sure both password fields match.' },
      { status: 400 }
    );
  }

  try {
    const account = parsed.data;
    const userId = randomUUID();
    const fullName = `${account.firstName} ${account.surname}`;
    const passwordHash = await hashPassword(account.password);
    await getMySqlPool().execute(
      `INSERT INTO website_users
         (user_id, full_name, surname, email_address, contact_number, work_number,
          persal_number, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'staff')`,
      [
        userId,
        fullName,
        account.surname,
        normalizeEmail(account.email),
        account.contactNumber,
        account.workNumber,
        account.persalNumber,
        passwordHash,
      ]
    );

    const sessionToken = await createAuthSession(userId);
    const response = NextResponse.json(
      {
        user: {
          id: userId,
          fullName,
          email: normalizeEmail(account.email),
          role: 'staff',
        },
      },
      { status: 201 }
    );
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return Response.json(
        { error: 'An account with this email address or PERSAL number already exists.' },
        { status: 409 }
      );
    }
    console.error('Failed to create a public staff account.', error);
    return Response.json({ error: 'Unable to create your account right now.' }, { status: 503 });
  }
}
