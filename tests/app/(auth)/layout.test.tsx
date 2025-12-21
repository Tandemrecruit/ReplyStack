import { render, screen } from "@testing-library/react";

import AuthLayout from "@/app/(auth)/layout";

describe("app/(auth)/layout", () => {
  it("renders children content", () => {
    render(
      <AuthLayout>
        <div data-testid="child-content">Test Content</div>
      </AuthLayout>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies full-height centered layout", () => {
    const { container } = render(
      <AuthLayout>
        <div>Test</div>
      </AuthLayout>,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(
      "min-h-screen",
      "flex",
      "items-center",
      "justify-center",
    );
  });

  it("applies background styling", () => {
    const { container } = render(
      <AuthLayout>
        <div>Test</div>
      </AuthLayout>,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("bg-background");
  });

  it("applies constrained container width", () => {
    const { container } = render(
      <AuthLayout>
        <div>Test</div>
      </AuthLayout>,
    );
    const innerDiv = container.querySelector(".w-full.max-w-md");
    expect(innerDiv).toBeInTheDocument();
    expect(innerDiv).toHaveClass("p-8");
  });

  it("renders multiple children", () => {
    render(
      <AuthLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AuthLayout>,
    );
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
