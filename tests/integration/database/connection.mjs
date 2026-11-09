import { Pool } from 'pg';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function validateLocalDatabaseUrl(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must be set explicitly.');
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('AJOTORI_TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must use a PostgreSQL scheme.');
  }
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must use a loopback host.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must not contain query or fragment parameters.');
  }
  if (!parsed.port) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must specify a port.');
  }
  if (!parsed.username || !parsed.pathname || parsed.pathname === '/') {
    throw new Error('AJOTORI_TEST_DATABASE_URL must specify a database and user.');
  }

  return value;
}

export function createLocalDatabasePool(
  value = process.env.AJOTORI_TEST_DATABASE_URL,
  PoolConstructor = Pool,
) {
  const connectionString = validateLocalDatabaseUrl(value);
  return new PoolConstructor({
    connectionString,
    connectionTimeoutMillis: 2000,
    max: 2,
    ssl: false,
  });
}
