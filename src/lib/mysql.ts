import 'server-only';

import { randomUUID } from 'node:crypto';
import { createPool } from 'mysql2/promise';
import type { ExecuteValues, FieldPacket, QueryOptions, QueryResult, RowDataPacket } from 'mysql2';

type MySqlPool = Pick<ReturnType<typeof createPool>, 'execute'>;

let directPool: ReturnType<typeof createPool> | undefined;
let mysqlPool: MySqlPool | undefined;

function getDirectPool() {
  if (directPool) return directPool;
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const missing = Object.entries({
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing database configuration: ${missing.join(', ')}`);
  }
  const databaseCa = process.env.DB_SSL_CA?.trim();
  if (!databaseCa) {
    throw new Error(
      'DB_SSL_CA is required for direct MySQL connections; unverified TLS is not allowed.'
    );
  }

  directPool = createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: {
      ca: databaseCa.replace(/\\n/g, '\n'),
      rejectUnauthorized: true,
    },
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return directPool;
}

function getGatewayConfiguration() {
  const { DB_GATEWAY_URL, DB_GATEWAY_TOKEN } = process.env;
  if (Boolean(DB_GATEWAY_URL) !== Boolean(DB_GATEWAY_TOKEN)) {
    throw new Error('DB_GATEWAY_URL and DB_GATEWAY_TOKEN must both be configured.');
  }
  if (process.env.NODE_ENV === 'production' && !DB_GATEWAY_URL) {
    throw new Error('DB_GATEWAY_URL and DB_GATEWAY_TOKEN are required in production.');
  }
  if (DB_GATEWAY_URL && process.env.NODE_ENV === 'production' && new URL(DB_GATEWAY_URL).protocol !== 'https:') {
    throw new Error('DB_GATEWAY_URL must use HTTPS in production.');
  }
  return DB_GATEWAY_URL && DB_GATEWAY_TOKEN
    ? { url: DB_GATEWAY_URL.replace(/\/+$/, ''), token: DB_GATEWAY_TOKEN }
    : undefined;
}

async function gatewayRequest<T>(path: string, payload: unknown): Promise<T> {
  const gateway = getGatewayConfiguration();
  if (!gateway) throw new Error('Database gateway is not configured.');

  const response = await fetch(`${gateway.url}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${gateway.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const body: unknown = await response.json().catch(() => {
    throw new Error(`Database gateway returned invalid JSON (HTTP ${response.status}).`);
  });
  if (!response.ok) {
    throw new Error(`Database gateway request failed (HTTP ${response.status}).`);
  }
  return body as T;
}

const gatewayPool: MySqlPool = {
  execute: async <T extends QueryResult>(
    sql: string | QueryOptions,
    values?: ExecuteValues
  ): Promise<[T, FieldPacket[]]> => {
    const query = typeof sql === 'string' ? sql : sql.sql;
    const parameters = values ?? (typeof sql === 'string' ? [] : sql.values ?? []);
    const { result } = await gatewayRequest<{ result: T }>('/execute', {
      sql: query,
      values: parameters,
    });
    return [result, []];
  },
};

export function isMySqlGatewayEnabled() {
  return Boolean(process.env.DB_GATEWAY_URL || process.env.DB_GATEWAY_TOKEN);
}

export async function updateUserRoleThroughGateway(input: {
  userId: string;
  role: 'super_admin' | 'admin' | 'staff';
  adminId: string;
  adminRole: 'super_admin' | 'admin' | 'staff';
}) {
  return gatewayRequest<{ status: number; body: unknown }>('/admin/user-role', input);
}

type StaffChatAction =
  | { action: 'accept'; sessionId: string; staffId: string }
  | { action: 'close'; sessionId: string; staffId: string; note?: string };

type StaffChatActionResult = {
  status: number;
  body: { error?: string; ok?: boolean; activeChats?: number; capacity?: number };
};

async function staffChatActionDirect(input: StaffChatAction): Promise<StaffChatActionResult> {
  const { action, sessionId, staffId } = input;
  const note = input.action === 'close' ? input.note ?? '' : '';
  const connection = await getMySqlConnection();
  let transactionStarted = false;
  let lockAcquired = false;

  try {
    if (action === 'accept') {
      const [locks] = await connection.execute<RowDataPacket[]>(
        'SELECT GET_LOCK(?, 10) AS acquired',
        [`staff-chat-capacity:${staffId}`]
      );
      if (Number(locks[0]?.acquired) !== 1) {
        return { status: 503, body: { error: 'Could not reserve a chat slot. Please try again.' } };
      }
      lockAcquired = true;
    }

    await connection.beginTransaction();
    transactionStarted = true;
    const [sessions] = await connection.execute<RowDataPacket[]>(
      `SELECT session_id, status, assigned_to_user_id, created_at
       FROM website_chat_sessions
       WHERE session_id = ?
       FOR UPDATE`,
      [sessionId]
    );
    const session = sessions[0];
    if (!session) {
      await connection.rollback();
      transactionStarted = false;
      return { status: 404, body: { error: 'Chat session not found.' } };
    }

    if (action === 'accept') {
      if (session.status !== 'active') {
        await connection.rollback();
        transactionStarted = false;
        return { status: 409, body: { error: 'This chat is no longer waiting.' } };
      }
      if (session.assigned_to_user_id) {
        await connection.rollback();
        transactionStarted = false;
        return {
          status: session.assigned_to_user_id === staffId ? 200 : 409,
          body: session.assigned_to_user_id === staffId
            ? { ok: true }
            : { error: 'Another staff member has accepted this chat.' },
        };
      }

      const [queue] = await connection.execute<RowDataPacket[]>(
        `SELECT session_id
         FROM website_chat_sessions
         WHERE status = 'active' AND assigned_to_user_id IS NULL
           AND (created_at < ? OR (created_at = ? AND session_id < ?))
         ORDER BY created_at, session_id
         LIMIT 1`,
        [session.created_at, session.created_at, sessionId]
      );
      if (queue.length) {
        await connection.rollback();
        transactionStarted = false;
        return { status: 409, body: { error: 'Please accept the next waiting chat in the queue.' } };
      }

      const [active] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS active_count
         FROM website_chat_sessions
         WHERE assigned_to_user_id = ? AND status = 'active'`,
        [staffId]
      );
      if (Number(active[0]?.active_count) >= 5) {
        await connection.rollback();
        transactionStarted = false;
        return {
          status: 409,
          body: { error: 'You are already helping five clients. Close a resolved chat before accepting another.' },
        };
      }

      const [staff] = await connection.execute<RowDataPacket[]>(
        'SELECT full_name FROM website_users WHERE user_id = ? LIMIT 1',
        [staffId]
      );
      if (!staff[0]) {
        await connection.rollback();
        transactionStarted = false;
        return { status: 401, body: { error: 'Your staff account is no longer available.' } };
      }

      await connection.execute(
        `UPDATE website_chat_sessions
         SET assigned_to_user_id = ?, handling_status = 'in_progress',
             read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
             last_action_by_user_id = ?, last_action_type = 'claimed',
             last_action_note = NULL, last_action_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [staffId, staffId, staffId, sessionId]
      );
      await connection.execute(
        `INSERT INTO website_chat_messages
           (message_id, session_id, sender_id, sender_role, message_text)
         VALUES (?, ?, ?, 'staff', ?)`,
        [
          randomUUID(),
          sessionId,
          staffId,
          `Hello, welcome to All In One Solution! My name is ${staff[0].full_name}. Thank you for getting in touch — how may I help you today?`,
        ]
      );
      await connection.commit();
      transactionStarted = false;
      return {
        status: 200,
        body: { ok: true, activeChats: Number(active[0]?.active_count ?? 0) + 1, capacity: 5 },
      };
    }

    if (session.status === 'closed') {
      await connection.commit();
      transactionStarted = false;
      return { status: 200, body: { ok: true } };
    }
    if (session.assigned_to_user_id !== staffId) {
      await connection.rollback();
      transactionStarted = false;
      return { status: 403, body: { error: 'Only the assigned staff member can close this chat.' } };
    }

    await connection.execute(
      `UPDATE website_chat_sessions
       SET status = 'closed', handling_status = 'resolved',
           resolution_note = ?,
           read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
           last_action_by_user_id = ?, last_action_type = 'updated',
           last_action_note = 'Chat closed by staff.',
           last_action_at = CURRENT_TIMESTAMP
       WHERE session_id = ?`,
      [note || null, staffId, staffId, sessionId]
    );
    await connection.execute(
      `INSERT INTO website_chat_messages
         (message_id, session_id, sender_id, sender_role, message_text)
       VALUES (?, ?, ?, 'staff', ?)`,
      [
        randomUUID(),
        sessionId,
        staffId,
        'Thank you for chatting with All In One Solution. It was a pleasure assisting you. If you need anything else, please start a new chat — we will be happy to help. Have a wonderful day!',
      ]
    );
    await connection.commit();
    transactionStarted = false;
    return { status: 200, body: { ok: true } };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    if (lockAcquired) {
      await connection.execute('SELECT RELEASE_LOCK(?)', [`staff-chat-capacity:${staffId}`]);
    }
    connection.release();
  }
}

export async function manageStaffChat(input: StaffChatAction): Promise<StaffChatActionResult> {
  if (getGatewayConfiguration()) {
    return gatewayRequest<StaffChatActionResult>('/staff/chat', input);
  }
  return staffChatActionDirect(input);
}

export function getMySqlPool(): MySqlPool {
  if (mysqlPool) return mysqlPool;
  mysqlPool = getGatewayConfiguration() ? gatewayPool : getDirectPool();
  return mysqlPool;
}

export function getMySqlConnection() {
  if (getGatewayConfiguration()) {
    throw new Error('Use a gateway transaction operation instead of a direct MySQL connection.');
  }
  return getDirectPool().getConnection();
}
