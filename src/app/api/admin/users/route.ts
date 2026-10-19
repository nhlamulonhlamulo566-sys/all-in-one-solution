import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { hashPassword, normalizeEmail } from '@/lib/mysql-auth';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';
import { APP_ROLES } from '@/lib/roles';

export const runtime = 'nodejs';

interface ManagedUserRow extends RowDataPacket {
  user_id: string;
  full_name: string;
  email_address: string;
  role: (typeof APP_ROLES)[number];
  created_at: Date;
}

const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: z.enum(APP_ROLES),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  try {
    const [users] = await getMySqlPool().execute<ManagedUserRow[]>(
      `SELECT user_id, full_name, email_address, role, created_at
       FROM website_users
       ORDER BY created_at DESC, full_name ASC`
    );
    return Response.json({
      users: users.map((user) => ({
        id: user.user_id,
        fullName: user.full_name,
        email: user.email_address,
        role: user.role,
        createdAt: user.created_at,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to load managed MySQL users.', error);
    return Response.json({ error: 'Unable to load users right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a valid name and email, and a password of 12–128 characters.' },
      { status: 400 }
    );
  }

  if (admin.role !== 'super_admin' && parsed.data.role !== 'staff') {
    return Response.json(
      { error: 'Only a super administrator can create administrator accounts.' },
      { status: 403 }
    );
  }

  try {
    const user = parsed.data;
    const userId = randomUUID();
    const passwordHash = await hashPassword(user.password);
    await getMySqlPool().execute(
      `INSERT INTO website_users (user_id, full_name, email_address, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, user.fullName, normalizeEmail(user.email), passwordHash, user.role]
    );
    return Response.json(
      {
        user: {
          id: userId,
          fullName: user.fullName,
          email: normalizeEmail(user.email),
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return Response.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }
    console.error('Failed to create an account from the admin console.', error);
    return Response.json({ error: 'Unable to create this account right now.' }, { status: 503 });
  }
}
