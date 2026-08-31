"use client";

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ListingFilters, { type ListingFilterState } from '@/app/components/listings/ListingFilters';
import ListingGrid from '@/app/components/listings/ListingGrid';
import ListingSort from '@/app/components/listings/ListingSort';
import { getListingsForCategory, mockListings } from '@/lib/listings';

const defaultFilters: ListingFilterState = {
  category: '',
  subcategory: '',
  province: '',
  municipality: '',
  brand: '',
  model: '',
  priceMin: '',
  priceMax: '',
  yearMin: '',
  yearMax: '',
  powerSource: '',
  transmission: '',
};

function sortListings(listings: typeof mockListings, sortKey: string) {
  const items = [...listings];

  switch (sortKey) {
    case 'price-asc':
      return items.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return items.sort((a, b) => b.price - a.price);
    case 'year-desc':
      return items.sort((a, b) => b.year - a.year);
    case 'year-asc':
      return items.sort((a, b) => a.year - b.year);
    case 'newest':
    default:
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

function ListingIndexContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') ?? '';
  const initialSubcategory = searchParams.get('subcategory') ?? '';
  const [filters, setFilters] = useState<ListingFilterState>({
    ...defaultFilters,
    category: initialCategory,
    subcategory: initialSubcategory,
  });
  const [sortKey, setSortKey] = useState('newest');

  const filteredListings = useMemo(() => {
    let items = getListingsForCategory(filters.category || undefined, filters.subcategory || undefined);

    if (filters.province) {
      items = items.filter((listing) => listing.province === filters.province);
    }
    if (filters.municipality) {
      items = items.filter((listing) => listing.municipality === filters.municipality);
    }
    if (filters.brand) {
      items = items.filter((listing) => listing.brand.toLowerCase().includes(filters.brand.toLowerCase()));
    }
    if (filters.model) {
      items = items.filter((listing) => listing.model.toLowerCase().includes(filters.model.toLowerCase()));
    }
    if (filters.priceMin) {
      items = items.filter((listing) => listing.price >= Number(filters.priceMin));
    }
    if (filters.priceMax) {
      items = items.filter((listing) => listing.price <= Number(filters.priceMax));
    }
    if (filters.yearMin) {
      items = items.filter((listing) => listing.year >= Number(filters.yearMin));
    }
    if (filters.yearMax) {
      items = items.filter((listing) => listing.year <= Number(filters.yearMax));
    }
    if (filters.powerSource) {
      items = items.filter((listing) => listing.powerSource === filters.powerSource);
    }
    if (filters.transmission) {
      items = items.filter((listing) => listing.transmission === filters.transmission);
    }

    return sortListings(items, sortKey);
  }, [filters, sortKey]);

  const handleFilterChange = (field: keyof ListingFilterState, value: string) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ilmoitukset</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Selaa ilmoituksia</h1>
          </div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-[#0ea5e9]">
            ← Takaisin etusivulle
          </Link>
        </div>

        <ListingFilters
          filters={filters}
          onChange={handleFilterChange}
          initialCategory={initialCategory}
          initialSubcategory={initialSubcategory}
        />

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{filteredListings.length} ilmoitusta</p>
          <ListingSort value={sortKey} onChange={setSortKey} />
        </div>

        <div className="mt-6">
          <ListingGrid listings={filteredListings} />
        </div>
      </div>
    </main>
  );
}

export default function ListingIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexContent />
    </Suspense>
  );
}
