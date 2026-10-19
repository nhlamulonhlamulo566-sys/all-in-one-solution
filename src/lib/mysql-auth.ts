import 'server-only';

import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

const scrypt = promisify(scryptCallback);
export const AUTH_COOKIE_NAME = 'aio_session';
export const AUTH_SESSION_SECONDS = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'staff' | 'admin';
};

type AccountRow = RowDataPacket & {
  user_id: string;
  full_name: string;
  email_address: string;
  password_hash: string;
  role: AuthUser['role'];
};

type SessionUserRow = RowDataPacket & {
  user_id: string;
  full_name: string;
  email_address: string;
  role: AuthUser['role'];
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex] = encoded.split(':');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = (await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getSessionToken(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));
  const token = cookie?.slice(AUTH_COOKIE_NAME.length + 1);
  return token && /^[A-Za-z0-9_-]{40,100}$/.test(token) ? token : null;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getSessionToken(request);
  if (!token || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;

  const [rows] = await getMySqlPool().execute<SessionUserRow[]>(
    `SELECT u.user_id, u.full_name, u.email_address, u.role
     FROM website_auth_sessions s
     JOIN website_users u ON u.user_id = s.user_id
     WHERE s.session_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [hashSessionToken(token)]
  );
  const user = rows[0];
  return user
    ? {
        id: user.user_id,
        fullName: user.full_name,
        email: user.email_address,
        role: user.role,
      }
    : null;
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  await getMySqlPool().execute(
    `INSERT INTO website_auth_sessions (session_hash, user_id, expires_at)
     VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND))`,
    [hashSessionToken(token), userId, AUTH_SESSION_SECONDS]
  );
  return token;
}

export async function revokeAuthSession(request: Request) {
  const token = getSessionToken(request);
  if (!token || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return;
  await getMySqlPool().execute(
    'DELETE FROM website_auth_sessions WHERE session_hash = ?',
    [hashSessionToken(token)]
  );
}

export async function createAccount(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const userId = randomUUID();
  const passwordHash = await hashPassword(input.password);
  await getMySqlPool().execute(
    `INSERT INTO website_users (user_id, full_name, email_address, password_hash)
     VALUES (?, ?, ?, ?)`,
    [userId, input.fullName.trim(), normalizeEmail(input.email), passwordHash]
  );
  return {
    id: userId,
    fullName: input.fullName.trim(),
    email: normalizeEmail(input.email),
    role: 'user' as const,
  };
}

export async function findAccountByEmail(email: string) {
  const [rows] = await getMySqlPool().execute<AccountRow[]>(
    `SELECT user_id, full_name, email_address, password_hash, role
     FROM website_users
     WHERE email_address = ?
     LIMIT 1`,
    [normalizeEmail(email)]
  );
  return rows[0] ?? null;
}
