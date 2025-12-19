import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignupForm } from "@/components/auth/signup-form";

// Mock Supabase client
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
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

describe("components/auth/SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email, password, and confirm password inputs", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("renders create account button", () => {
    render(<SignupForm />);

    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    render(<SignupForm />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("renders password requirements", () => {
    render(<SignupForm />);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one number/i)).toBeInTheDocument();
  });

  it("renders links to login, terms, and privacy", () => {
    render(<SignupForm />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: /terms of service/i }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "weak");
    await user.type(screen.getByLabelText("Confirm password"), "weak");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for password without uppercase", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(/password must contain at least one uppercase letter/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password2");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for password without lowercase", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "PASSWORD1");
    await user.type(screen.getByLabelText("Confirm password"), "PASSWORD1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(/password must contain at least one lowercase letter/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for password without number", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password");
    await user.type(screen.getByLabelText("Confirm password"), "Password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(/password must contain at least one number/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "invalid-email");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with correct data", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password1",
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/callback"),
        }),
      });
    });
  });

  it("redirects to verify-email on successful signup", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/verify-email");
    });
  });

  it("re-enables inputs after submission error", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials",
      );
    });

    expect(screen.getByLabelText("Email address")).not.toBeDisabled();
    expect(screen.getByLabelText("Password")).not.toBeDisabled();
    expect(screen.getByLabelText("Confirm password")).not.toBeDisabled();
  });

  it("shows error when Google OAuth fails", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: "OAuth provider error" },
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "OAuth provider error",
      );
    });
  });

  it("shows error when Google OAuth throws", async () => {
    mockSignInWithOAuth.mockRejectedValue(new Error("network fail"));

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to initiate Google sign-up. Please try again.",
      );
    });
  });

  it("disables inputs while Google OAuth is loading", async () => {
    let resolvePromise: ((value: { error: null }) => void) | undefined;
    const pendingPromise = new Promise<{ error: null }>((resolve) => {
      resolvePromise = resolve;
    });

    mockSignInWithOAuth.mockReturnValue(pendingPromise);

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /continue with google/i }),
      ).toBeDisabled();
      expect(screen.getByLabelText("Email address")).toBeDisabled();
      expect(screen.getByLabelText("Password")).toBeDisabled();
      expect(screen.getByLabelText("Confirm password")).toBeDisabled();
    });

    // Resolve the promise to clean up
    if (resolvePromise) {
      resolvePromise({ error: null });
    }
  });

  it("shows error for already registered email", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "User already registered" },
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(
      screen.getByLabelText("Email address"),
      "existing@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i);
    });
  });

  it("shows error for generic Supabase error", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials",
      );
    });
  });

  it("shows fallback error for unexpected exception", async () => {
    mockSignUp.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An unexpected error occurred. Please try again.",
      );
    });
  });

  it("disables inputs during submission", async () => {
    let resolvePromise: (value: { error: null }) => void;
    const submissionPromise = new Promise<{ error: null }>((resolve) => {
      resolvePromise = resolve;
    });

    mockSignUp.mockImplementation(() => submissionPromise);

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    // Check inputs are disabled during submission
    expect(screen.getByLabelText("Email address")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByLabelText("Confirm password")).toBeDisabled();

    // Resolve the promise to complete submission
    resolvePromise!({ error: null });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("calls signInWithOAuth for Google signup", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/callback"),
        }),
      });
    });
  });
});
