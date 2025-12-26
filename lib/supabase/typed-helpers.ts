import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Typed helper for Supabase insert operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 *
 * @param supabase - The Supabase client instance
 * @param table - The table name (key from Database["public"]["Tables"])
 * @param values - The values to insert, typed according to the table's Insert type
 * @returns A Supabase query builder for the insert operation
 */
export function typedInsert<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values: Database["public"]["Tables"][T]["Insert"],
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).insert(values as any);
}

/**
 * Typed helper for Supabase update operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 *
 * @param supabase - The Supabase client instance
 * @param table - The table name (key from Database["public"]["Tables"])
 * @param values - The values to update, typed according to the table's Update type
 * @returns A Supabase query builder for the update operation
 */
export function typedUpdate<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values: Database["public"]["Tables"][T]["Update"],
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).update(values as any);
}

/**
 * Typed helper for Supabase upsert operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 *
 * @param supabase - The Supabase client instance
 * @param table - The table name (key from Database["public"]["Tables"])
 * @param values - The values to upsert (single object or array), typed according to the table's Insert type
 * @param options - Optional upsert configuration (onConflict, ignoreDuplicates)
 * @returns A Supabase query builder for the upsert operation
 */
export function typedUpsert<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values:
    | Database["public"]["Tables"][T]["Insert"]
    | Database["public"]["Tables"][T]["Insert"][],
  options?: { onConflict?: string; ignoreDuplicates?: boolean },
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).upsert(values as any, options);
}
