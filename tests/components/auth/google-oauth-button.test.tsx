import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

describe("components/auth/GoogleOAuthButton", () => {
  it("renders button with Google icon and text", () => {
    const onClick = vi.fn();
    render(<GoogleOAuthButton onClick={onClick} />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<GoogleOAuthButton onClick={onClick} />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables button when disabled prop is true", () => {
    const onClick = vi.fn();
    render(<GoogleOAuthButton onClick={onClick} disabled />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeDisabled();
  });

  it("disables button when isLoading is true", () => {
    const onClick = vi.fn();
    render(<GoogleOAuthButton onClick={onClick} isLoading />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeDisabled();
  });

  it("applies custom className", () => {
    const onClick = vi.fn();
    const { container } = render(
      <GoogleOAuthButton onClick={onClick} className="custom-class" />,
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("custom-class");
  });

  it("renders Google icon SVG", () => {
    const onClick = vi.fn();
    const { container } = render(<GoogleOAuthButton onClick={onClick} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });
});
