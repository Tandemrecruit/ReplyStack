/**
 * Supabase client mock factory for tests.
 * Reduces boilerplate by providing a configurable mock builder.
 */

import { vi } from "vitest";
import type {
  Location,
  Organization,
  Response,
  Review,
  User,
  VoiceProfile,
} from "@/lib/supabase/types";

type QueryError = { message: string } | null;

interface TableConfig<T> {
  data?: T | T[] | null;
  error?: QueryError;
}

interface MockSupabaseConfig {
  /** Auth configuration */
  auth?: {
    user?: { id: string } | null;
    error?: QueryError;
  };
  /** Table-specific configurations */
  tables?: {
    users?: TableConfig<User> & {
      /** For .single() queries */
      single?: TableConfig<User>;
    };
    reviews?: TableConfig<Review> & {
      single?: TableConfig<Review & { locations?: Location }>;
    };
    locations?: TableConfig<Location>;
    organizations?: TableConfig<Organization>;
    voice_profiles?: TableConfig<VoiceProfile> & {
      single?: TableConfig<VoiceProfile>;
      maybeSingle?: TableConfig<VoiceProfile | null>;
    };
    responses?: TableConfig<Response> & {
      maybeSingle?: TableConfig<Response | null>;
      insert?: TableConfig<Response>;
    };
    custom_tones?: TableConfig<{
      id: string;
      organization_id: string;
      enhanced_context: string | null;
    }>;
    cron_poll_state?: TableConfig<{ tier: string; last_processed_at: string }>;
  };
}

/**
 * Create a mock chain for Supabase query builders.
 * Supports: select, eq, in, not, single, maybeSingle, limit, insert, update, upsert
 */
function createMockChain<T>(config: TableConfig<T>) {
  const result = {
    data: config.data ?? null,
    error: config.error ?? null,
  };

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Terminal methods that return the result
  const terminalMethods = ["single", "maybeSingle"];
  for (const method of terminalMethods) {
    chain[method] = vi.fn().mockResolvedValue(result);
  }

  // Chain methods that return the chain
  const chainMethods = ["select", "eq", "in", "not", "limit", "order"];
  for (const method of chainMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Also make the chain itself resolvable for queries that end without terminal method
  const resolvableChain = Object.assign(Promise.resolve(result), chain);

  return resolvableChain;
}

/**
 * Create a mock Supabase client for server-side usage (createServerSupabaseClient).
 */
export function createMockServerSupabaseClient(
  config: MockSupabaseConfig = {},
) {
  const { auth = {}, tables = {} } = config;

  const mockFrom = vi.fn((table: string) => {
    if (table === "users" && tables.users) {
      const usersConfig = tables.users;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: usersConfig.single?.data ?? usersConfig.data ?? null,
              error: usersConfig.single?.error ?? usersConfig.error ?? null,
            }),
          }),
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: Array.isArray(usersConfig.data) ? usersConfig.data : [],
              error: usersConfig.error ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "reviews" && tables.reviews) {
      const reviewsConfig = tables.reviews;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: reviewsConfig.single?.data ?? reviewsConfig.data ?? null,
              error: reviewsConfig.single?.error ?? reviewsConfig.error ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "locations" && tables.locations) {
      const locationsConfig = tables.locations;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: Array.isArray(locationsConfig.data)
                ? locationsConfig.data
                : [],
              error: locationsConfig.error ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "organizations" && tables.organizations) {
      const orgsConfig = tables.organizations;
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: Array.isArray(orgsConfig.data) ? orgsConfig.data : [],
            error: orgsConfig.error ?? null,
          }),
        }),
      };
    }

    if (table === "voice_profiles" && tables.voice_profiles) {
      const vpConfig = tables.voice_profiles;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: vpConfig.single?.data ?? vpConfig.data ?? null,
              error: vpConfig.single?.error ?? vpConfig.error ?? null,
            }),
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: vpConfig.maybeSingle?.data ?? vpConfig.data ?? null,
                error: vpConfig.maybeSingle?.error ?? vpConfig.error ?? null,
              }),
            }),
          }),
        }),
      };
    }

    if (table === "responses" && tables.responses) {
      const responsesConfig = tables.responses;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: responsesConfig.maybeSingle?.data ?? null,
              error: responsesConfig.maybeSingle?.error ?? null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: responsesConfig.insert?.data ?? { id: "resp-1" },
              error: responsesConfig.insert?.error ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "custom_tones" && tables.custom_tones) {
      const ctConfig = tables.custom_tones;
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: ctConfig.data ?? null,
                error: ctConfig.error ?? null,
              }),
            }),
          }),
        }),
      };
    }

    if (table === "cron_poll_state" && tables.cron_poll_state) {
      const cronConfig = tables.cron_poll_state;
      return {
        select: vi.fn().mockResolvedValue({
          data: Array.isArray(cronConfig.data) ? cronConfig.data : [],
          error: cronConfig.error ?? null,
        }),
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
    }

    // Default empty chain for unknown tables
    return createMockChain({ data: null, error: null });
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: auth.user ?? null },
        error: auth.error ?? null,
      }),
    },
    from: mockFrom,
  };
}

/**
 * Create a mock Supabase client for admin usage (createAdminSupabaseClient).
 * Similar to server client but typically uses service role key.
 */
export function createMockAdminSupabaseClient(config: MockSupabaseConfig = {}) {
  return createMockServerSupabaseClient(config);
}

/**
 * Helper to create a mock for poll-reviews route specifically.
 * Handles the complex multi-table queries used in that route.
 */
export function createMockPollReviewsSupabaseClient(
  config: {
    locationsData?: Location[];
    locationsError?: QueryError;
    usersData?: User[];
    usersError?: QueryError;
    organizationsData?: Array<{ id: string; plan_tier: string | null }>;
    organizationsError?: QueryError;
    cronPollStateData?: { tier: string; last_processed_at: string }[];
    cronPollStateError?: QueryError;
  } = {},
) {
  const mockFrom = vi.fn((table: string) => {
    if (table === "locations") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: config.locationsData ?? [],
              error: config.locationsError ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "users") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: config.usersData ?? [],
              error: config.usersError ?? null,
            }),
          }),
        }),
      };
    }

    if (table === "organizations") {
      // Default to agency tier so locations are processed every run
      const defaultOrgs =
        config.organizationsData !== undefined
          ? config.organizationsData
          : [{ id: "org-1", plan_tier: "agency" }];
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: defaultOrgs,
            error: config.organizationsError ?? null,
          }),
        }),
      };
    }

    if (table === "cron_poll_state") {
      // Default to empty array (no previous processing) to allow all tiers to process
      const defaultState =
        config.cronPollStateData !== undefined ? config.cronPollStateData : [];
      return {
        select: vi.fn().mockResolvedValue({
          data: defaultState,
          error: config.cronPollStateError ?? null,
        }),
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
    }

    // Default empty return for unknown tables
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });

  return {
    from: mockFrom,
  };
}
