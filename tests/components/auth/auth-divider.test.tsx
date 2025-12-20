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
    const { container } = render(<AuthDivider />);

    const divider = container.querySelector(".border-t");
    expect(divider).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(<AuthDivider />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("relative", "my-6");
  });
});
