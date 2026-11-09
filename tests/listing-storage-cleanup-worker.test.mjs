import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCleanupWorker } from '../supabase/functions/listing-storage-cleanup/worker.mjs';

const workerSecret = 'unit-test-worker-secret-that-is-long-enough';
const serviceRoleKey = 'unit-test-service-role-key';
const listingId = 'c28d9d4a-9b6e-4d4d-a4eb-531eab5d58c9';
const task = (overrides = {}) => ({
  id: '12db46c4-5e3a-41a6-861f-128929724c8a',
  listing_id: listingId,
  image_id: null,
  storage_path: `listings/${listingId}/image.jpg`,
  reason: 'image_delete',
  attempts: 1,
  claim_token: '672da9a7-5471-4f3e-b9e3-7fbce62dad95',
  ...overrides,
});

function createRequest(secret = workerSecret, method = 'POST') {
  return new Request('http://worker.test/', {
    method,
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

function worker(fetch, options = {}) {
  const values = {
    LISTING_CLEANUP_WORKER_SECRET: workerSecret,
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    ...options.environment,
  };
  return createCleanupWorker({
    get: (name) => values[name],
    fetch,
    log: options.log ?? (() => {}),
  });
}

function rpcCall(url, init, name) {
  assert.match(String(url), new RegExp(`/rest/v1/rpc/${name}$`));
  assert.equal(new Headers(init.headers).get('apikey'), serviceRoleKey);
  return JSON.parse(init.body);
}

test('rejects unauthenticated calls before using service credentials', async () => {
  let called = false;
  const handle = worker(async () => {
    called = true;
    throw new Error('must not fetch');
  });

  const response = await handle(createRequest('wrong-secret'));
  assert.equal(response.status, 401);
  assert.equal(called, false);
});

test('claims, removes through Storage API, and acknowledges one image task', async () => {
  const calls = [];
  const handle = worker(async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('/rest/v1/rpc/claim_listing_storage_cleanup_tasks')) {
      return Response.json([task()]);
    }
    if (String(url).includes('/storage/v1/object/listings')) {
      assert.equal(init.method, 'DELETE');
      assert.deepEqual(JSON.parse(init.body), {
        prefixes: [`listings/${listingId}/image.jpg`],
      });
      return new Response(null, { status: 200 });
    }
    assert.equal(
      String(url).endsWith('/complete_claimed_listing_storage_cleanup_task'),
      true,
    );
    assert.deepEqual(rpcCall(url, init, 'complete_claimed_listing_storage_cleanup_task'), {
      p_task_id: task().id,
      p_claim_token: task().claim_token,
    });
    return Response.json(true);
  });

  const response = await handle(createRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    claimed: 1,
    results: { completed: 1 },
  });
  assert.equal(calls.length, 3);
});

test('treats a missing Storage object as a successful deletion', async () => {
  const handle = worker(async (url) => {
    if (String(url).includes('claim_listing_storage_cleanup_tasks')) {
      return Response.json([task()]);
    }
    if (String(url).includes('/storage/v1/object/')) {
      return Response.json({ error: 'Object not found' }, { status: 404 });
    }
    return Response.json(true);
  });

  const response = await handle(createRequest());
  assert.deepEqual(await response.json(), {
    claimed: 1,
    results: { completed: 1 },
  });
});

test('retries a transient Storage error without blocking other tasks', async () => {
  const failedTask = task();
  const successfulTask = task({
    id: 'a4d3a8ba-2796-40d0-879e-5889df110f39',
    storage_path: `listings/${listingId}/second.jpg`,
    claim_token: 'be4c32e4-48b3-4ea6-9c95-8c742cbfccca',
  });
  const retryCalls = [];
  const handle = worker(async (url, init) => {
    if (String(url).includes('claim_listing_storage_cleanup_tasks')) {
      return Response.json([failedTask, successfulTask]);
    }
    if (String(url).includes('/storage/v1/object/')) {
      return String(init.body).includes('image.jpg')
        ? new Response(null, { status: 503 })
        : new Response(null, { status: 200 });
    }
    if (String(url).includes('retry_listing_storage_cleanup_task')) {
      retryCalls.push(rpcCall(url, init, 'retry_listing_storage_cleanup_task'));
      return Response.json(true);
    }
    return Response.json(true);
  });

  const response = await handle(createRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    claimed: 2,
    results: { retried: 1, completed: 1 },
  });
  assert.deepEqual(retryCalls, [{
    p_task_id: failedTask.id,
    p_claim_token: failedTask.claim_token,
    p_error_code: 'storage_unavailable',
  }]);
});

test('rejects invalid object paths without preventing the valid task', async () => {
  const invalidTask = task({ storage_path: `listings/${listingId}/nested/image.jpg` });
  const validTask = task({
    id: 'a4d3a8ba-2796-40d0-879e-5889df110f39',
    storage_path: `listings/${listingId}/valid.jpg`,
  });
  const retried = [];
  const removed = [];
  const handle = worker(async (url, init) => {
    if (String(url).includes('claim_listing_storage_cleanup_tasks')) {
      return Response.json([invalidTask, validTask]);
    }
    if (String(url).includes('/storage/v1/object/')) {
      removed.push(init.body);
      return new Response(null, { status: 200 });
    }
    if (String(url).includes('retry_listing_storage_cleanup_task')) {
      retried.push(rpcCall(url, init, 'retry_listing_storage_cleanup_task'));
      return Response.json(true);
    }
    return Response.json(true);
  });

  const response = await handle(createRequest());
  assert.deepEqual(await response.json(), {
    claimed: 2,
    results: { retried: 1, completed: 1 },
  });
  assert.equal(removed.length, 1);
  assert.deepEqual(retried.map((entry) => entry.p_error_code), ['invalid_storage_path']);
});

test('rejects non-POST requests', async () => {
  const handle = worker(async () => {
    throw new Error('must not fetch');
  });
  const response = await handle(createRequest(workerSecret, 'GET'));
  assert.equal(response.status, 405);
});
