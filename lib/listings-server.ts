import type { Listing } from '@/lib/listings';
import { mapSupabaseListingToAjotoriListing, type SupabaseListingRow } from '@/lib/supabase/mappers';
import { createServerClient } from '@/lib/supabase/server';

type ListingFilters = {
  categorySlug?: string;
  subcategorySlug?: string;
};

type ListingImageRow = {
  listing_id: string;
  storage_path: string;
  sort_order: number;
};

async function getPublishedListingRows(filters: ListingFilters = {}) {
  const supabase = await createServerClient();
  let query = supabase.from('listings').select('*').eq('status', 'published').order('created_at', { ascending: false });

  if (filters.categorySlug) query = query.eq('category_slug', filters.categorySlug);
  if (filters.subcategorySlug) query = query.eq('subcategory_slug', filters.subcategorySlug);

  const { data, error } = await query;
  if (error) {
    console.error('Published listings query failed:', error.message);
    return [];
  }
  return data as SupabaseListingRow[];
}

async function getListingImages(listingIds: string[]) {
  if (listingIds.length === 0) return new Map<string, string[]>();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('listing_images')
    .select('listing_id, storage_path, sort_order')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Published listing images query failed:', error.message);
    return new Map<string, string[]>();
  }

  const imagesByListing = new Map<string, string[]>();
  for (const image of (data as ListingImageRow[]) ?? []) {
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('listings')
      .createSignedUrl(image.storage_path, 3600);
    if (signedUrlError || !signedUrl) continue;

    const images = imagesByListing.get(image.listing_id) ?? [];
    images.push(signedUrl.signedUrl);
    imagesByListing.set(image.listing_id, images);
  }
  return imagesByListing;
}

async function mapPublishedListings(rows: SupabaseListingRow[]): Promise<Listing[]> {
  const imagesByListing = await getListingImages(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...mapSupabaseListingToAjotoriListing(row),
    images: imagesByListing.get(row.id) ?? [],
  }));
}

export async function getPublishedListings(filters: ListingFilters = {}) {
  return mapPublishedListings(await getPublishedListingRows(filters));
}

export async function getPublishedListingById(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;

  const [listing] = await mapPublishedListings([data as SupabaseListingRow]);
  return listing ?? null;
}