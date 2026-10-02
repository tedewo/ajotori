import Link from 'next/link';
import ListingBrowser from '@/app/components/listings/ListingBrowser';
import { DEFAULT_LISTING_SEARCH_FILTERS, isListingSortKey, type ListingSearchFilters } from '@/lib/listings-search';
import { getPublishedListings } from '@/lib/listings-server';

type ListingIndexContentProps = {
  initialCategory?: string;
  initialSubcategory?: string;
  searchParams?: Promise<Partial<Record<keyof ListingSearchFilters | 'sort', string | string[]>>>;
};

export default async function ListingIndexContent({
  initialCategory = '',
  initialSubcategory = '',
  searchParams,
}: ListingIndexContentProps) {
  const routeSearchParams = searchParams ? await searchParams : {};
  const getParam = (key: keyof ListingSearchFilters | 'sort') => {
    const value = routeSearchParams[key];
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  };
  const initialFilters: ListingSearchFilters = {
    ...DEFAULT_LISTING_SEARCH_FILTERS,
    ...Object.fromEntries(
      Object.keys(DEFAULT_LISTING_SEARCH_FILTERS).map((key) => [key, getParam(key as keyof ListingSearchFilters)]),
    ),
    category: getParam('category') || initialCategory,
    subcategory: getParam('subcategory') || initialSubcategory,
  };
  const category = initialFilters.category;
  const subcategory = initialFilters.subcategory;
  const sortValue = getParam('sort');
  const initialSortKey = isListingSortKey(sortValue) ? sortValue : 'newest';
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
        <ListingBrowser listings={listings} initialFilters={initialFilters} initialSortKey={initialSortKey} />
      </div>
    </main>
  );
}