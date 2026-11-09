import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Kirjaudu sisään jatkaaksesi.' }, { status: 401 });
  }

  const { data: result, error: renewalError } = await supabase.rpc('renew_listing', {
    p_listing_id: listingId,
  });

  if (renewalError) {
    console.error('Failed to renew listing:', renewalError);
    return NextResponse.json({ error: 'Ilmoituksen voimassaolon jatkaminen epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }

  if (result === 'not_found') {
    return NextResponse.json({ error: 'Ilmoitusta ei löytynyt tai se ei kuulu sinulle.' }, { status: 404 });
  }
  if (result === 'not_published') {
    return NextResponse.json({ error: 'Vain julkaistun ilmoituksen voimassaoloa voi jatkaa.' }, { status: 409 });
  }
  if (result === 'renewal_window_closed') {
    return NextResponse.json({ error: 'Ilmoituksen uusinta-aika on päättynyt.' }, { status: 409 });
  }
  if (result === 'cleanup_pending') {
    return NextResponse.json({ error: 'Ilmoituksen voimassaoloa ei voi jatkaa, koska sen poistaminen on jo aloitettu.' }, { status: 409 });
  }
  if (result !== 'renewed') {
    console.error('Listing renewal RPC returned an unexpected result:', result);
    return NextResponse.json({ error: 'Ilmoituksen voimassaolon jatkaminen epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listingId, status: 'published' });
}
