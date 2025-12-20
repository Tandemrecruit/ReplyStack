import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

// Mock Supabase client
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

// Mock next/navigation
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("components/auth/UpdatePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password and confirm password inputs", () => {
    render(<UpdatePasswordForm />);

    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("renders password requirements list", () => {
    render(<UpdatePasswordForm />);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<UpdatePasswordForm />);

    expect(
      screen.getByRole("button", { name: "Update password" }),
    ).toBeInTheDocument();
  });

  it("renders link to login", () => {
    render(<UpdatePasswordForm />);

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password456!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with correct password on valid submission", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "Password123!",
      });
    });
  });

  it("shows success message and redirects to login", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(
        screen.getByText(/password updated successfully/i),
      ).toBeInTheDocument();
    });

    // Wait for redirect (component uses setTimeout with 2000ms delay)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      },
      { timeout: 3000 },
    );
  });

  it("shows error message when update fails", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password too weak" },
    });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Password too weak",
        );
      },
      { timeout: 3000 },
    );
  });

  it("shows generic error message on unexpected error", async () => {
    mockUpdateUser.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "An unexpected error occurred. Please try again.",
        );
      },
      { timeout: 3000 },
    );
  });

  it("disables inputs during submission", async () => {
    let resolvePromise!: (value: { error: null }) => void;
    const submissionPromise = new Promise<{ error: null }>((resolve) => {
      resolvePromise = resolve;
    });

    mockUpdateUser.mockImplementation(() => submissionPromise);

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(
      () => {
        expect(screen.getByLabelText("New password")).toBeDisabled();
        expect(screen.getByLabelText("Confirm new password")).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Update password" }),
        ).toBeDisabled();
      },
      { timeout: 3000 },
    );

    resolvePromise({ error: null });

    await waitFor(
      () => {
        expect(
          screen.getByText(/password updated successfully/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("shows validation error for empty confirm password", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows validation error for password exactly 7 characters", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Pass123");
    await user.type(screen.getByLabelText("Confirm new password"), "Pass123");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("accepts password with exactly 8 characters", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Pass123!");
    await user.type(screen.getByLabelText("Confirm new password"), "Pass123!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "Pass123!",
      });
    });
  });

  it("clears field errors on new submission attempt", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // Trigger validation error
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Fill in valid data
    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );

    mockUpdateUser.mockResolvedValue({ error: null });
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(
        screen.queryByText(/password is required/i),
      ).not.toBeInTheDocument();
    });
  });

  it("clears status error on new submission attempt", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password too weak" },
    });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Password too weak");
    });

    // Clear error and try again
    mockUpdateUser.mockResolvedValue({ error: null });
    await user.clear(screen.getByLabelText("New password"));
    await user.type(
      screen.getByLabelText("New password"),
      "StrongerPassword123!",
    );
    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "StrongerPassword123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(screen.queryByText("Password too weak")).not.toBeInTheDocument();
    });
  });

  it("renders success state with checkmark icon", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(
        screen.getByText(/password updated successfully/i),
      ).toBeInTheDocument();
      // Check for success icon (checkmark)
      const icon = screen.getByRole("img", { hidden: true });
      expect(icon).toBeInTheDocument();
    });
  });

  it("does not redirect immediately after success", async () => {
    vi.useFakeTimers();
    mockUpdateUser.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "Password123!");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(
        screen.getByText(/password updated successfully/i),
      ).toBeInTheDocument();
    });

    // Should not redirect immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward time by 2000ms
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    vi.useRealTimers();
  });

  it("clears timeout on unmount", () => {
    vi.useFakeTimers();
    mockUpdateUser.mockResolvedValue({ error: null });

    const { unmount } = render(<UpdatePasswordForm />);

    // Trigger success state
    const user = userEvent.setup();
    user.type(screen.getByLabelText("New password"), "Password123!");
    user.type(screen.getByLabelText("Confirm new password"), "Password123!");
    user.click(screen.getByRole("button", { name: "Update password" }));

    // Unmount before timeout completes
    unmount();

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    // Should not redirect after unmount
    expect(mockPush).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
