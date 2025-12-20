import { render, screen } from "@testing-library/react";

import ResetPasswordPage, { metadata } from "@/app/(auth)/reset-password/page";

// Mock the ResetPasswordForm component
vi.mock("@/components/auth/reset-password-form", () => ({
  ResetPasswordForm: () => (
    <div data-testid="reset-password-form">ResetPasswordForm</div>
  ),
}));

describe("app/(auth)/reset-password/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Reset Password | ReplyStack");
    expect(metadata.description).toBe("Reset your ReplyStack password");
  });

  it("renders the page heading", () => {
    render(<ResetPasswordPage />);
    expect(
      screen.getByRole("heading", { name: "Reset password" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<ResetPasswordPage />);
    expect(
      screen.getByText(/Enter your email and we'll send you a reset link/i),
    ).toBeInTheDocument();
  });

  it("renders the ResetPasswordForm component", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });
});
