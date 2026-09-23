import { NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';

const DEFAULT_EXCLUDED_KEYS = new Set([
  'category',
  'subcategory',
  'category_slug',
  'subcategory_slug',
  'title',
  'brand',
  'model',
  'year',
  'price',
  'description',
  'region',
  'municipality',
  'seller_type',
  'external_listing_url',
  'status',
  'images',
  'image',
  'province',
  'phone',
  'email',
  'details',
  'searchTags',
  'powerEquivalent',
  'powerUnit',
  'transmissionOther',
  'fuelOther',
  'hybridType',
  'plugInHybrid',
  'location',
  'contact',
]);

function normaliseText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function buildTechnicalData(payload: Record<string, unknown>) {
  const technicalData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (DEFAULT_EXCLUDED_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;

    technicalData[key] = value;
  }

  return technicalData;
}

export async function POST(request: Request) {
  const supabaseConfigReady =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== 'placeholder-key';

  if (!supabaseConfigReady) {
    return NextResponse.json(
      { error: 'Supabase-näkymä ei ole vielä konfiguroitu.' },
      { status: 503 },
    );
  }

  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    const authDiagnosticError = authError as typeof authError & {
      details?: string;
      hint?: string;
    };
    console.error('Supabase auth.getUser failed in listing API:', {
      code: authDiagnosticError.code,
      message: authDiagnosticError.message,
      details: authDiagnosticError.details,
      hint: authDiagnosticError.hint,
    });
  } else {
    console.info('Supabase auth.getUser result in listing API:', {
      hasUser: Boolean(userData.user),
      userId: userData.user?.id ?? null,
    });
  }

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Virheellinen pyyntö.' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Ilmoituksen tiedot puuttuvat.' }, { status: 400 });
  }

  const brandText = normaliseText(payload.brand) ?? '';
  const modelText = normaliseText(payload.model) ?? '';
  const title = normaliseText(payload.title) ?? [brandText, modelText].filter(Boolean).join(' ');
  const categorySlug = normaliseText(payload.category_slug) ?? normaliseText(payload.category);
  const subcategorySlug = normaliseText(payload.subcategory_slug) ?? normaliseText(payload.subcategory);
  const priceRaw = Number(payload.price);
  const yearRaw = Number(payload.year);

  if (!categorySlug || !subcategorySlug || !title) {
    return NextResponse.json({ error: 'Kategoria ja perustiedot ovat pakollisia.' }, { status: 400 });
  }

  if (!Number.isFinite(priceRaw) || priceRaw <= 0) {
    return NextResponse.json({ error: 'Hinta on pakollinen ja sen tulee olla suurempi kuin nolla.' }, { status: 400 });
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('seller_type')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to fetch profile for listing insert:', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      userId: userData.user.id,
    });
    return NextResponse.json({ error: 'Profiilin tarkistus epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }

  if (!profileData) {
    console.error('Profiles query returned no visible row in listing API:', {
      userId: userData.user.id,
      query: 'profiles.select(seller_type).eq(id, auth.getUser().data.user.id).maybeSingle()',
    });
    return NextResponse.json({ error: 'Käyttäjäprofiili puuttuu. Ota yhteyttä ylläpitoon.' }, { status: 409 });
  }

  const profileRow = profileData as { seller_type?: string | null } | null;
  console.info('Profiles query succeeded in listing API:', {
    userId: userData.user.id,
    hasProfile: true,
    sellerType: profileRow?.seller_type ?? null,
  });

  const sellerType: 'private' | 'company' = profileRow?.seller_type === 'company' ? 'company' : 'private';
  const equipment = Array.isArray(payload.equipment) ? payload.equipment.filter((item) => typeof item === 'string') : [];
  const description = normaliseText(payload.description) ?? normaliseText(payload.details) ?? '';
  const region = normaliseText(payload.region) ?? normaliseText(payload.province);
  const municipality = normaliseText(payload.municipality);
  const externalListingUrl = normaliseText(payload.external_listing_url) ?? null;

  const insertPayload: Database['public']['Tables']['listings']['Insert'] = {
    seller_id: userData.user.id,
    category_slug: categorySlug,
    subcategory_slug: subcategorySlug,
    title,
    brand: normaliseText(payload.brand),
    model: normaliseText(payload.model),
    year: Number.isFinite(yearRaw) ? Math.trunc(yearRaw) : null,
    price: priceRaw,
    description,
    region,
    municipality,
    seller_type: sellerType,
    external_listing_url: externalListingUrl,
    status: 'draft',
    technical_data: buildTechnicalData(payload as Record<string, unknown>),
    equipment,
  };

  const { data, error } = await supabase
    .from('listings')
    .insert([insertPayload] as any)
    .select('id');

  const listingId = Array.isArray(data) ? (data as Array<{ id: string }>)[0]?.id ?? null : null;

  if (error) {
    console.error('Supabase listing insert failed:', error);
    return NextResponse.json(
      { error: 'Ilmoituksen tallennus epäonnistui. Tarkista tiedot ja yritä uudelleen.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, listingId, status: 'draft' });
}
