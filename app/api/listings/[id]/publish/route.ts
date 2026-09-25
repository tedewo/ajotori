import { NextResponse } from 'next/server';

import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';
import { getFormConfigBySlug } from '@/lib/formConfig';
import { createServerClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

type ListingForPublishing = {
  id: string;
  seller_id: string;
  category_slug: string | null;
  subcategory_slug: string | null;
  title: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  description: string | null;
  region: string | null;
  municipality: string | null;
  status: 'draft' | 'published' | 'sold' | 'removed';
  technical_data: Record<string, unknown> | null;
};

function isMissing(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getListingValue(listing: ListingForPublishing, key: string) {
  const directValue = listing[key as keyof ListingForPublishing];
  if (directValue !== undefined) return directValue;
  if (key === 'details') return listing.description;
  return listing.technical_data?.[key];
}

function getValidationErrors(listing: ListingForPublishing) {
  const errors: string[] = [];
  const category = listing.category_slug ? getCategoryBySlug(listing.category_slug) : null;

  if (isMissing(listing.title)) errors.push('otsikko');
  if (isMissing(listing.category_slug) || !category) errors.push('kategoria');

  if (category?.subcategories.length) {
    const subcategory = listing.subcategory_slug ? getSubcategoryBySlug(listing.category_slug ?? '', listing.subcategory_slug) : null;
    if (!subcategory) errors.push('alikategoria');
  }

  if (listing.price === null || listing.price === undefined || !Number.isFinite(Number(listing.price)) || listing.price <= 0) {
    const formConfig = listing.subcategory_slug ? getFormConfigBySlug(listing.subcategory_slug) : null;
    if (formConfig?.sections.some((section) => section.fields.some((field) => field.key === 'price' && field.required))) {
      errors.push('hinta');
    }
  }

  const formConfig = listing.subcategory_slug ? getFormConfigBySlug(listing.subcategory_slug) : null;
  const requiredFields = formConfig?.sections.flatMap((section) => section.fields.filter((field) => field.required)) ?? [];
  for (const field of requiredFields) {
    if (isMissing(getListingValue(listing, field.key))) errors.push(field.label.toLowerCase());
  }

  if (isMissing(listing.region)) errors.push('maakunta');
  if (isMissing(listing.municipality)) errors.push('kaupunki / kunta');

  return [...new Set(errors)];
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään julkaistaksesi ilmoituksen.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('listings')
    .select('id, seller_id, category_slug, subcategory_slug, title, brand, model, year, price, description, region, municipality, status, technical_data')
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Ilmoitusta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });
  }

  const listing = data as ListingForPublishing;
  if (listing.status !== 'draft') {
    return NextResponse.json({ error: 'Vain luonnoksena olevan ilmoituksen voi julkaista.' }, { status: 409 });
  }

  const { count: imageCount, error: imageCountError } = await supabase
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  if (imageCountError) {
    console.error('Failed to count listing images before publishing:', imageCountError);
    return NextResponse.json({ error: 'Kuvien määrää ei voitu tarkistaa. Yritä uudelleen.' }, { status: 500 });
  }

  if (!imageCount) {
    return NextResponse.json({ error: 'Lisää vähintään yksi kuva ennen julkaisemista.' }, { status: 422 });
  }

  const validationErrors = getValidationErrors(listing);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: `Ilmoituksesta puuttuu: ${validationErrors.join(', ')}.` },
      { status: 422 },
    );
  }

  const { data: updatedListing, error: updateError } = await (supabase as any)
    .from('listings')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .eq('status', 'draft')
    .select('id, status')
    .maybeSingle();

  if (updateError || !updatedListing) {
    console.error('Failed to publish listing:', updateError);
    return NextResponse.json({ error: 'Ilmoituksen julkaisu epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listingId: updatedListing.id, status: updatedListing.status });
}