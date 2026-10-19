import { createHash, timingSafeEqual } from 'node:crypto';
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
  if (request.method !== 'POST' || !['/execute', '/admin/user-role'].includes(request.url)) {
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
