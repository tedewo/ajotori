import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { createServerClient } from '@/lib/supabase/server';

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
      uploadedPaths.push(storagePath);

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

      const { data: signedUrl, error: signedUrlError } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
      if (signedUrlError || !signedUrl) throw new Error('Kuvan esikatselulinkin luominen epäonnistui.');
      uploadedImages.push({ id: insertedImage.id, url: signedUrl.signedUrl });
    }

    return NextResponse.json({ ok: true, uploadedCount: files.length, uploadedImages });
  } catch (error) {
    if (insertedImageIds.length > 0) {
      await supabase.from('listing_images').delete().in('id', insertedImageIds);
    }
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(uploadedPaths);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kuvien tallennus epäonnistui.' },
      { status: 400 },
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

  const { data: image, error: imageError } = await supabase
    .from('listing_images')
    .select('id, storage_path')
    .eq('id', payload.imageId)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (imageError || !image) return NextResponse.json({ error: 'Kuvaa ei löytynyt.' }, { status: 404 });

  const imageToDelete = image as { id: string; storage_path: string };
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([imageToDelete.storage_path]);
  if (storageError) return NextResponse.json({ error: 'Kuvan poistaminen Storage-tallennuksesta epäonnistui.' }, { status: 500 });

  const { error: deleteError } = await supabase.from('listing_images').delete().eq('id', imageToDelete.id).eq('listing_id', listingId);
  if (deleteError) return NextResponse.json({ error: 'Kuvan tietojen poistaminen epäonnistui.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}