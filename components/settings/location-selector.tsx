"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Location data from the API
 */
interface LocationData {
  id?: string;
  google_account_id: string;
  google_location_id: string;
  name: string;
  address: string;
  account_name: string;
  is_synced: boolean;
}

/**
 * Grouped locations by account
 */
interface AccountGroup {
  account_name: string;
  account_id: string;
  locations: LocationData[];
}

/**
 * API response types
 */
interface LocationsResponse {
  locations?: LocationData[];
  error?: string;
  code?: string;
}

interface SaveResponse {
  saved?: number;
  error?: string;
}

/**
 * Group a list of locations by their Google account.
 *
 * @param locations - The locations to group by `google_account_id`
 * @returns An array of account groups; each group contains `account_name`, `account_id`, and the corresponding `locations` for that account
 */
function groupByAccount(locations: LocationData[]): AccountGroup[] {
  const groups = new Map<string, AccountGroup>();

  for (const location of locations) {
    const key = location.google_account_id;
    if (!groups.has(key)) {
      groups.set(key, {
        account_name: location.account_name,
        account_id: key,
        locations: [],
      });
    }
    groups.get(key)?.locations.push(location);
  }

  return Array.from(groups.values());
}

/**
 * Render a UI that fetches Google Business Profile locations, groups them by
 * Google account, and lets the user select which locations should be synced.
 *
 * The component requests locations from the API, handles Google connection and
 * auth-expired states, pre-selects locations already marked as synced, provides
 * per-location selection controls grouped by account, and saves the selected
 * subset back to the API while reflecting saved state and presenting success or
 * error feedback.
 *
 * @returns The rendered LocationSelector React element
 */
export function LocationSelector() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsGoogleConnect, setNeedsGoogleConnect] = useState(false);

  /**
   * Fetch available locations from the API
   */
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNeedsGoogleConnect(false);

    try {
      const response = await fetch("/api/locations");
      const data = (await response.json()) as LocationsResponse;

      if (!response.ok) {
        if (data.code === "GOOGLE_NOT_CONNECTED") {
          setNeedsGoogleConnect(true);
          return;
        }
        if (data.code === "GOOGLE_AUTH_EXPIRED") {
          setNeedsGoogleConnect(true);
          setError("Your Google connection has expired. Please reconnect.");
          return;
        }
        throw new Error(data.error ?? "Failed to fetch locations");
      }

      const fetchedLocations = data.locations ?? [];
      setLocations(fetchedLocations);

      // Pre-select already synced locations
      const synced = new Set(
        fetchedLocations
          .filter((loc) => loc.is_synced)
          .map((loc) => loc.google_location_id),
      );
      setSelectedIds(synced);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch locations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  /**
   * Toggle selection of a location
   */
  const handleToggle = useCallback((locationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
    setSuccessMessage(null);
  }, []);

  /**
   * Save selected locations
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Find locations to deactivate (were synced but now unselected)
      const locationsToDeactivate = locations.filter(
        (loc) =>
          loc.is_synced && !selectedIds.has(loc.google_location_id) && loc.id,
      );

      // Deactivate unselected locations in parallel
      const deletePromises = locationsToDeactivate
        .filter((loc) => loc.id)
        .map(async (loc) => {
          const deleteResponse = await fetch("/api/locations", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location_id: loc.id }),
          });

          if (!deleteResponse.ok) {
            const deleteData = (await deleteResponse.json()) as {
              error?: string;
            };
            return {
              success: false,
              location: loc,
              error:
                deleteData.error ??
                `Failed to deactivate location: ${loc.name}`,
            };
          }

          return { success: true, location: loc };
        });

      const deleteResults = await Promise.allSettled(deletePromises);
      const errors: string[] = [];

      for (const result of deleteResults) {
        if (result.status === "rejected") {
          errors.push(
            result.reason instanceof Error
              ? result.reason.message
              : "Failed to deactivate location",
          );
        } else if (!result.value.success) {
          errors.push(result.value.error);
        }
      }

      if (errors.length > 0) {
        throw new Error(
          errors.length === 1
            ? errors[0]
            : `Failed to deactivate ${errors.length} location(s): ${errors.join("; ")}`,
        );
      }

      // Save selected locations
      const selectedLocations = locations.filter((loc) =>
        selectedIds.has(loc.google_location_id),
      );

      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: selectedLocations.map((loc) => ({
            google_account_id: loc.google_account_id,
            google_location_id: loc.google_location_id,
            name: loc.name,
            address: loc.address,
          })),
        }),
      });

      const data = (await response.json()) as SaveResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save locations");
      }

      const deactivatedCount = locationsToDeactivate.length;
      const savedCount = data.saved ?? 0;
      let message = "";
      if (deactivatedCount > 0 && savedCount > 0) {
        message = `${savedCount} location(s) saved, ${deactivatedCount} location(s) deactivated.`;
      } else if (deactivatedCount > 0) {
        message = `${deactivatedCount} location(s) deactivated.`;
      } else {
        message = `${savedCount} location(s) saved successfully.`;
      }
      setSuccessMessage(message);

      // Update local state to reflect saved locations
      setLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          is_synced: selectedIds.has(loc.google_location_id),
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save locations";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [locations, selectedIds]);

  // Don't show if Google not connected
  if (needsGoogleConnect && !error) {
    return (
      <div className="text-sm text-foreground-secondary">
        Connect your Google account above to select locations.
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <output
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2 text-sm text-foreground-secondary"
      >
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading locations...
      </output>
    );
  }

  // Error state
  if (error && locations.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchLocations}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // No locations found
  if (locations.length === 0) {
    return (
      <div className="text-sm text-foreground-secondary">
        No locations found in your Google Business Profile account.
      </div>
    );
  }

  const accountGroups = groupByAccount(locations);
  const hasChanges = locations.some(
    (loc) => loc.is_synced !== selectedIds.has(loc.google_location_id),
  );

  return (
    <div className="space-y-4">
      {/* Location groups */}
      {accountGroups.map((group) => (
        <div key={group.account_id} className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            {group.account_name}
          </h4>
          <div className="space-y-2">
            {group.locations.map((location) => {
              const isSelected = selectedIds.has(location.google_location_id);
              return (
                <label
                  key={location.google_location_id}
                  className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-background-secondary cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(location.google_location_id)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {location.name}
                    </p>
                    {location.address ? (
                      <p className="text-sm text-foreground-secondary truncate">
                        {location.address}
                      </p>
                    ) : null}
                  </div>
                  {location.is_synced ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Synced
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save button and status */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          aria-busy={isSaving}
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Locations"}
        </button>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : successMessage ? (
          <p className="text-sm text-green-600">{successMessage}</p>
        ) : !hasChanges ? (
          <p className="text-sm text-foreground-secondary">
            No changes to save
          </p>
        ) : null}
      </div>
    </div>
  );
}
