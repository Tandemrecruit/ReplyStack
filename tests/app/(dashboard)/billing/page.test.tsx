import { render, screen } from "@testing-library/react";

import BillingPage, { metadata } from "@/app/(dashboard)/billing/page";

describe("app/(dashboard)/billing/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Billing | ReplyStack");
    expect(metadata.description).toBe("Manage your subscription and billing");
  });

  it("renders the page heading", () => {
    render(<BillingPage />);
    expect(
      screen.getByRole("heading", { name: "Billing" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<BillingPage />);
    expect(
      screen.getByText("Manage your subscription and payment methods"),
    ).toBeInTheDocument();
  });

  it("renders current plan section", () => {
    render(<BillingPage />);
    expect(
      screen.getByRole("heading", { name: "Current Plan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
  });

  it("renders trial expiration notice", () => {
    render(<BillingPage />);
    expect(screen.getByText(/Your free trial ends in/i)).toBeInTheDocument();
    expect(screen.getByText("14 days")).toBeInTheDocument();
  });

  it("renders upgrade section", () => {
    render(<BillingPage />);
    expect(
      screen.getByRole("heading", { name: "Upgrade to Pro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unlock unlimited AI responses and all features"),
    ).toBeInTheDocument();
  });

  it("renders pricing information", () => {
    render(<BillingPage />);
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("renders feature list", () => {
    render(<BillingPage />);
    expect(screen.getByText("Unlimited AI responses")).toBeInTheDocument();
    expect(screen.getByText("1 business location")).toBeInTheDocument();
    expect(screen.getByText("Email notifications")).toBeInTheDocument();
    expect(screen.getByText("Custom voice profile")).toBeInTheDocument();
  });

  it("renders upgrade button", () => {
    render(<BillingPage />);
    expect(
      screen.getByRole("button", { name: "Upgrade Now" }),
    ).toBeInTheDocument();
  });

  it("renders payment history section", () => {
    render(<BillingPage />);
    expect(
      screen.getByRole("heading", { name: "Payment History" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No payments yet")).toBeInTheDocument();
  });
});
