import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getStorageRemovalErrorDetails,
  removeListingImages,
} from '../lib/supabase/remove-listing-images';

const imagePaths = [
  'listings/listing-1/photo-a.jpg',
  'listings/listing-1/photo-b.webp',
];

test('removes a single listing image from the listings bucket', async () => {
  const calls: Array<{ bucket: string; paths: string[] }> = [];
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async remove(paths: string[]) {
            calls.push({ bucket, paths });
            return { error: null };
          },
        };
      },
    },
  };

  const result = await removeListingImages(client, [imagePaths[0]]);

  assert.deepEqual(calls, [{ bucket: 'listings', paths: [imagePaths[0]] }]);
  assert.deepEqual(result, { failure: null, pendingPaths: [] });
});

test('removes every image for a multi-image listing', async () => {
  let removedPaths: string[] = [];
  const client = {
    storage: {
      from() {
        return {
          async remove(paths: string[]) {
            removedPaths = paths;
            return { error: null };
          },
        };
      },
    },
  };

  const result = await removeListingImages(client, imagePaths);

  assert.deepEqual(removedPaths, imagePaths);
  assert.deepEqual(result, { failure: null, pendingPaths: [] });
});

test('does not call Storage when the listing has no images', async () => {
  let called = false;
  const client = {
    storage: {
      from() {
        called = true;
        throw new Error('Storage should not be called');
      },
    },
  };

  const result = await removeListingImages(client, []);

  assert.equal(called, false);
  assert.deepEqual(result, { failure: null, pendingPaths: [] });
});

test('returns the exact failed paths when Storage reports an error', async () => {
  const storageError = Object.assign(new Error('Storage API failed'), {
    status: 403,
    statusCode: '403',
    code: 'AccessDenied',
  });
  const client = {
    storage: {
      from() {
        return {
          async remove() {
            return { error: storageError };
          },
        };
      },
    },
  };

  const result = await removeListingImages(client, imagePaths);

  assert.deepEqual(result.failure, {
    reason: 'storage_api_rejected',
    error: {
      name: 'Error',
      message: 'Storage API failed',
      status: 403,
      statusCode: '403',
      code: 'AccessDenied',
    },
  });
  assert.deepEqual(result.pendingPaths, imagePaths);
});

test('sends the stored bucket-relative paths unchanged to Storage remove', async () => {
  let requestedPaths: string[] = [];
  const client = {
    storage: {
      from(bucket: string) {
        assert.equal(bucket, 'listings');
        return {
          async remove(paths: string[]) {
            requestedPaths = paths;
            return { error: null };
          },
        };
      },
    },
  };
  const storedPaths = ['listings/bcf92ebb-8031-4b74-b3e2-fd83e98ffd50/63ba8dcf-67e5-4b58-aaa2-cb438eea4db.jpg'];

  await removeListingImages(client, storedPaths);

  assert.deepEqual(requestedPaths, storedPaths);
});

test('returns the exact failed paths when the Storage call throws', async () => {
  const storageError = new Error('Storage request failed');
  const client = {
    storage: {
      from() {
        return {
          async remove() {
            throw storageError;
          },
        };
      },
    },
  };

  const result = await removeListingImages(client, imagePaths);

  assert.deepEqual(result.failure, {
    reason: 'storage_client_error',
    error: {
      name: 'Error',
      message: 'Storage request failed',
    },
  });
  assert.deepEqual(result.pendingPaths, imagePaths);
});

test('redacts bearer tokens and JWTs from logged Storage error details', () => {
  const details = getStorageRemovalErrorDetails(
    new Error('Bearer secret-token response eyJhbGci.eyJzdWI.abc'),
  );

  assert.equal(details.message, 'Bearer [REDACTED] response [REDACTED]');
});
