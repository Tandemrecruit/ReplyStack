import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoogleConnectButton } from "@/components/settings/google-connect-button";

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("components/settings/GoogleConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders button with Google icon and text", () => {
    render(<GoogleConnectButton />);

    expect(
      screen.getByRole("button", { name: /connect google account/i }),
    ).toBeInTheDocument();
  });

  it("calls signInWithOAuth when clicked", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<GoogleConnectButton />);

    await user.click(
      screen.getByRole("button", { name: /connect google account/i }),
    );

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: expect.objectContaining({
          scopes: "https://www.googleapis.com/auth/business.manage",
          redirectTo: expect.stringContaining("/settings"),
          queryParams: expect.objectContaining({
            access_type: "offline",
            prompt: "consent",
          }),
        }),
      });
    });
  });

  it("shows loading state during OAuth initiation", async () => {
    let resolvePromise!: (value: { error: null }) => void;
    const oauthPromise = new Promise<{ error: null }>((resolve) => {
      resolvePromise = resolve;
    });

    mockSignInWithOAuth.mockImplementation(() => oauthPromise);

    const user = userEvent.setup();
    render(<GoogleConnectButton />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /connect google account/i }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /connecting/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    await act(async () => {
      resolvePromise({ error: null });
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /connect google account/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeEnabled();
      expect(screen.getByRole("button")).not.toHaveAttribute(
        "aria-busy",
        "true",
      );
    });
  });

  it("handles OAuth errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: "OAuth failed" },
    });

    const user = userEvent.setup();
    render(<GoogleConnectButton />);

    await user.click(
      screen.getByRole("button", { name: /connect google account/i }),
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to start Google OAuth",
        "OAuth failed",
      );
    });

    consoleSpy.mockRestore();
  });

  it("handles unexpected errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignInWithOAuth.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<GoogleConnectButton />);

    await user.click(
      screen.getByRole("button", { name: /connect google account/i }),
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Unexpected error starting Google OAuth",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("renders Google icon SVG", () => {
    const { container } = render(<GoogleConnectButton />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });
});
