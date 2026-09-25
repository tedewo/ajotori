import Link from 'next/link';

import { createServerClient, getCurrentUser } from '@/lib/supabase/server';
import { mapSupabaseListingToAjotoriListing, type SupabaseListingRow } from '@/lib/supabase/mappers';
import { formatPrice } from '@/lib/listings';
import PublishListingButton from '@/app/components/listings/PublishListingButton';

type AccountProfile = {
  display_name?: string | null;
  role?: string | null;
  seller_type?: string | null;
};

export default async function AccountPage() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!hasSupabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Oma tili</h1>
          <p className="mt-4 text-sm text-slate-600">
            Supabase-yhteys ei ole vielä määritetty. Aseta NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env-tiedostoon.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await getCurrentUser();

  if (error || !data.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Et ole kirjautunut</h1>
          <p className="mt-4 text-sm text-slate-600">Kirjaudu sisään nähdäksesi tilisi tiedot.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/auth/sign-in" className="rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white">
              Kirjaudu sisään
            </Link>
            <Link href="/auth/sign-up" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Luo tili
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createServerClient();
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const profile = profileData as AccountProfile | null;
  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, category_slug, subcategory_slug, title, brand, model, year, price, description, region, municipality, seller_type, external_listing_url, status, technical_data, equipment, created_at, updated_at')
    .eq('seller_id', data.user.id)
    .order('created_at', { ascending: false });

  const ownListings = (listingData as SupabaseListingRow[] | null ?? []).map((row) => ({
    ...mapSupabaseListingToAjotoriListing(row),
    status: row.status ?? 'draft',
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Oma tili</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{profile?.display_name ?? data.user.email ?? 'Käyttäjä'}</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-[#0ea5e9] hover:text-[#0ca4dd]">Etusivulle</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sähköposti</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{data.user.email}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tili</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{profile?.role ?? 'user'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Myyjätyyppi</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{profile?.seller_type ?? 'private'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sähköpostivahvistus</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{data.user.email_confirmed_at ? 'Vahvistettu' : 'Odottaa vahvistusta'}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Omat ilmoitukset</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Luonnokset ja ilmoitukset</h2>
          </div>
          <Link href="/ilmoitus/uusi" className="rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0ca4dd]">
            Uusi ilmoitus
          </Link>
        </div>

        {listingError ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Ilmoitusten lataaminen epäonnistui.
          </p>
        ) : ownListings.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">Sinulla ei ole vielä tallennettuja ilmoituksia.</p>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {ownListings.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{listing.title || [listing.brand, listing.model].filter(Boolean).join(' ') || 'Nimetön ilmoitus'}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[listing.category, listing.subcategory].filter(Boolean).join(' / ')}
                    {listing.price ? ` · ${formatPrice(listing.price)}` : ''}
                  </p>
                </div>
                {listing.status === 'draft' ? <PublishListingButton listingId={listing.id} /> : null}
                {listing.status === 'published' ? (
                  <Link href={`/ilmoitukset/${listing.id}`} className="text-sm font-semibold text-[#0ea5e9] hover:text-[#0ca4dd]">
                    Avaa julkaistu ilmoitus
                  </Link>
                ) : null}
                {listing.status === 'sold' ? <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Myyty</span> : null}
                {listing.status === 'removed' ? <span className="w-fit rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Poistettu</span> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
