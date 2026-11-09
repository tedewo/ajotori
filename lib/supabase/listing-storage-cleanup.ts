import type { createServerClient, createStorageAdminClient } from './server';

export type ListingStorageCleanupReason =
  | 'listing_delete'
  | 'image_delete'
  | 'upload_compensation';

type UserSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
type AdminSupabaseClient = ReturnType<typeof createStorageAdminClient>;

export async function enqueueListingStorageCleanup(
  client: UserSupabaseClient,
  input: {
    listingId: string;
    imageId: string | null;
    storagePath: string;
    reason: ListingStorageCleanupReason;
  },
) {
  return client.rpc('enqueue_listing_storage_cleanup', {
    p_listing_id: input.listingId,
    p_image_id: input.imageId,
    p_storage_path: input.storagePath,
    p_reason: input.reason,
  });
}

export async function enqueueListingDeletionCleanup(
  client: UserSupabaseClient,
  listingId: string,
) {
  return client.rpc('enqueue_listing_deletion_cleanup', {
    p_listing_id: listingId,
  });
}

export async function listListingStorageCleanupTasks(
  client: UserSupabaseClient,
  listingId: string,
  imageId: string | null = null,
) {
  return client.rpc('list_listing_storage_cleanup_tasks', {
    p_listing_id: listingId,
    p_image_id: imageId,
  });
}

export async function completeListingStorageCleanup(
  client: AdminSupabaseClient,
  listingId: string,
  storagePaths: string[],
) {
  return client.rpc('complete_listing_storage_cleanup', {
    p_listing_id: listingId,
    p_storage_paths: storagePaths,
  });
}
