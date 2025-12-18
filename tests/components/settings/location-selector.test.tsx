import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocationSelector } from "@/components/settings/location-selector";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("components/settings/LocationSelector", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows loading state initially", () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves to keep loading state
        }),
    );

    render(<LocationSelector />);

    expect(screen.getByText("Loading locations...")).toBeInTheDocument();
  });

  it("fetches and displays locations grouped by account", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
            account_name: "Account 1",
            is_synced: true,
          },
          {
            google_account_id: "acc-1",
            google_location_id: "loc-2",
            name: "Location 2",
            address: "456 Oak Ave",
            account_name: "Account 1",
            is_synced: false,
          },
          {
            google_account_id: "acc-2",
            google_location_id: "loc-3",
            name: "Location 3",
            address: "789 Pine Rd",
            account_name: "Account 2",
            is_synced: false,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Account 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Location 1")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Location 2")).toBeInTheDocument();
    expect(screen.getByText("456 Oak Ave")).toBeInTheDocument();
    expect(screen.getByText("Account 2")).toBeInTheDocument();
    expect(screen.getByText("Location 3")).toBeInTheDocument();
    expect(screen.getByText("789 Pine Rd")).toBeInTheDocument();
  });

  it("pre-selects synced locations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
            account_name: "Account 1",
            is_synced: true,
          },
          {
            google_account_id: "acc-1",
            google_location_id: "loc-2",
            name: "Location 2",
            address: "456 Oak Ave",
            account_name: "Account 1",
            is_synced: false,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    const checkbox1 = screen.getByRole("checkbox", { name: /Location 1/i });
    const checkbox2 = screen.getByRole("checkbox", { name: /Location 2/i });
    expect(checkbox1).toBeChecked(); // loc-1 is synced
    expect(checkbox2).not.toBeChecked(); // loc-2 is not synced
  });

  it("shows synced badge for synced locations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
            account_name: "Account 1",
            is_synced: true,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Synced")).toBeInTheDocument();
    });
  });

  it("allows toggling location selection", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
            account_name: "Account 1",
            is_synced: false,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("saves selected locations successfully", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locations: [
            {
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              address: "123 Main St",
              account_name: "Account 1",
              is_synced: false,
            },
            {
              google_account_id: "acc-1",
              google_location_id: "loc-2",
              name: "Location 2",
              address: "456 Oak Ave",
              account_name: "Account 1",
              is_synced: false,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          saved: 2,
        }),
      });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    const checkbox1 = screen.getByRole("checkbox", { name: /Location 1/i });
    const checkbox2 = screen.getByRole("checkbox", { name: /Location 2/i });
    await user.click(checkbox1); // Select loc-1
    await user.click(checkbox2); // Select loc-2

    const saveButton = screen.getByRole("button", { name: "Save Locations" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("2 location(s) saved successfully."),
      ).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
          },
          {
            google_account_id: "acc-1",
            google_location_id: "loc-2",
            name: "Location 2",
            address: "456 Oak Ave",
          },
        ],
      }),
    });
  });

  it("shows error when Google account not connected", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Google account not connected",
        code: "GOOGLE_NOT_CONNECTED",
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Connect your Google account above to select locations.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows error when Google auth expires", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Google authentication expired",
        code: "GOOGLE_AUTH_EXPIRED",
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Your Google connection has expired. Please reconnect.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: "Failed to fetch locations",
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch locations")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("allows retry after fetch error", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Failed to fetch locations",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locations: [
            {
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              address: "123 Main St",
              account_name: "Account 1",
              is_synced: false,
            },
          ],
        }),
      });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch locations")).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: "Try again" });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });
  });

  it("shows error when save fails", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locations: [
            {
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              address: "123 Main St",
              account_name: "Account 1",
              is_synced: false,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Failed to save locations",
        }),
      });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    const saveButton = screen.getByRole("button", { name: "Save Locations" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to save locations")).toBeInTheDocument();
    });
  });

  it("shows 'No changes to save' when no changes made", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
            account_name: "Account 1",
            is_synced: true,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("No changes to save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: "Save Locations" });
    expect(saveButton).toBeDisabled();
  });

  it("shows empty state when no locations found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No locations found in your Google Business Profile account.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("disables save button while saving", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locations: [
            {
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              address: "123 Main St",
              account_name: "Account 1",
              is_synced: false,
            },
          ],
        }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            // Delay to test loading state
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ saved: 1 }),
                }),
              100,
            );
          }),
      );

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    const saveButton = screen.getByRole("button", { name: "Save Locations" });
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("handles locations without address", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "",
            account_name: "Account 1",
            is_synced: false,
          },
        ],
      }),
    });

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText("Location 1")).toBeInTheDocument();
    });

    // Address should not be rendered when empty
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });
});
