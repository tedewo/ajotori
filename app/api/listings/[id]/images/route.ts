import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import {
  createServerClient,
  createStorageAdminClient,
} from '@/lib/supabase/server';
import {
  completeListingStorageCleanup,
  enqueueListingStorageCleanup,
  listListingStorageCleanupTasks,
} from '@/lib/supabase/listing-storage-cleanup';
import {
  getStorageRemovalErrorDetails,
  removeListingImages,
  type StorageRemovalFailure,
} from '@/lib/supabase/remove-listing-images';

const BUCKET = 'listings';
const MAX_IMAGES_PER_LISTING = 20;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type RouteContext = { params: Promise<{ id: string }> };

function detectImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return null;
}

async function getOwnedDraft(supabase: Awaited<ReturnType<typeof createServerClient>>, listingId: string, userId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('id, status, seller_id')
    .eq('id', listingId)
    .eq('seller_id', userId)
    .eq('status', 'draft')
    .maybeSingle();

  return error || !data ? null : data;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  if (!await getOwnedDraft(supabase, listingId, userData.user.id)) {
    return NextResponse.json({ error: 'Luonnosta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });
  }

  const { data: pendingTasks, error: pendingTaskError } =
    await listListingStorageCleanupTasks(supabase, listingId);
  if (pendingTaskError) {
    console.error('Failed to load pending listing image cleanup tasks before upload', {
      listingId,
      userId: userData.user.id,
      error: pendingTaskError,
    });
    return NextResponse.json({ error: 'Ilmoituksen kuvien siivoustietoja ei voitu tarkistaa.' }, { status: 500 });
  }
  if (pendingTasks?.some((task) => task.reason === 'listing_delete')) {
    return NextResponse.json(
      { error: 'Ilmoituksen poisto on kesken. Kuvia ei voi lisätä.' },
      { status: 409 },
    );
  }
  for (const task of pendingTasks ?? []) {
    let cleanupResult: Awaited<ReturnType<typeof removeListingImages>>;
    try {
      cleanupResult = await removeListingImages(
        createStorageAdminClient(),
        [task.storage_path],
      );
    } catch (error) {
      cleanupResult = {
        failure: {
          reason: 'storage_client_error',
          error: getStorageRemovalErrorDetails(error),
        },
        pendingPaths: [task.storage_path],
      };
    }
    if (cleanupResult.failure) {
      console.error('Pending listing image cleanup retry failed before upload', {
        listingId,
        storagePath: task.storage_path,
        reason: cleanupResult.failure.reason,
        error: cleanupResult.failure.error,
      });
      return NextResponse.json(
        { error: 'Aiempi kuvien siivous on vielä kesken.', cleanup: 'pending' },
        { status: 503 },
      );
    }
    if (task.image_id) {
      const { error: metadataError } = await supabase
        .from('listing_images')
        .delete()
        .eq('id', task.image_id)
        .eq('listing_id', listingId);
      if (metadataError) {
        console.error('Pending image metadata cleanup retry failed before upload', {
          listingId,
          imageId: task.image_id,
          error: metadataError,
        });
        return NextResponse.json(
          { error: 'Aiemman kuvan tietoja ei voitu siivota.', cleanup: 'pending' },
          { status: 500 },
        );
      }
    }
    const { error: completionError } = await completeListingStorageCleanup(
      createStorageAdminClient(),
      listingId,
      [task.storage_path],
    );
    if (completionError) {
      console.error('Pending listing image cleanup acknowledgement failed before upload', {
        listingId,
        storagePath: task.storage_path,
        error: completionError,
      });
      return NextResponse.json(
        { error: 'Aiemman kuvien siivouksen kuittaus epäonnistui.', cleanup: 'pending' },
        { status: 503 },
      );
    }
  }

  const formData = await request.formData();
  const files = formData.getAll('files').filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'Valitse vähintään yksi kuvatiedosto.' }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  if (countError) {
    console.error('Failed to count listing images', {
      listingId,
      userId: userData.user.id,
      error: countError,
    });
    return NextResponse.json({ error: 'Kuvien määrää ei voitu tarkistaa.' }, { status: 500 });
  }

  if ((count ?? 0) + files.length > MAX_IMAGES_PER_LISTING) {
    return NextResponse.json({ error: `Ilmoitukselle voi lisätä enintään ${MAX_IMAGES_PER_LISTING} kuvaa.` }, { status: 400 });
  }

  const uploadedPaths: string[] = [];
  const insertedImageIds: string[] = [];
  const insertedImages: Array<{ id: string; path: string }> = [];
  const uploadedImages: Array<{ id: string; url: string }> = [];

  try {
    for (const [index, file] of files.entries()) {
      if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Kuvan koko on virheellinen. Maksimi on 10 Mt / kuva.');
      }

      if (file.type && !ALLOWED_TYPES.has(file.type)) {
        throw new Error('Väärä tiedostotyyppi. Sallitut: JPG, PNG ja WEBP.');
      }

      const imageType = detectImageType(new Uint8Array(await file.arrayBuffer()));
      if (!imageType || !ALLOWED_TYPES.has(imageType.mimeType)) {
        throw new Error('Tiedosto ei ole tuettu kuvatiedosto.');
      }

      const storagePath = `listings/${listingId}/${randomUUID()}.${imageType.extension}`;
      uploadedPaths.push(storagePath);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        contentType: imageType.mimeType,
        upsert: false,
      });

      if (uploadError) {
        console.error('Failed to upload listing image to Storage', {
          listingId,
          userId: userData.user.id,
          bucket: BUCKET,
          storagePath,
          error: uploadError,
        });
        throw new Error('Kuvan tallennus Storageen epäonnistui.');
      }

      const { data: imageRow, error: imageError } = await supabase
        .from('listing_images')
        .insert([{
          listing_id: listingId,
          storage_path: storagePath,
          sort_order: (count ?? 0) + index,
        }] as any)
        .select('id')
        .single();

      if (imageError || !imageRow) throw new Error('Kuvan tietojen tallennus epäonnistui.');
      const insertedImage = imageRow as { id: string };
      insertedImageIds.push(insertedImage.id);
      insertedImages.push({ id: insertedImage.id, path: storagePath });

      const { data: signedUrl, error: signedUrlError } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
      if (signedUrlError || !signedUrl) throw new Error('Kuvan esikatselulinkin luominen epäonnistui.');
      uploadedImages.push({ id: insertedImage.id, url: signedUrl.signedUrl });
    }

    return NextResponse.json({ ok: true, uploadedCount: files.length, uploadedImages });
  } catch (error) {
    let metadataCleanupFailed = false;
    let cleanupPending = false;
    let queuePersistenceFailed = false;
    if (insertedImageIds.length > 0) {
      const { error: metadataError } = await supabase
        .from('listing_images')
        .delete()
        .in('id', insertedImageIds);
      if (metadataError) {
        metadataCleanupFailed = true;
        console.error('Failed to roll back listing image metadata after upload failure', {
          listingId,
          userId: userData.user.id,
          imageIds: insertedImageIds,
          error: metadataError,
        });
      }
    }

    const metadataPaths = new Set(
      metadataCleanupFailed ? insertedImages.map((image) => image.path) : [],
    );
    const pathsToRemove = uploadedPaths.filter((path) => !metadataPaths.has(path));
    if (pathsToRemove.length > 0) {
      let removalFailure: StorageRemovalFailure | null = null;
      let pendingPaths: string[] = [];
      try {
        const result = await removeListingImages(
          createStorageAdminClient(),
          pathsToRemove,
        );
        removalFailure = result.failure;
        pendingPaths = result.pendingPaths;
      } catch (cleanupError) {
        removalFailure = {
          reason: 'storage_client_error',
          error: getStorageRemovalErrorDetails(cleanupError),
        };
        pendingPaths = pathsToRemove;
      }
      cleanupPending = pendingPaths.length > 0;

      for (const path of pendingPaths) {
        const { error: queueError } = await enqueueListingStorageCleanup(supabase, {
          listingId,
          imageId: insertedImages.find((image) => image.path === path)?.id ?? null,
          storagePath: path,
          reason: 'upload_compensation',
        });
        if (queueError) {
          cleanupPending = true;
          queuePersistenceFailed = true;
          console.error('Failed to persist upload compensation cleanup task', {
            listingId,
            userId: userData.user.id,
            storagePath: path,
            error: queueError,
          });
          metadataCleanupFailed = true;
        }
      }

      const removedPaths = pathsToRemove.filter((path) => !pendingPaths.includes(path));
      if (removedPaths.length > 0) {
        try {
          const admin = createStorageAdminClient();
          const { error: completionError } = await completeListingStorageCleanup(
            admin,
            listingId,
            removedPaths,
          );
          if (completionError) {
            console.error('Failed to acknowledge successful upload compensation cleanup', {
              listingId,
              error: completionError,
            });
            metadataCleanupFailed = true;
          }
        } catch (completionError) {
          console.error('Failed to acknowledge successful upload compensation cleanup', {
            listingId,
            error: getStorageRemovalErrorDetails(completionError),
          });
          metadataCleanupFailed = true;
        }
      }
      if (removalFailure) {
        console.error('Upload compensation Storage cleanup is pending', {
          listingId,
          userId: userData.user.id,
          storagePaths: pendingPaths,
          reason: removalFailure.reason,
          error: removalFailure.error,
        });
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Kuvien tallennus epäonnistui.',
        ...(queuePersistenceFailed
          ? {
              cleanup: 'unpersisted',
              warning: 'Kuvien siivoustehtävän tallennus epäonnistui. Ylläpito tarvitsee lokitiedot uudelleenyritystä varten.',
            }
          : cleanupPending
            ? {
                cleanup: 'pending',
                warning: 'Osa kuvien siivouksesta jäi jonoon turvallista uudelleenyritystä varten.',
              }
            : metadataCleanupFailed
              ? {
                  cleanup: 'metadata_retained',
                  warning: 'Kuvan tiedot ja Storage-objekti säilytettiin, jotta ne eivät eriydy.',
                }
              : {}),
      },
      { status: cleanupPending ? 503 : metadataCleanupFailed ? 500 : 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  if (!await getOwnedDraft(supabase, listingId, userData.user.id)) {
    return NextResponse.json({ error: 'Luonnosta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as { imageId?: string } | null;
  if (!payload?.imageId) return NextResponse.json({ error: 'Kuvan tunniste puuttuu.' }, { status: 400 });

  const { data: queuedTasks, error: queueLookupError } =
    await listListingStorageCleanupTasks(supabase, listingId, payload.imageId);
  if (queueLookupError) {
    console.error('Failed to load queued image cleanup task', {
      listingId,
      imageId: payload.imageId,
      error: queueLookupError,
    });
    return NextResponse.json({ error: 'Kuvan siivoustietoja ei voitu tarkistaa.' }, { status: 500 });
  }

  let imageId = payload.imageId;
  let storagePath = queuedTasks?.[0]?.storage_path;
  if (!storagePath) {
    const { data: image, error: imageError } = await supabase
      .from('listing_images')
      .select('id, storage_path')
      .eq('id', payload.imageId)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (imageError || !image) return NextResponse.json({ error: 'Kuvaa ei löytynyt.' }, { status: 404 });
    imageId = image.id;
    storagePath = image.storage_path;
    const { error: queueError } = await enqueueListingStorageCleanup(supabase, {
      listingId,
      imageId,
      storagePath,
      reason: 'image_delete',
    });
    if (queueError) {
      console.error('Failed to persist single-image cleanup task', {
        listingId,
        imageId,
        error: queueError,
      });
      return NextResponse.json({ error: 'Kuvan siivoustehtävää ei voitu tallentaa.' }, { status: 500 });
    }
  }

  const { data: imageTasks, error: imageTasksError } =
    await listListingStorageCleanupTasks(supabase, listingId, imageId);
  if (imageTasksError) {
    console.error('Failed to reload single-image cleanup task', {
      listingId,
      imageId,
      error: imageTasksError,
    });
    return NextResponse.json({ error: 'Kuvan siivoustietoja ei voitu tarkistaa.' }, { status: 500 });
  }
  const taskPaths = (imageTasks ?? []).map((task) => task.storage_path);

  let removalResult: Awaited<ReturnType<typeof removeListingImages>>;
  try {
    const storageAdmin = createStorageAdminClient();
    removalResult = await removeListingImages(storageAdmin, taskPaths);
  } catch (error) {
    removalResult = {
      failure: {
        reason: 'storage_client_error',
        error: getStorageRemovalErrorDetails(error),
      },
      pendingPaths: taskPaths,
    };
  }
  if (removalResult.failure) {
    console.error('Single listing image Storage cleanup remains queued', {
      listingId,
      imageId,
      storagePaths: removalResult.pendingPaths,
      reason: removalResult.failure.reason,
      error: removalResult.failure.error,
    });
    return NextResponse.json(
      { error: 'Kuvan poistaminen Storage-tallennuksesta epäonnistui.', cleanup: 'pending' },
      { status: 503 },
    );
  }

  const { error: deleteError } = await supabase
    .from('listing_images')
    .delete()
    .eq('id', imageId)
    .eq('listing_id', listingId);
  if (deleteError) {
    console.error('Single listing image metadata deletion failed; cleanup remains queued', {
      listingId,
      imageId,
      storagePath,
      error: deleteError,
    });
    return NextResponse.json(
      { error: 'Kuvan tiedot jäivät tietokantaan. Poistopyyntö voidaan uusia turvallisesti.', cleanup: 'pending' },
      { status: 500 },
    );
  }

  try {
    const storageAdmin = createStorageAdminClient();
    const { error: completionError } = await completeListingStorageCleanup(
      storageAdmin,
      listingId,
      taskPaths,
    );
    if (completionError) throw completionError;
  } catch (error) {
    console.error('Single listing image cleanup completed but queue acknowledgement failed', {
      listingId,
      imageId,
      error: getStorageRemovalErrorDetails(error),
    });
    return NextResponse.json(
      { ok: true, cleanup: 'pending_acknowledgement' },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true });
}