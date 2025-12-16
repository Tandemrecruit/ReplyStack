import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Create a Supabase browser client configured from the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.
 *
 * @returns A Supabase browser client instance typed with `Database`
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}