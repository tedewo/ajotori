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

export function mapSupabaseListingToAjotoriListing(row: SupabaseListingRow): Listing {
  const technicalData = row.technical_data ?? {};
  const technicalSpecs = Object.fromEntries(
    Object.entries(technicalData).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).map(([key, value]) => [key, String(value)]),
  );
  const mileageValue = technicalData.mileage;
  const transmissionValue = technicalData.transmission;
  const powerSourceValue = technicalData.fuel;

  return {
    id: row.id,
    category: row.category_slug ?? '',
    subcategory: row.subcategory_slug ?? '',
    brand: row.brand ?? '',
    model: row.model ?? '',
    title: row.title ?? '',
    year: row.year ?? 0,
    price: row.price ?? 0,
    province: row.region ?? '',
    municipality: row.municipality ?? '',
    description: row.description ?? '',
    technicalSpecs,
    mileage: typeof mileageValue === 'number' ? mileageValue : undefined,
    features: row.equipment ?? [],
    sellerType: row.seller_type ?? 'private',
    sellerName: '',
    externalListingUrl: row.external_listing_url ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    images: [],
    powerSource: typeof powerSourceValue === 'string' ? powerSourceValue : '',
    transmission: typeof transmissionValue === 'string' ? transmissionValue : '',
  };
}
