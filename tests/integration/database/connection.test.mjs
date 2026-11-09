import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createLocalDatabasePool,
  validateLocalDatabaseUrl,
} from './connection.mjs';

const localUrl = 'postgresql://test-user:test-password@127.0.0.1:54322/postgres';

test('rejects a missing database URL before creating a pool', () => {
  let poolCreated = false;

  assert.throws(
    () => createLocalDatabasePool('', class {
      constructor() {
        poolCreated = true;
      }
    }),
    /must be set explicitly/,
  );
  assert.equal(poolCreated, false);
});

test('rejects a malformed database URL before creating a pool', () => {
  let poolCreated = false;

  assert.throws(
    () => createLocalDatabasePool('not a URL', class {
      constructor() {
        poolCreated = true;
      }
    }),
    /valid PostgreSQL URL/,
  );
  assert.equal(poolCreated, false);
});

test('rejects a non-loopback database URL before creating a pool', () => {
  let poolCreated = false;

  assert.throws(
    () => createLocalDatabasePool(
      'postgresql://user:password@db.example.com:5432/postgres',
      class {
        constructor() {
          poolCreated = true;
        }
      },
    ),
    /must use a loopback host/,
  );
  assert.equal(poolCreated, false);
});

test('accepts PostgreSQL URLs with explicit loopback hosts and ports', () => {
  assert.equal(validateLocalDatabaseUrl(localUrl), localUrl);
  assert.equal(
    validateLocalDatabaseUrl('postgres://user:password@[::1]:54322/postgres'),
    'postgres://user:password@[::1]:54322/postgres',
  );
  assert.equal(
    validateLocalDatabaseUrl('postgres://user:password@localhost:54322/postgres'),
    'postgres://user:password@localhost:54322/postgres',
  );
});

test('rejects non-PostgreSQL schemes and URLs without an explicit port', () => {
  assert.throws(
    () => validateLocalDatabaseUrl('https://localhost:54322/postgres'),
    /must use a PostgreSQL scheme/,
  );
  assert.throws(
    () => validateLocalDatabaseUrl('postgres://user:password@localhost/postgres'),
    /must specify a port/,
  );
});

test('rejects URL parameters that could override the validated endpoint', () => {
  assert.throws(
    () => validateLocalDatabaseUrl(
      'postgres://user:password@localhost:54322/postgres?host=db.example.com',
    ),
    /must not contain query or fragment parameters/,
  );
});
