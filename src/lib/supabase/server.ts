import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Create a Supabase client for server-side use that is bound to Next.js server cookies for session handling.
 *
 * @returns A Supabase client (typed with `Database`) initialized with the app's public URL and anon key and configured with cookie handlers that read from Next.js server cookies; attempts to set cookies are performed but any errors during setting are ignored.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client authenticated with the service role key for privileged admin operations.
 *
 * @returns A Supabase client (typed for `Database`) authenticated with the service role key that bypasses Row Level Security
 */
export async function createServiceClient() {
  // Service client for admin operations (bypasses RLS)
  const { createClient } = await import('@supabase/supabase-js');

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}