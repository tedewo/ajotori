"use client";

import { useMemo, useState } from 'react';
import type { Listing } from '@/lib/listings';
import ListingFilters, { type ListingFilterState } from './ListingFilters';
import ListingGrid from './ListingGrid';
import ListingSort from './ListingSort';

const defaultFilters: ListingFilterState = {
  category: '', subcategory: '', province: '', municipality: '', brand: '', model: '',
  priceMin: '', priceMax: '', yearMin: '', yearMax: '', powerSource: '', transmission: '',
};

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
  initialCategory = '',
  initialSubcategory = '',
}: {
  listings: Listing[];
  initialCategory?: string;
  initialSubcategory?: string;
}) {
  const [filters, setFilters] = useState<ListingFilterState>({
    ...defaultFilters, category: initialCategory, subcategory: initialSubcategory,
  });
  const [sortKey, setSortKey] = useState('newest');

  const filteredListings = useMemo(() => {
    let items = listings;
    if (filters.province) items = items.filter((listing) => listing.province === filters.province);
    if (filters.municipality) items = items.filter((listing) => listing.municipality === filters.municipality);
    if (filters.brand) items = items.filter((listing) => listing.brand.toLowerCase().includes(filters.brand.toLowerCase()));
    if (filters.model) items = items.filter((listing) => listing.model.toLowerCase().includes(filters.model.toLowerCase()));
    if (filters.priceMin) items = items.filter((listing) => listing.price >= Number(filters.priceMin));
    if (filters.priceMax) items = items.filter((listing) => listing.price <= Number(filters.priceMax));
    if (filters.yearMin) items = items.filter((listing) => listing.year >= Number(filters.yearMin));
    if (filters.yearMax) items = items.filter((listing) => listing.year <= Number(filters.yearMax));
    if (filters.powerSource) items = items.filter((listing) => listing.powerSource === filters.powerSource);
    if (filters.transmission) items = items.filter((listing) => listing.transmission === filters.transmission);
    return sortListings(items, sortKey);
  }, [filters, listings, sortKey]);

  const handleFilterChange = (field: keyof ListingFilterState, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <>
      <ListingFilters filters={filters} onChange={handleFilterChange} initialCategory={initialCategory} initialSubcategory={initialSubcategory} />
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{filteredListings.length} ilmoitusta</p>
        <ListingSort value={sortKey} onChange={setSortKey} />
      </div>
      <div className="mt-6"><ListingGrid listings={filteredListings} /></div>
    </>
  );
}