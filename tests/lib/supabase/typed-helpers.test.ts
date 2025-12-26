/**
 * @vitest-environment node
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  typedInsert,
  typedUpdate,
  typedUpsert,
} from "@/lib/supabase/typed-helpers";
import type { Database } from "@/lib/supabase/types";

describe("lib/supabase/typed-helpers", () => {
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;
  });

  describe("typedInsert", () => {
    it("calls supabase.from().insert() with correct table and values", () => {
      const mockInsert = vi.fn().mockReturnValue({});
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      mockSupabase.from = mockFrom;

      const values = {
        id: "user-1",
        email: "test@example.com",
        organization_id: "org-1",
      };

      typedInsert(mockSupabase, "users", values);

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockInsert).toHaveBeenCalledWith(values);
    });
  });

  describe("typedUpdate", () => {
    it("calls supabase.from().update() with correct table and values", () => {
      const mockUpdate = vi.fn().mockReturnValue({});
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      mockSupabase.from = mockFrom;

      const values = {
        email: "new@example.com",
      };

      typedUpdate(mockSupabase, "users", values);

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpdate).toHaveBeenCalledWith(values);
    });
  });

  describe("typedUpsert", () => {
    it("calls supabase.from().upsert() with single value", () => {
      const mockUpsert = vi.fn().mockReturnValue({});
      const mockFrom = vi.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      mockSupabase.from = mockFrom;

      const values = {
        id: "user-1",
        email: "test@example.com",
      };

      typedUpsert(mockSupabase, "users", values);

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpsert).toHaveBeenCalledWith(values, undefined);
    });

    it("calls supabase.from().upsert() with array of values", () => {
      const mockUpsert = vi.fn().mockReturnValue({});
      const mockFrom = vi.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      mockSupabase.from = mockFrom;

      const values = [
        { id: "user-1", email: "test1@example.com" },
        { id: "user-2", email: "test2@example.com" },
      ];

      typedUpsert(mockSupabase, "users", values);

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpsert).toHaveBeenCalledWith(values, undefined);
    });

    it("calls supabase.from().upsert() with options", () => {
      const mockUpsert = vi.fn().mockReturnValue({});
      const mockFrom = vi.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      mockSupabase.from = mockFrom;

      const values = {
        id: "user-1",
        email: "test@example.com",
      };

      const options = {
        onConflict: "id",
        ignoreDuplicates: false,
      };

      typedUpsert(mockSupabase, "users", values, options);

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(mockUpsert).toHaveBeenCalledWith(values, options);
    });
  });
});
