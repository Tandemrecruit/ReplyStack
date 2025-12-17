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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
