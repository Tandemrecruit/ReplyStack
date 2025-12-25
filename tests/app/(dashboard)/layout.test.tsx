import { render, screen } from "@testing-library/react";

import DashboardLayout from "@/app/(dashboard)/layout";

describe("app/(dashboard)/layout", () => {
  it("renders children content", () => {
    render(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders navigation bar", () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("renders logo link", () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    const logoLink = screen.getByRole("link", { name: "Replily" });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/dashboard");
  });

  it("renders navigation links", () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    expect(screen.getByRole("link", { name: "Reviews" })).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "Billing" })).toHaveAttribute(
      "href",
      "/billing",
    );
  });

  it("renders user menu placeholder", () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("applies layout styling", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    expect(outerDiv).toHaveAttribute("class");
  });

  it("renders main content area", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("class");
  });

  it("matches layout snapshot", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
