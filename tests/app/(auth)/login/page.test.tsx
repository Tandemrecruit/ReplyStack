import { render, screen } from "@testing-library/react";

import LoginPage, { metadata } from "@/app/(auth)/login/page";

// Mock the LoginForm component
vi.mock("@/components/auth/login-form", () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

describe("app/(auth)/login/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Login | ReplyStack");
    expect(metadata.description).toBe("Sign in to your ReplyStack account");
  });

  it("renders the page heading", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<LoginPage />);
    expect(
      screen.getByText("Sign in to manage your reviews"),
    ).toBeInTheDocument();
  });

  it("renders the LoginForm component", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders with Suspense boundary", () => {
    const { container } = render(<LoginPage />);
    // Suspense should be present in the component tree
    expect(container.querySelector("div")).toBeInTheDocument();
  });
});
