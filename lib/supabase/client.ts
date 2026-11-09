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
        Insert: {
          id?: string;
          seller_type?: 'private' | 'company';
          display_name?: string | null;
          company_name?: string | null;
          website_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          seller_type: 'private' | 'company';
          display_name: string | null;
          company_name: string | null;
          website_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
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
          homepage_description: string | null;
          region: string | null;
          municipality: string | null;
          seller_type: 'private' | 'company';
          external_listing_url: string | null;
          status: 'draft' | 'published' | 'sold' | 'removed';
          technical_data: Record<string, unknown> | null;
          equipment: string[] | null;
          published_at: string | null;
          expires_at: string | null;
          renewal_deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id?: string;
          category_slug?: string | null;
          subcategory_slug?: string | null;
          title?: string | null;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          price?: number | null;
          description?: string | null;
          homepage_description?: string | null;
          region?: string | null;
          municipality?: string | null;
          seller_type?: 'private' | 'company';
          external_listing_url?: string | null;
          status?: 'draft' | 'published' | 'sold' | 'removed';
          technical_data?: Record<string, unknown> | null;
          equipment?: string[] | null;
          published_at?: string | null;
          expires_at?: string | null;
          renewal_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
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
          homepage_description: string | null;
          region: string | null;
          municipality: string | null;
          seller_type: 'private' | 'company';
          external_listing_url: string | null;
          status: 'draft' | 'published' | 'sold' | 'removed';
          technical_data: Record<string, unknown> | null;
          equipment: string[] | null;
          published_at: string | null;
          expires_at: string | null;
          renewal_deadline: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'listings_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          listing_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'listing_images_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      get_published_listing_seller_display_name: {
        Args: { p_listing_id: string };
        Returns: string | null;
      };
      publish_listing: {
        Args: { p_listing_id: string };
        Returns: string;
      };
      renew_listing: {
        Args: { p_listing_id: string };
        Returns: string;
      };
      enqueue_listing_storage_cleanup: {
        Args: {
          p_listing_id: string;
          p_image_id: string | null;
          p_storage_path: string;
          p_reason: 'listing_delete' | 'image_delete' | 'upload_compensation';
        };
        Returns: string;
      };
      enqueue_listing_deletion_cleanup: {
        Args: { p_listing_id: string };
        Returns: number;
      };
      list_listing_storage_cleanup_tasks: {
        Args: { p_listing_id: string; p_image_id?: string | null };
        Returns: Array<{
          image_id: string | null;
          storage_path: string;
          reason: 'listing_delete' | 'image_delete' | 'upload_compensation';
        }>;
      };
      complete_listing_storage_cleanup: {
        Args: { p_listing_id: string; p_storage_paths: string[] };
        Returns: number;
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
