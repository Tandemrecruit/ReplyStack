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

interface ChainConfig<T> extends TableConfig<T> {
  /** Override for .single() terminal method */
  singleData?: T | null;
  singleError?: QueryError;
  /** Override for .maybeSingle() terminal method */
  maybeSingleData?: T | null;
  maybeSingleError?: QueryError;
}

/**
 * Create a mock chain for Supabase query builders.
 * Supports chain methods: select, eq, in, not, limit, order, insert, update, upsert
 * Supports terminal methods: single, maybeSingle
 *
 * The returned chain is also a Promise that resolves to { data, error } for
 * queries that don't use a terminal method.
 */
function createMockChain<T>(config: ChainConfig<T> = {}) {
  const defaultResult = {
    data: config.data ?? null,
    error: config.error ?? null,
  };

  // Create the Promise-like chain first so methods can reference it
  const resolvableChain = Object.assign(
    Promise.resolve(defaultResult),
    {} as Record<string, ReturnType<typeof vi.fn>>,
  );

  // Terminal methods with potential overrides
  resolvableChain.single = vi.fn().mockResolvedValue({
    data: config.singleData ?? config.data ?? null,
    error: config.singleError ?? config.error ?? null,
  });

  resolvableChain.maybeSingle = vi.fn().mockResolvedValue({
    data: config.maybeSingleData ?? config.data ?? null,
    error: config.maybeSingleError ?? config.error ?? null,
  });

  // Chain methods that return the resolvable chain (not a bare object)
  const chainMethods = [
    "select",
    "eq",
    "in",
    "not",
    "limit",
    "order",
    "insert",
    "update",
    "upsert",
  ];
  for (const method of chainMethods) {
    resolvableChain[method] = vi.fn().mockReturnValue(resolvableChain);
  }

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
      // Chain resolves to array data for .in().not() queries
      const chain = createMockChain({
        data: Array.isArray(usersConfig.data) ? usersConfig.data : [],
        error: usersConfig.error ?? null,
        singleData: usersConfig.single?.data ?? usersConfig.data ?? null,
        singleError: usersConfig.single?.error ?? usersConfig.error ?? null,
      });
      return chain;
    }

    if (table === "reviews" && tables.reviews) {
      const reviewsConfig = tables.reviews;
      const chain = createMockChain({
        data: reviewsConfig.data ?? null,
        error: reviewsConfig.error ?? null,
        singleData: reviewsConfig.single?.data ?? reviewsConfig.data ?? null,
        singleError: reviewsConfig.single?.error ?? reviewsConfig.error ?? null,
      });
      return chain;
    }

    if (table === "locations" && tables.locations) {
      const locationsConfig = tables.locations;
      // Chain resolves to array data for .eq().limit() queries
      const chain = createMockChain({
        data: Array.isArray(locationsConfig.data) ? locationsConfig.data : [],
        error: locationsConfig.error ?? null,
      });
      return chain;
    }

    if (table === "organizations" && tables.organizations) {
      const orgsConfig = tables.organizations;
      // Chain resolves to array data for .in() queries
      const chain = createMockChain({
        data: Array.isArray(orgsConfig.data) ? orgsConfig.data : [],
        error: orgsConfig.error ?? null,
      });
      return chain;
    }

    if (table === "voice_profiles" && tables.voice_profiles) {
      const vpConfig = tables.voice_profiles;
      const chain = createMockChain({
        data: vpConfig.data ?? null,
        error: vpConfig.error ?? null,
        singleData: vpConfig.single?.data ?? vpConfig.data ?? null,
        singleError: vpConfig.single?.error ?? vpConfig.error ?? null,
        maybeSingleData: vpConfig.maybeSingle?.data ?? vpConfig.data ?? null,
        maybeSingleError: vpConfig.maybeSingle?.error ?? vpConfig.error ?? null,
      });
      return chain;
    }

    if (table === "responses" && tables.responses) {
      const responsesConfig = tables.responses;
      // Main chain for select queries
      const chain = createMockChain({
        data: null,
        error: null,
        maybeSingleData: responsesConfig.maybeSingle?.data ?? null,
        maybeSingleError: responsesConfig.maybeSingle?.error ?? null,
      });

      // Create separate chain for insert().select().single() path
      const insertChain = createMockChain({
        data: responsesConfig.insert?.data ?? { id: "resp-1" },
        error: responsesConfig.insert?.error ?? null,
        singleData: responsesConfig.insert?.data ?? { id: "resp-1" },
        singleError: responsesConfig.insert?.error ?? null,
      });

      // Override insert to return the insert chain
      // createMockChain's `insert` can be optional in the mocked type; ensure it's present.
      chain.insert = chain.insert ?? vi.fn();
      chain.insert.mockReturnValue(insertChain);

      return chain;
    }

    if (table === "custom_tones" && tables.custom_tones) {
      const ctConfig = tables.custom_tones;
      // Chain supports eq().eq().maybeSingle() via chaining
      const chain = createMockChain({
        data: ctConfig.data ?? null,
        error: ctConfig.error ?? null,
        maybeSingleData: ctConfig.data ?? null,
        maybeSingleError: ctConfig.error ?? null,
      });
      return chain;
    }

    if (table === "cron_poll_state" && tables.cron_poll_state) {
      const cronConfig = tables.cron_poll_state;
      // Chain resolves to array data and supports upsert
      const chain = createMockChain({
        data: Array.isArray(cronConfig.data) ? cronConfig.data : [],
        error: cronConfig.error ?? null,
      });
      return chain;
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
      // Chain resolves to array data for .eq().limit() queries
      const chain = createMockChain({
        data: config.locationsData ?? [],
        error: config.locationsError ?? null,
      });
      return chain;
    }

    if (table === "users") {
      // Chain resolves to array data for .in().not() queries
      const chain = createMockChain({
        data: config.usersData ?? [],
        error: config.usersError ?? null,
      });
      return chain;
    }

    if (table === "organizations") {
      // Default to agency tier so locations are processed every run
      const defaultOrgs =
        config.organizationsData !== undefined
          ? config.organizationsData
          : [{ id: "org-1", plan_tier: "agency" }];
      const chain = createMockChain({
        data: defaultOrgs,
        error: config.organizationsError ?? null,
      });
      return chain;
    }

    if (table === "cron_poll_state") {
      // Default to empty array (no previous processing) to allow all tiers to process
      const defaultState =
        config.cronPollStateData !== undefined ? config.cronPollStateData : [];
      const chain = createMockChain({
        data: defaultState,
        error: config.cronPollStateError ?? null,
      });
      return chain;
    }

    // Default empty chain for unknown tables
    return createMockChain({ data: null, error: null });
  });

  return {
    from: mockFrom,
  };
}
