import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          seller_type: 'private' | 'company';
          display_name: string | null;
          company_name: string | null;
          website_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          category_slug: string | null;
          subcategory_slug: string | null;
          title: string | null;
          brand: string | null;
          model: string | null;
          year: number | null;
          price: number | null;
          description: string | null;
          region: string | null;
          municipality: string | null;
          seller_type: 'private' | 'company';
          external_listing_url: string | null;
          status: 'draft' | 'published' | 'sold' | 'removed';
          technical_data: Record<string, unknown> | null;
          equipment: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
};

export function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(
    url &&
      key &&
      url !== 'https://placeholder.supabase.co' &&
      key !== 'placeholder-key',
  );
}

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key';

  return createBrowserSupabaseClient<Database>(url, key);
}
