import { render, screen } from "@testing-library/react";

import { AuthDivider } from "@/components/auth/auth-divider";

describe("components/auth/AuthDivider", () => {
  it("renders with default text", () => {
    render(<AuthDivider />);

    expect(screen.getByText("Or continue with")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<AuthDivider text="Custom divider text" />);

    expect(screen.getByText("Custom divider text")).toBeInTheDocument();
  });

  it("renders divider line", () => {
    render(<AuthDivider />);

    // Test that the divider structure exists using semantic role
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders all structural elements", () => {
    const { container } = render(<AuthDivider />);

    // Verify the component renders without errors
    expect(container.firstChild).toBeTruthy();

    // Verify the text is visible to users
    expect(screen.getByText("Or continue with")).toBeVisible();
  });
});
