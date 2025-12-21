import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsClient } from "@/app/(dashboard)/settings/settings-client";

// Mock child components
vi.mock("@/components/settings/google-connect-button", () => ({
  GoogleConnectButton: () => (
    <div data-testid="google-connect-button">GoogleConnectButton</div>
  ),
}));

vi.mock("@/components/settings/location-selector", () => ({
  LocationSelector: () => (
    <div data-testid="location-selector">LocationSelector</div>
  ),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("app/(dashboard)/settings/settings-client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial render", () => {
    it("renders page header", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });

      render(<SettingsClient />);
      expect(
        screen.getByRole("heading", { name: "Settings" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Manage your account, voice profile, and integrations",
        ),
      ).toBeInTheDocument();
    });

    it("renders Google Business Profile section", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });

      render(<SettingsClient />);
      expect(
        screen.getByRole("heading", { name: "Google Business Profile" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("google-connect-button")).toBeInTheDocument();
    });

    it("renders Connected Locations section", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });

      render(<SettingsClient />);
      expect(
        screen.getByRole("heading", { name: "Connected Locations" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("location-selector")).toBeInTheDocument();
    });

    it("renders Voice Profile section", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });

      render(<SettingsClient />);
      expect(
        screen.getByRole("heading", { name: "Voice Profile" }),
      ).toBeInTheDocument();
    });

    it("renders Notifications section", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });

      render(<SettingsClient />);
      expect(
        screen.getByRole("heading", { name: "Notifications" }),
      ).toBeInTheDocument();
    });
  });

  describe("Notification preferences loading", () => {
    it("loads notification preferences on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: false }),
      });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/notifications");
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    it("handles notification preference fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<SettingsClient />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to load notification preferences",
          expect.any(Error),
        );
      });

      // Should still render with default value
      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("handles invalid notification preference response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: "invalid" }),
      });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should use default value when response is invalid
      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("handles notification preference fetch with non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should use default value
      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("Email notifications toggle", () => {
    it("toggles email notifications from true to false", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: false }),
        });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailNotifications: false }),
        });
      });

      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    it("toggles email notifications from false to true", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toHaveAttribute(
          "aria-checked",
          "false",
        );
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      await user.click(toggle);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailNotifications: true }),
        });
      });

      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("reverts toggle on update error", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Update failed" }),
        });

      render(<SettingsClient />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      await user.click(toggle);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to update email notifications/i),
        ).toBeInTheDocument();
      });

      // Should revert to original value
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update email notifications",
        expect.any(Error),
      );
    });

    it("handles network error when toggling notifications", async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      render(<SettingsClient />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      await user.click(toggle);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to update email notifications/i),
        ).toBeInTheDocument();
      });

      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("disables toggle while updating", async () => {
      const user = userEvent.setup();
      let resolveUpdate: ((value: Response) => void) | undefined;
      const updatePromise = new Promise<Response>((resolve) => {
        resolveUpdate = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockReturnValueOnce(updatePromise);

      render(<SettingsClient />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      });

      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      await user.click(toggle);

      // Toggle should be disabled while updating
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveAttribute("aria-busy", "true");

      // Resolve the update
      resolveUpdate?.({
        ok: true,
        json: async () => ({ emailNotifications: false }),
      } as Response);

      await waitFor(() => {
        expect(toggle).not.toBeDisabled();
      });
    });

    it("disables toggle while loading initial preferences", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves
          }),
      );

      render(<SettingsClient />);
      const toggle = screen.getByRole("switch", {
        name: "Email notifications",
      });
      expect(toggle).toBeDisabled();
    });
  });

  describe("Voice profile form", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });
    });

    it("renders tone selector with default value", () => {
      render(<SettingsClient />);
      const toneSelect = screen.getByLabelText("Tone");
      expect(toneSelect).toHaveValue("warm");
    });

    it("renders personality notes textarea", () => {
      render(<SettingsClient />);
      const notesTextarea = screen.getByLabelText("Personality Notes");
      expect(notesTextarea).toBeInTheDocument();
      expect(notesTextarea).toHaveValue("");
    });

    it("renders sign-off input", () => {
      render(<SettingsClient />);
      const signOffInput = screen.getByLabelText("Sign-off Style");
      expect(signOffInput).toBeInTheDocument();
      expect(signOffInput).toHaveValue("");
    });

    it("updates tone when selected", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const toneSelect = screen.getByLabelText("Tone");
      await user.selectOptions(toneSelect, "professional");

      expect(toneSelect).toHaveValue("professional");
    });

    it("updates personality notes when typed", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family-owned since 1985");

      expect(notesTextarea).toHaveValue("Family-owned since 1985");
    });

    it("updates sign-off when typed", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      expect(signOffInput).toHaveValue("— John, Owner");
    });
  });

  describe("Voice profile validation", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });
    });

    // Note: "shows error when tone is not selected" test removed
    // The component always has a default tone of "warm" so tone can never be empty

    it("shows error when personality notes are empty", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      expect(screen.getByText("Add personality details")).toBeInTheDocument();
    });

    it("shows error when personality notes are only whitespace", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "   ");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      expect(screen.getByText("Add personality details")).toBeInTheDocument();
    });

    it("shows error when sign-off is empty", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      expect(screen.getByText("Add a sign-off style")).toBeInTheDocument();
    });

    it("shows error when sign-off is only whitespace", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "   ");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      expect(screen.getByText("Add a sign-off style")).toBeInTheDocument();
    });

    it("shows all validation errors at once", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      // Tone is always "warm" by default, so no tone error
      expect(screen.getByText("Add personality details")).toBeInTheDocument();
      expect(screen.getByText("Add a sign-off style")).toBeInTheDocument();
      expect(
        screen.getByText("Please complete all required voice profile fields."),
      ).toBeInTheDocument();
    });

    it("clears field errors when form is valid", async () => {
      const user = userEvent.setup();
      render(<SettingsClient />);

      // Trigger validation errors
      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      expect(screen.getByText("Add personality details")).toBeInTheDocument();

      // Fill in valid data
      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John");

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Add personality details"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Voice profile submission", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });
    });

    it("saves voice profile successfully", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/voice-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone: "warm",
            personality_notes: "Family restaurant",
            sign_off_style: "— John, Owner",
          }),
        });
      });

      expect(
        screen.getByText("Voice profile saved successfully."),
      ).toBeInTheDocument();
    });

    it("trims whitespace from personality notes and sign-off", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "  Family restaurant  ");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "  — John, Owner  ");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/voice-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone: "warm",
            personality_notes: "Family restaurant",
            sign_off_style: "— John, Owner",
          }),
        });
      });
    });

    it("shows error message when save fails", async () => {
      const user = userEvent.setup();
      // First mock for notification fetch, second for save
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Database error" }),
        });

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Database error")).toBeInTheDocument();
      });
    });

    it("shows default error message when save fails without error", async () => {
      const user = userEvent.setup();
      // First mock for notification fetch, second for save
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        });

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save voice profile."),
        ).toBeInTheDocument();
      });
    });

    it("handles network error when saving", async () => {
      const user = userEvent.setup();
      // First mock for notification fetch, second rejects for save
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Unable to save voice profile. Please try again."),
        ).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith(
        "Error saving voice profile",
        expect.any(Error),
      );
    });

    it("handles invalid JSON response when saving", async () => {
      const user = userEvent.setup();
      // First mock for notification fetch, second for save with invalid JSON
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save voice profile."),
        ).toBeInTheDocument();
      });
    });

    it("disables save button while saving", async () => {
      const user = userEvent.setup();
      let resolveSave: ((value: Response) => void) | undefined;
      const savePromise = new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });

      // First mock for notification fetch, then pending promise for save
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockReturnValueOnce(savePromise);

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      // Button should be disabled and show "Saving..."
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent("Saving...");
      expect(saveButton).toHaveAttribute("aria-busy", "true");

      // Resolve the save
      resolveSave?.({
        ok: true,
        json: async () => ({}),
      } as Response);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent("Save Changes");
      });
    });

    it("clears status message on new save attempt", async () => {
      const user = userEvent.setup();
      let resolveSecondSave: ((value: Response) => void) | undefined;
      const secondSavePromise = new Promise<Response>((resolve) => {
        resolveSecondSave = resolve;
      });

      // First mock for notification fetch, first save success, second save pending
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ emailNotifications: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockReturnValueOnce(secondSavePromise);

      render(<SettingsClient />);

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Voice profile saved successfully."),
        ).toBeInTheDocument();
      });

      // Clear and save again
      await user.clear(notesTextarea);
      await user.type(notesTextarea, "Updated notes");
      await user.click(saveButton);

      // Status should be cleared during save (while promise is pending)
      expect(
        screen.queryByText("Voice profile saved successfully."),
      ).not.toBeInTheDocument();

      // Resolve the second save
      resolveSecondSave?.({
        ok: true,
        json: async () => ({}),
      } as Response);

      await waitFor(() => {
        expect(
          screen.getByText("Voice profile saved successfully."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Tone options", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ emailNotifications: true }),
      });
    });

    it("renders all tone options", () => {
      render(<SettingsClient />);
      const _toneSelect = screen.getByLabelText("Tone");

      expect(
        screen.getByRole("option", { name: "Friendly" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Professional" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Casual" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Warm" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Direct" }),
      ).toBeInTheDocument();
    });

    it("saves selected tone value", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<SettingsClient />);

      const toneSelect = screen.getByLabelText("Tone");
      await user.selectOptions(toneSelect, "professional");

      const notesTextarea = screen.getByLabelText("Personality Notes");
      await user.type(notesTextarea, "Family restaurant");

      const signOffInput = screen.getByLabelText("Sign-off Style");
      await user.type(signOffInput, "— John, Owner");

      const saveButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/voice-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone: "professional",
            personality_notes: "Family restaurant",
            sign_off_style: "— John, Owner",
          }),
        });
      });
    });
  });
});
