import type { Listing } from '@/lib/listings';

export interface SupabaseListingRow {
  id: string;
  seller_id: string;
  category_slug?: string | null;
  subcategory_slug?: string | null;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  description?: string | null;
  region?: string | null;
  municipality?: string | null;
  seller_type?: 'private' | 'company';
  external_listing_url?: string | null;
  status?: 'draft' | 'published' | 'sold' | 'removed';
  technical_data?: Record<string, unknown> | null;
  equipment?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function mapMileage(value: unknown): number | undefined {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) {
    return undefined;
  }

  const mileage = Number(value);
  return Number.isFinite(mileage) && mileage > 0 ? mileage : undefined;
}

function mapDisplayText(value: unknown): string {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  return ['undefined', 'null', 'nan'].includes(trimmed.toLocaleLowerCase('fi-FI')) ? '' : trimmed;
}

export function mapSupabaseListingToAjotoriListing(row: SupabaseListingRow, sellerDisplayName: string | null = null): Listing {
  const technicalData = row.technical_data ?? {};
  const technicalSpecs = Object.fromEntries(
    Object.entries(technicalData).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).map(([key, value]) => [key, String(value)]),
  );

  return {
    id: row.id,
    category: row.category_slug ?? '',
    subcategory: row.subcategory_slug ?? '',
    brand: row.brand ?? '',
    model: row.model ?? '',
    title: row.title ?? '',
    year: row.year ?? 0,
    price: row.price ?? 0,
    province: mapDisplayText(row.region),
    municipality: mapDisplayText(row.municipality),
    description: row.description ?? '',
    technicalSpecs,
    mileage: mapMileage(technicalData.mileage),
    features: row.equipment ?? [],
    sellerType: row.seller_type ?? 'private',
    sellerName: sellerDisplayName?.trim() ?? '',
    externalListingUrl: row.external_listing_url ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    images: [],
    powerSource: mapDisplayText(technicalData.fuel),
    transmission: mapDisplayText(technicalData.transmission),
  };
}
