import { NextResponse } from 'next/server';

import { parseListingContent } from '@/lib/listing-content';
import { createServerClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

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

  const parsedContent = parseListingContent(payload);
  if ('error' in parsedContent) {
    return NextResponse.json({ error: parsedContent.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      description: parsedContent.data.description,
      homepage_description: parsedContent.data.homepageDescription,
      external_listing_url: parsedContent.data.externalListingUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('seller_id', userData.user.id)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Supabase listing draft update failed:', error);
    return NextResponse.json({ error: 'Luonnoksen tallennus epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Luonnosta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, listingId: data.id, status: 'draft' });
}
