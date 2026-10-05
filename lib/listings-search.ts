import type { Listing } from './listings';
import { CATEGORY_SLUGS, SUBCATEGORY_SLUGS } from './categories';

export type ListingSearchFilters = {
  category: string;
  subcategory: string;
  province: string;
  municipality: string;
  brand: string;
  model: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  powerSource: string;
  transmission: string;
  registrationType: string;
};

export const DEFAULT_LISTING_SEARCH_FILTERS: ListingSearchFilters = {
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
  registrationType: '',
};

export const LISTING_SORT_KEYS = ['newest', 'price-asc', 'price-desc', 'year-desc', 'year-asc'] as const;
export type ListingSortKey = (typeof LISTING_SORT_KEYS)[number];

export function isListingSortKey(value: string): value is ListingSortKey {
  return LISTING_SORT_KEYS.includes(value as ListingSortKey);
}

export function buildListingSearchUrl(filters: ListingSearchFilters, sortKey: ListingSortKey): string {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value.trim()) query.set(key, value.trim());
  });
  if (sortKey !== 'newest') query.set('sort', sortKey);

  const queryString = query.toString();
  return `/ilmoitukset/${queryString ? `?${queryString}` : ''}`;
}

export function getSafeListingReturnTo(value?: string | string[]): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return '/ilmoitukset/';

  try {
    const url = new URL(candidate, 'https://ajotori.invalid');
    if (url.origin !== 'https://ajotori.invalid' || !/^\/ilmoitukset\/?$/.test(url.pathname)) {
      return '/ilmoitukset/';
    }

    const query = new URLSearchParams(url.search);
    query.delete('returnTo');
    const queryString = query.toString();
    return `/ilmoitukset/${queryString ? `?${queryString}` : ''}`;
  } catch {
    return '/ilmoitukset/';
  }
}

function normalizeOption(value: string): string {
  const normalized = value.trim().toLocaleLowerCase('fi-FI');
  const aliases: Record<string, string> = {
    hybrid: 'hybridi',
    manuaalinen: 'manuaali',
    manual: 'manuaali',
    automaattinen: 'automaatti',
    automatic: 'automaatti',
  };
  return aliases[normalized] ?? normalized;
}

function matchesNumberRange(value: number, minimum: string, maximum: string): boolean {
  const min = minimum.trim() ? Number(minimum) : null;
  const max = maximum.trim() ? Number(maximum) : null;
  if (min !== null && Number.isFinite(min) && value < min) return false;
  if (max !== null && Number.isFinite(max) && value > max) return false;
  return true;
}

export function filterListings(listings: Listing[], filters: ListingSearchFilters): Listing[] {
  return listings.filter((listing) => {
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.subcategory && listing.subcategory !== filters.subcategory) return false;
    if (filters.province && listing.province !== filters.province) return false;
    if (filters.municipality && listing.municipality !== filters.municipality) return false;
    if (filters.brand && !listing.brand.toLocaleLowerCase('fi-FI').includes(filters.brand.trim().toLocaleLowerCase('fi-FI'))) return false;
    if (filters.model && !listing.model.toLocaleLowerCase('fi-FI').includes(filters.model.trim().toLocaleLowerCase('fi-FI'))) return false;
    if (!matchesNumberRange(listing.price, filters.priceMin, filters.priceMax)) return false;
    if ((filters.yearMin.trim() || filters.yearMax.trim()) && (!listing.year || !matchesNumberRange(listing.year, filters.yearMin, filters.yearMax))) return false;
    if (filters.powerSource && normalizeOption(listing.powerSource) !== normalizeOption(filters.powerSource)) return false;
    if (filters.transmission && normalizeOption(listing.transmission) !== normalizeOption(filters.transmission)) return false;
    if (filters.category === CATEGORY_SLUGS.pienkoneet && filters.subcategory === SUBCATEGORY_SLUGS.monkijat && filters.registrationType && listing.technicalSpecs.registrationType !== filters.registrationType) return false;
    return true;
  });
}