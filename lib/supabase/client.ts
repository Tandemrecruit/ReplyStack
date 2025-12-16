"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Creates a Supabase client for Client Components.
 * This should be used sparingly - prefer Server Components for data fetching.
 *
 * Usage:
 * ```ts
 * const supabase = createBrowserSupabaseClient();
 * const { data, error } = await supabase.from('reviews').select('*');
 * ```
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

