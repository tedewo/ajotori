import Link from 'next/link';
import ListingBrowser from '@/app/components/listings/ListingBrowser';
import { getPublishedListings } from '@/lib/listings-server';

export default async function ListingIndexPage({
  initialCategory = '',
  initialSubcategory = '',
  searchParams,
}: {
  initialCategory?: string;
  initialSubcategory?: string;
  searchParams?: Promise<{ category?: string; subcategory?: string }>;
}) {
  const routeSearchParams = searchParams ? await searchParams : {};
  const category = initialCategory || routeSearchParams.category || '';
  const subcategory = initialSubcategory || routeSearchParams.subcategory || '';
  const listings = await getPublishedListings({
    categorySlug: category || undefined,
    subcategorySlug: subcategory || undefined,
  });

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ilmoitukset</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Selaa ilmoituksia</h1>
          </div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-[#0ea5e9]">← Takaisin etusivulle</Link>
        </div>
        <ListingBrowser listings={listings} initialCategory={category} initialSubcategory={subcategory} />
      </div>
    </main>
  );
}
