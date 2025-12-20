import { render, screen } from "@testing-library/react";

import VerifyEmailPage, { metadata } from "@/app/(auth)/verify-email/page";

describe("app/(auth)/verify-email/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Verify Email | ReplyStack");
    expect(metadata.description).toBe(
      "Check your email to verify your account",
    );
  });

  it("renders the page heading", () => {
    render(<VerifyEmailPage />);
    expect(
      screen.getByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<VerifyEmailPage />);
    expect(
      screen.getByText(/We've sent a verification link to your email address/i),
    ).toBeInTheDocument();
  });

  it("renders the email icon with accessible label", () => {
    render(<VerifyEmailPage />);
    const icon = screen.getByRole("img", { name: "Email icon" });
    expect(icon).toBeInTheDocument();
  });

  it("renders verification instructions", () => {
    render(<VerifyEmailPage />);
    expect(
      screen.getByText(
        /Click the link in the email to verify your account and access your dashboard/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders expiration notice", () => {
    render(<VerifyEmailPage />);
    expect(
      screen.getByText("The link will expire in 24 hours."),
    ).toBeInTheDocument();
  });

  it("renders link to try again", () => {
    render(<VerifyEmailPage />);
    const tryAgainLink = screen.getByRole("link", {
      name: /try again with a different email/i,
    });
    expect(tryAgainLink).toHaveAttribute("href", "/signup");
  });

  it("renders back to login link", () => {
    render(<VerifyEmailPage />);
    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("renders spam folder reminder", () => {
    render(<VerifyEmailPage />);
    expect(
      screen.getByText(/Didn't receive the email\? Check your spam folder/i),
    ).toBeInTheDocument();
  });
});
