"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Listing } from '@/lib/listings';
import { buildListingSearchUrl, filterListings, isListingSortKey, type ListingSearchFilters, type ListingSortKey } from '@/lib/listings-search';
import ListingFilters from './ListingFilters';
import ListingGrid from './ListingGrid';
import ListingSort from './ListingSort';

function sortListings(listings: Listing[], sortKey: string) {
  const items = [...listings];
  switch (sortKey) {
    case 'price-asc': return items.sort((a, b) => a.price - b.price);
    case 'price-desc': return items.sort((a, b) => b.price - a.price);
    case 'year-desc': return items.sort((a, b) => b.year - a.year);
    case 'year-asc': return items.sort((a, b) => a.year - b.year);
    case 'newest':
    default: return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default function ListingBrowser({
  listings,
  initialFilters,
  initialSortKey,
}: {
  listings: Listing[];
  initialFilters: ListingSearchFilters;
  initialSortKey: ListingSortKey;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [sortKey, setSortKey] = useState<ListingSortKey>(initialSortKey);
  const initialFiltersKey = JSON.stringify(initialFilters);

  useEffect(() => {
    const nextFilters = JSON.parse(initialFiltersKey) as ListingSearchFilters;
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }, [initialFiltersKey]);

  useEffect(() => {
    setSortKey(initialSortKey);
  }, [initialSortKey]);

  const filteredListings = useMemo(() => {
    return sortListings(filterListings(listings, appliedFilters), sortKey);
  }, [appliedFilters, listings, sortKey]);

  const handleFilterChange = (field: keyof ListingSearchFilters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    router.push(buildListingSearchUrl(filters, sortKey), { scroll: false });
  };

  const handleSortChange = (value: string) => {
    if (!isListingSortKey(value)) return;
    setSortKey(value);
    router.replace(buildListingSearchUrl(appliedFilters, value), { scroll: false });
  };

  return (
    <>
      <ListingFilters filters={filters} onChange={handleFilterChange} onSearch={handleSearch} />
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{filteredListings.length} ilmoitusta</p>
        <ListingSort value={sortKey} onChange={handleSortChange} />
      </div>
      <div className="mt-6"><ListingGrid listings={filteredListings} returnTo={buildListingSearchUrl(appliedFilters, sortKey)} /></div>
    </>
  );
}