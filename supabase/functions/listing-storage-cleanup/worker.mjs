// @ts-check

/**
 * @typedef {{
 *   id: string;
 *   listing_id: string;
 *   image_id: string | null;
 *   storage_path: string;
 *   reason: 'listing_delete' | 'image_delete' | 'upload_compensation';
 *   attempts: number;
 *   claim_token: string;
 * }} CleanupTask
 */

/**
 * @typedef {{
 *   get(name: string): string | undefined;
 *   fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
 *   log?: (taskId: string, errorCode: string) => void;
 * }} WorkerDependencies
 */

/** @type {number} */
const BATCH_SIZE = 25;
/** @type {number} */
const MAX_CONCURRENCY = 10;
/** @type {number} */
const FETCH_TIMEOUT_MS = 10_000;

const STORAGE_PATH_PATTERN =
  /^listings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9][A-Za-z0-9._-]*$/i;

/** @param {string} value */
async function hash(value) {
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
}

/** @param {string} left @param {string} right */
async function constantTimeEqual(left, right) {
  if (!left || !right) return false;
  const [leftHash, rightHash] = await Promise.all([hash(left), hash(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash[index] ^ rightHash[index];
  }
  return difference === 0;
}

/** @param {number} status @param {Record<string, unknown>} body */
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** @param {number} status */
function errorCodeForStorageStatus(status) {
  if (status === 429) return 'storage_rate_limited';
  if (status === 401 || status === 403) return 'storage_auth_failed';
  if (status >= 500) return 'storage_unavailable';
  return 'storage_rejected';
}

/** @param {Response} response */
async function isMissingStorageObject(response) {
  if (response.status !== 404) return false;
  try {
    const body = await response.json();
    const details = [body?.code, body?.error, body?.message]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLowerCase();
    return details.includes('nosuchkey')
      || details.includes('object not found')
      || details.includes('key not found');
  } catch {
    return false;
  }
}

/**
 * @param {WorkerDependencies} dependencies
 */
export function createCleanupWorker(dependencies) {
  const { get, fetch: fetchImpl } = dependencies;
  const log = dependencies.log ?? ((taskId, errorCode) => {
    console.error('Listing Storage cleanup task failed.', { taskId, errorCode });
  });

  /** @param {string} url @param {string} serviceRoleKey @param {string} path @param {unknown} body */
  async function request(url, serviceRoleKey, path, body) {
    const response = await fetchImpl(`${url}/rest/v1/rpc/${path}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('database_request_failed');
    return response.json();
  }

  /** @param {string} url @param {string} serviceRoleKey @param {CleanupTask} task @param {string} errorCode */
  async function retryTask(url, serviceRoleKey, task, errorCode) {
    try {
      const retried = await request(
        url,
        serviceRoleKey,
        'retry_listing_storage_cleanup_task',
        {
          p_task_id: task.id,
          p_claim_token: task.claim_token,
          p_error_code: errorCode,
        },
      );
      if (retried !== true) return 'stale';
      log(task.id, errorCode);
      return 'retried';
    } catch {
      log(task.id, 'retry_request_failed');
      return 'deferred';
    }
  }

  /** @param {string} url @param {string} serviceRoleKey @param {CleanupTask} task */
  async function processTask(url, serviceRoleKey, task) {
    if (!STORAGE_PATH_PATTERN.test(task.storage_path)) {
      return retryTask(url, serviceRoleKey, task, 'invalid_storage_path');
    }

    let storageResponse;
    try {
      storageResponse = await fetchImpl(`${url}/storage/v1/object/listings`, {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ prefixes: [task.storage_path] }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return retryTask(url, serviceRoleKey, task, 'storage_unavailable');
    }

    if (!storageResponse.ok && !await isMissingStorageObject(storageResponse)) {
      return retryTask(
        url,
        serviceRoleKey,
        task,
        errorCodeForStorageStatus(storageResponse.status),
      );
    }

    try {
      const completed = await request(
        url,
        serviceRoleKey,
        'complete_claimed_listing_storage_cleanup_task',
        {
          p_task_id: task.id,
          p_claim_token: task.claim_token,
        },
      );
      if (completed === true) return 'completed';
      return 'stale';
    } catch {
      return retryTask(url, serviceRoleKey, task, 'completion_request_failed');
    }
  }

  /** @param {string} url @param {string} serviceRoleKey @param {CleanupTask[]} tasks */
  async function processBatch(url, serviceRoleKey, tasks) {
    let nextIndex = 0;
    /** @type {string[]} */
    const results = [];
    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENCY, tasks.length) },
      async () => {
        while (nextIndex < tasks.length) {
          const task = tasks[nextIndex];
          nextIndex += 1;
          try {
            results.push(await processTask(url, serviceRoleKey, task));
          } catch {
            results.push(await retryTask(
              url,
              serviceRoleKey,
              task,
              'task_processing_failed',
            ));
          }
        }
      },
    );
    await Promise.all(workers);
    return results;
  }

  /** @param {Request} incomingRequest */
  return async function handle(incomingRequest) {
    if (incomingRequest.method !== 'POST') {
      return jsonResponse(405, { error: 'method_not_allowed' });
    }

    const workerSecret = get('LISTING_CLEANUP_WORKER_SECRET');
    const suppliedAuthorization = incomingRequest.headers.get('authorization') ?? '';
    const suppliedSecret = suppliedAuthorization.startsWith('Bearer ')
      ? suppliedAuthorization.slice('Bearer '.length)
      : '';
    if (
      !workerSecret
      || suppliedSecret.length > 2048
      || !await constantTimeEqual(workerSecret, suppliedSecret)
    ) {
      return jsonResponse(401, { error: 'unauthorized' });
    }

    const configuredUrl = get('SUPABASE_URL');
    const serviceRoleKey = get('SUPABASE_SERVICE_ROLE_KEY');
    if (!configuredUrl || !serviceRoleKey) {
      return jsonResponse(503, { error: 'worker_not_configured' });
    }

    let url;
    try {
      const parsedUrl = new URL(configuredUrl);
      if (
        parsedUrl.protocol !== 'https:'
        && !(parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'kong' && parsedUrl.port === '8000')
      ) {
        return jsonResponse(503, { error: 'worker_not_configured' });
      }
      url = parsedUrl.origin;
    } catch {
      return jsonResponse(503, { error: 'worker_not_configured' });
    }

    /** @type {CleanupTask[]} */
    let tasks;
    try {
      const data = await request(
        url,
        serviceRoleKey,
        'claim_listing_storage_cleanup_tasks',
        { p_limit: BATCH_SIZE },
      );
      if (!Array.isArray(data)) throw new Error('invalid_task_batch');
      tasks = /** @type {CleanupTask[]} */ (data);
    } catch {
      return jsonResponse(503, { error: 'queue_unavailable' });
    }

    const results = await processBatch(url, serviceRoleKey, tasks);
    const summary = results.reduce((counts, result) => {
      counts[result] = (counts[result] ?? 0) + 1;
      return counts;
    }, /** @type {Record<string, number>} */ ({}));
    return jsonResponse(200, { claimed: tasks.length, results: summary });
  };
}
