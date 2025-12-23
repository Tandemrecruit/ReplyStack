"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface ReviewsFiltersProps {
  currentStatus?: string | null | undefined;
  currentRating?: string | null | undefined;
  basePath?: string;
}

/**
 * Client component for reviews page filters that updates URL search params.
 *
 * Handles status and rating filter dropdowns, updating the URL when selections change.
 * Selecting "All Ratings" or "All Status" removes the corresponding search param.
 *
 * @param currentStatus - Current status filter value from URL (pending, responded, ignored)
 * @param currentRating - Current rating filter value from URL (1-5)
 * @param basePath - Optional base path for navigation. If not provided, uses current pathname from usePathname() or falls back to '/reviews'
 */
export function ReviewsFilters({
  currentStatus,
  currentRating,
  basePath,
}: ReviewsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const latestParamsRef = useRef<string | null>(null);

  // Keep an up-to-date snapshot of the current query string so that consecutive
  // filter changes compose correctly (including in tests where router.push doesn't
  // update useSearchParams()).
  useEffect(() => {
    latestParamsRef.current = searchParams.toString();
  }, [searchParams]);

  // Derive base path: prop > pathname > fallback
  // Remove query string, trim trailing slashes, ensure it starts with /
  const derivedBasePath = useMemo(() => {
    const rawPath = basePath ?? pathname ?? "/reviews";
    // Remove query string if present
    const pathWithoutQuery = rawPath.split("?")[0] ?? rawPath;
    // Trim trailing slashes (but keep root /)
    const trimmedPath = pathWithoutQuery.replace(/\/+$/, "") || "/";
    return trimmedPath;
  }, [basePath, pathname]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const baseQuery = latestParamsRef.current ?? searchParams.toString();
      const params = new URLSearchParams(baseQuery);

      // Remove param if "all" option selected, otherwise set the value
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Reset to page 1 when filters change
      params.delete("page");

      const queryString = params.toString();
      const url = queryString
        ? `${derivedBasePath}?${queryString}`
        : derivedBasePath;
      latestParamsRef.current = params.toString();
      router.push(url);
    },
    [router, searchParams, derivedBasePath],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateFilter("status", e.target.value);
    },
    [updateFilter],
  );

  const handleRatingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateFilter("rating", e.target.value);
    },
    [updateFilter],
  );

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Filter by rating"
        value={currentRating ?? "all"}
        onChange={handleRatingChange}
        className="px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground"
      >
        <option value="all">All Ratings</option>
        <option value="5">5 Stars</option>
        <option value="4">4 Stars</option>
        <option value="3">3 Stars</option>
        <option value="2">2 Stars</option>
        <option value="1">1 Star</option>
      </select>
      <select
        aria-label="Filter by status"
        value={currentStatus ?? "all"}
        onChange={handleStatusChange}
        className="px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="responded">Responded</option>
        <option value="ignored">Ignored</option>
      </select>
    </div>
  );
}
