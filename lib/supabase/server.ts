import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from './client';

export class StorageAdminConfigurationError extends Error {
  constructor(
    readonly code: 'missing_supabase_url' | 'missing_service_role_key',
    message: string,
  ) {
    super(message);
    this.name = 'StorageAdminConfigurationError';
  }
}

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

export async function createServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key';

  return createSupabaseServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Ignore React Server Components cookie writes during prerender or static generation.
        }
      },
    },
  });
}

export function createStorageAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new StorageAdminConfigurationError(
      'missing_supabase_url',
      'NEXT_PUBLIC_SUPABASE_URL is not set for server-side Storage cleanup.',
    );
  }
  if (!serviceRoleKey) {
    throw new StorageAdminConfigurationError(
      'missing_service_role_key',
      'SUPABASE_SERVICE_ROLE_KEY is not set; configure this server-only variable to enable Storage cleanup.',
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createServerClient();
  return supabase.auth.getUser();
}
