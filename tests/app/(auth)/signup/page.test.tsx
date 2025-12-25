import { render, screen } from "@testing-library/react";

import SignupPage, { metadata } from "@/app/(auth)/signup/page";

// Mock the SignupForm component
vi.mock("@/components/auth/signup-form", () => ({
  SignupForm: () => <div data-testid="signup-form">SignupForm</div>,
}));

describe("app/(auth)/signup/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Sign Up | Replily");
    expect(metadata.description).toBe("Create your Replily account");
  });

  it("renders the page heading", () => {
    render(<SignupPage />);
    expect(
      screen.getByRole("heading", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<SignupPage />);
    expect(
      screen.getByText("Start responding to reviews in seconds"),
    ).toBeInTheDocument();
  });

  it("renders the SignupForm component", () => {
    render(<SignupPage />);
    expect(screen.getByTestId("signup-form")).toBeInTheDocument();
  });
});
