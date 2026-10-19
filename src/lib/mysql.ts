import 'server-only';

import { createPool } from 'mysql2/promise';
import type { ExecuteValues, FieldPacket, QueryOptions, QueryResult } from 'mysql2';

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

  directPool = createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: { rejectUnauthorized: false },
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
