import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe("components/auth/ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeInTheDocument();
  });

  it("renders link to login", () => {
    render(<ResetPasswordForm />);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "notanemail");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("calls resetPasswordForEmail with correct email", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo: expect.stringContaining("/update-password"),
        },
      );
    });
  });

  it("shows success message on successful submission", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(
        screen.getByText(/check your email for a password reset link/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /back to login/i }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows error message when reset fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User not found");
    });
  });

  it("shows generic error message on unexpected error", async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An unexpected error occurred. Please try again.",
      );
    });
  });

  it("disables inputs during submission", async () => {
    let resolvePromise!: (value: { error: null }) => void;
    const submissionPromise = new Promise<{ error: null }>((resolve) => {
      resolvePromise = resolve;
    });

    mockResetPasswordForEmail.mockImplementation(() => submissionPromise);

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Email address")).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Send reset link" }),
      ).toBeDisabled();
    });

    resolvePromise({ error: null });

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("trims email before submission", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(
      screen.getByLabelText("Email address"),
      "  test@example.com  ",
    );
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(Object),
      );
    });
  });
});
