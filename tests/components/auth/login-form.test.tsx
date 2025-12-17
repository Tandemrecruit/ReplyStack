import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/components/auth/login-form";

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("components/auth/LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("renders links to signup and forgot password", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(
      screen.getByRole("link", { name: /forgot password/i }),
    ).toHaveAttribute("href", "/reset-password");
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "notanemail");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("calls signInWithPassword with correct credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password1",
      });
    });
  });

  it("redirects to dashboard on successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error for invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "WrongPassword1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password",
      );
    });
  });

  it("shows error for unverified email", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Email not confirmed" },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please verify your email address before signing in",
      );
    });
  });

  it("disables inputs during submission", async () => {
    mockSignInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100),
        ),
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByLabelText("Email address")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("calls signInWithOAuth for Google login", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

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
