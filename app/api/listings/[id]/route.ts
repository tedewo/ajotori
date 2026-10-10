import { NextResponse } from 'next/server';

import { getFormConfigBySlug } from '@/lib/formConfig';
import { parseListingContent } from '@/lib/listing-content';
import { buildTechnicalData } from '@/lib/listing-form-data';
import type { Database } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };
type ListingRow = Database['public']['Tables']['listings']['Row'];

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normaliseText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function getValue(payload: Record<string, unknown>, key: string, fallback: unknown) {
  return hasOwn(payload, key) ? payload[key] : fallback;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('listings')
    .select('id, category_slug, subcategory_slug, title, brand, model, year, price, description, homepage_description, region, municipality, external_listing_url, status, technical_data, equipment')
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .maybeSingle();

  if (error) {
    console.error('Supabase listing edit lookup failed:', error);
    return NextResponse.json({ error: 'Ilmoituksen lataaminen epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Ilmoitusta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });

  const { data: imageRows, error: imageError } = await supabase
    .from('listing_images')
    .select('id, storage_path, sort_order')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true });

  if (imageError) {
    console.error('Supabase listing edit images lookup failed:', imageError);
    return NextResponse.json({ error: 'Ilmoituksen kuvien lataaminen epäonnistui.' }, { status: 500 });
  }

  const imageResults = await Promise.all((imageRows ?? []).map(async (image) => {
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('listings')
      .createSignedUrl(image.storage_path, 3600);
    if (signedUrlError || !signedUrl) {
      console.error('Failed to create listing edit image URL:', {
        listingId,
        imageId: image.id,
        error: signedUrlError,
      });
      return null;
    }
    return { id: image.id, url: signedUrl.signedUrl };
  }));

  if (imageResults.some((image) => image === null)) {
    return NextResponse.json({ error: 'Ilmoituksen kuvien lataaminen epäonnistui.' }, { status: 500 });
  }

  return NextResponse.json({ listing: data, images: imageResults });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö.' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Ilmoituksen tiedot puuttuvat.' }, { status: 400 });
  }

  if (['seller_id', 'seller_type', 'status', 'role'].some((key) => hasOwn(payload, key))) {
    return NextResponse.json({ error: 'Ilmoituksen omistajaa, tyyppiä tai tilaa ei voi muuttaa.' }, { status: 400 });
  }

  const { data: currentData, error: lookupError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .maybeSingle();

  if (lookupError) {
    console.error('Supabase listing edit lookup failed:', lookupError);
    return NextResponse.json({ error: 'Ilmoituksen tietojen tarkistus epäonnistui.' }, { status: 500 });
  }
  if (!currentData) return NextResponse.json({ error: 'Ilmoitusta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });

  const current = currentData as ListingRow;
  const subcategorySlug = current.subcategory_slug ?? '';
  const formConfig = getFormConfigBySlug(subcategorySlug);
  if (!formConfig) {
    return NextResponse.json({ error: 'Ilmoituksen lomakekonfiguraatiota ei löytynyt.' }, { status: 409 });
  }

  const technicalFields = formConfig.sections.flatMap((section) => section.fields);
  for (const field of technicalFields) {
    if (field.type !== 'number' || !hasOwn(payload, field.key)) continue;
    const value = payload[field.key];
    if (value === '' || value === null || value === undefined) continue;
    if ((typeof value !== 'number' && typeof value !== 'string') || !Number.isFinite(Number(value))) {
      return NextResponse.json({ error: `${field.label} ei ole kelvollinen numero.` }, { status: 400 });
    }
    const numericValue = Number(value);
    if (
      (field.key === 'maxPassengers' && numericValue <= 0) ||
      (['curbWeight', 'totalWeight'].includes(field.key) && numericValue <= 0) ||
      (field.key === 'maxTrailerWeight' && numericValue < 0)
    ) {
      return NextResponse.json({ error: `${field.label} ei ole kelvollinen arvo.` }, { status: 400 });
    }
  }

  const brand = normaliseText(getValue(payload, 'brand', current.brand));
  const model = normaliseText(getValue(payload, 'model', current.model));
  const title = normaliseText(getValue(payload, 'title', current.title)) ?? [brand, model].filter(Boolean).join(' ');
  const rawPrice = getValue(payload, 'price', current.price);
  const price = typeof rawPrice === 'number' || typeof rawPrice === 'string' ? Number(rawPrice) : Number.NaN;

  if (!title || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Otsikko ja nollaa suurempi hinta ovat pakollisia.' }, { status: 400 });
  }

  const rawYear = getValue(payload, 'year', current.year);
  const year = rawYear === null || rawYear === '' || rawYear === undefined
    ? null
    : typeof rawYear === 'number' || typeof rawYear === 'string'
      ? Number(rawYear)
      : Number.NaN;
  if (year !== null && !Number.isFinite(year)) {
    return NextResponse.json({ error: 'Vuosimalli ei ole kelvollinen numero.' }, { status: 400 });
  }

  const parsedContent = parseListingContent({
    description: getValue(payload, 'description', current.description),
    homepage_description: getValue(payload, 'homepage_description', current.homepage_description),
    external_listing_url: getValue(payload, 'external_listing_url', current.external_listing_url),
  });
  if ('error' in parsedContent) {
    return NextResponse.json({ error: parsedContent.error }, { status: 400 });
  }

  const region = normaliseText(getValue(payload, 'region', getValue(payload, 'province', current.region)));
  const municipality = normaliseText(getValue(payload, 'municipality', current.municipality));
  const rawEquipment = getValue(payload, 'features', getValue(payload, 'equipment', current.equipment));
  if (!Array.isArray(rawEquipment) || rawEquipment.some((item) => typeof item !== 'string')) {
    return NextResponse.json({ error: 'Varustetiedot ovat virheellisessä muodossa.' }, { status: 400 });
  }

  const allowedTechnicalKeys = new Set([
    ...technicalFields.map((field) => field.key),
    'powerUnit',
    'transmissionOther',
    'fuelOther',
    'hybridType',
    'plugInHybrid',
    'powerEquivalent',
  ]);
  const technicalPayload: Record<string, unknown> = { ...(current.technical_data ?? {}) };
  for (const key of allowedTechnicalKeys) {
    if (hasOwn(payload, key)) technicalPayload[key] = payload[key];
  }
  const technicalData = buildTechnicalData(technicalPayload, {
    existing: current.technical_data ?? {},
    allowedKeys: allowedTechnicalKeys,
  });

  const { data, error } = await supabase
    .from('listings')
    .update({
      title,
      brand,
      model,
      year: year === null ? null : Math.trunc(year),
      price,
      description: parsedContent.data.description,
      homepage_description: parsedContent.data.homepageDescription,
      external_listing_url: parsedContent.data.externalListingUrl,
      region,
      municipality,
      technical_data: technicalData,
      equipment: rawEquipment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .eq('status', current.status)
    .select('id, status')
    .maybeSingle();

  if (error) {
    console.error('Supabase listing update failed:', error);
    return NextResponse.json({ error: 'Ilmoituksen tallennus epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Ilmoituksen tila muuttui tai ilmoitus ei ole enää muokattavissa.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, listingId: data.id, status: data.status });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .maybeSingle();

  if (listingError) {
    console.error('Supabase listing delete ownership lookup failed:', listingError);
    return NextResponse.json({ error: 'Ilmoituksen omistajuuden tarkistus epäonnistui.' }, { status: 500 });
  }
  if (!listing) return NextResponse.json({ error: 'Ilmoitusta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });

  const { data: imageRows, error: imageError } = await supabase
    .from('listing_images')
    .select('id, storage_path')
    .eq('listing_id', listingId);

  if (imageError) {
    console.error('Supabase listing delete image lookup failed:', imageError);
    return NextResponse.json({ error: 'Ilmoituksen kuvien tarkistus epäonnistui. Ilmoitusta ei poistettu.' }, { status: 500 });
  }

  const imageRecords = (imageRows ?? []) as Array<{ id: string; storage_path: string }>;
  const storagePrefix = `listings/${listingId}/`;
  if (imageRecords.some(({ storage_path }) =>
    !storage_path.startsWith(storagePrefix) ||
    storage_path.slice(storagePrefix.length).split('/').some((part) => !part || part === '.' || part === '..')
  )) {
    console.error('Listing image path is outside its expected storage folder:', { listingId });
    return NextResponse.json({ error: 'Ilmoituksen kuvapolkujen tarkistus epäonnistui. Ilmoitusta ei poistettu.' }, { status: 500 });
  }

  const { data: deletedListing, error: deleteError } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .select('id')
    .maybeSingle();

  if (deleteError || !deletedListing) {
    console.error('Supabase listing delete failed:', { listingId, error: deleteError });
    return NextResponse.json(
      { error: 'Ilmoituksen poistaminen epäonnistui. Kuvat säilytettiin.' },
      { status: 500 },
    );
  }

  if (imageRecords.length > 0) {
    const storagePaths = imageRecords.map(({ storage_path }) => storage_path);
    const { error: storageError } = await supabase.storage.from('listings').remove(storagePaths);

    if (storageError) {
      console.error('Supabase listing image cleanup is pending:', {
        listingId,
        userId: userData.user.id,
        storagePaths,
        error: storageError,
      });
      return NextResponse.json({
        ok: true,
        listingId,
        warning: 'Joidenkin kuvien siivous jäi kesken; ylläpito siivoaa ne myöhemmin.',
      });
    }
  }

  return NextResponse.json({ ok: true, listingId });
}
