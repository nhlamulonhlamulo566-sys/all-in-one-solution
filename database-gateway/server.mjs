import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env.local') });
dotenv.config({ path: join(root, '.env'), override: false });

const token = process.env.DB_GATEWAY_TOKEN;
const port = Number(process.env.DB_GATEWAY_PORT || 8787);
const host = process.env.DB_GATEWAY_HOST || '127.0.0.1';
const maxBodyBytes = 1024 * 1024;

if (!token || Buffer.byteLength(token) < 32) {
  throw new Error('Set DB_GATEWAY_TOKEN to a random secret of at least 32 characters.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_GATEWAY_PORT must be a valid TCP port.');
}

const missingDbConfig = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  .filter((key) => !process.env[key]);
if (missingDbConfig.length) {
  throw new Error(`Missing database configuration: ${missingDbConfig.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true }
    : { rejectUnauthorized: false },
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

function normalizedSql(sql) {
  return sql.replace(/\s+/g, ' ').trim();
}

function collectQueryHashes(directory) {
  const hashes = new Set();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const hash of collectQueryHashes(path)) hashes.add(hash);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;

    const source = readFileSync(path, 'utf8');
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (
        ts.isCallExpression(node)
        && ts.isPropertyAccessExpression(node.expression)
        && ['execute', 'query'].includes(node.expression.name.text)
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          hashes.add(createHash('sha256').update(normalizedSql(argument.text)).digest('hex'));
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return hashes;
}

const allowedQueryHashes = collectQueryHashes(join(root, 'src'));
if (allowedQueryHashes.size === 0) throw new Error('No application SQL statements were allowlisted.');

function authorized(request) {
  const [scheme, value] = (request.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !value) return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function send(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validateStatement(statement) {
  if (!statement || typeof statement.sql !== 'string' || !Array.isArray(statement.values ?? [])) {
    throw new Error('Invalid database statement.');
  }
  const hash = createHash('sha256').update(normalizedSql(statement.sql)).digest('hex');
  if (!allowedQueryHashes.has(hash)) throw new Error('SQL statement is not allowed.');
  return statement.values ?? [];
}

async function updateUserRole({ userId, role, adminId, adminRole }) {
  if (
    typeof userId !== 'string'
    || typeof adminId !== 'string'
    || !['super_admin', 'admin', 'staff'].includes(role)
    || adminRole !== 'super_admin'
  ) {
    return { status: 400, body: { error: 'Invalid role update.' } };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute(
      'SELECT user_id, role FROM website_users WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const target = users[0];
    if (!target) {
      await connection.rollback();
      return { status: 404, body: { error: 'User account not found.' } };
    }

    if (target.role === 'super_admin' && role !== 'super_admin') {
      if (target.user_id === adminId) {
        await connection.rollback();
        return {
          status: 409,
          body: { error: 'You cannot remove super administrator access from your own account.' },
        };
      }
      const [admins] = await connection.execute(
        "SELECT user_id FROM website_users WHERE role = 'super_admin' FOR UPDATE"
      );
      if (admins.length <= 1) {
        await connection.rollback();
        return { status: 409, body: { error: 'The last super administrator cannot be demoted.' } };
      }
    }

    await connection.execute('UPDATE website_users SET role = ? WHERE user_id = ?', [role, userId]);
    await connection.commit();
    return { status: 200, body: { user: { id: userId, role } } };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function manageStaffChat({ action, sessionId, staffId, note = '' }) {
  if (
    !['accept', 'close'].includes(action)
    || typeof sessionId !== 'string'
    || typeof staffId !== 'string'
    || typeof note !== 'string'
    || note.length > 2000
  ) {
    return { status: 400, body: { error: 'Invalid live chat action.' } };
  }

  const connection = await pool.getConnection();
  const lockName = `staff-chat-capacity:${staffId}`;
  let lockAcquired = false;
  let transactionStarted = false;

  try {
    if (action === 'accept') {
      const [locks] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      if (Number(locks[0]?.acquired) !== 1) {
        return { status: 503, body: { error: 'Could not reserve a chat slot. Please try again.' } };
      }
      lockAcquired = true;
    }

    await connection.beginTransaction();
    transactionStarted = true;
    const [sessions] = await connection.execute(
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

      const [queue] = await connection.execute(
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

      const [active] = await connection.execute(
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

      const [staff] = await connection.execute(
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
    if (lockAcquired) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
    connection.release();
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/healthz') {
    try {
      await pool.query('SELECT 1');
      return send(response, 200, { status: 'ok' });
    } catch (error) {
      console.error('Database gateway health check failed:', error.code || error.message);
      return send(response, 503, { error: 'Database unavailable.' });
    }
  }
  if (request.method !== 'POST' || !['/execute', '/admin/user-role', '/staff/chat'].includes(request.url)) {
    return send(response, 404, { error: 'Not found.' });
  }
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized.' });
  if (!request.headers['content-type']?.startsWith('application/json')) {
    return send(response, 415, { error: 'JSON content type required.' });
  }

  try {
    const body = await readJson(request);
    if (request.url === '/admin/user-role') {
      const result = await updateUserRole(body);
      return send(response, result.status, result.body);
    }
    if (request.url === '/staff/chat') {
      const result = await manageStaffChat(body);
      return send(response, 200, result);
    }
    const values = validateStatement(body);
    const [result] = await pool.execute(body.sql, values);
    return send(response, 200, { result });
  } catch (error) {
    if (error instanceof SyntaxError || error.message === 'Request body is too large.') {
      return send(response, 400, { error: error.message });
    }
    if (error.message === 'Invalid database statement.' || error.message === 'SQL statement is not allowed.') {
      return send(response, 403, { error: error.message });
    }
    console.error('Database gateway request failed:', error.code || error.message);
    return send(response, 502, { error: 'Database operation failed.' });
  }
});

server.on('clientError', (_error, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));
server.listen(port, host, () => {
  console.log(`Database gateway listening on ${host}:${port}; ${allowedQueryHashes.size} application queries allowlisted.`);
});

async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
