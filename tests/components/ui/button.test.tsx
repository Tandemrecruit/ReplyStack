import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

describe("components/ui/Button", () => {
  it("renders button with children", () => {
    render(<Button>Click me</Button>);

    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Button>Primary</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-primary-600");
  });

  it("applies secondary variant", () => {
    const { container } = render(
      <Button variant="secondary">Secondary</Button>,
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-surface");
    expect(button?.className).toContain("border");
  });

  it("applies ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("text-foreground-secondary");
  });

  it("applies danger variant", () => {
    const { container } = render(<Button variant="danger">Danger</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-error");
  });

  it("applies small size", () => {
    const { container } = render(<Button size="sm">Small</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("px-3");
    expect(button?.className).toContain("py-1.5");
    expect(button?.className).toContain("text-sm");
  });

  it("applies medium size by default", () => {
    const { container } = render(<Button>Medium</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("px-4");
    expect(button?.className).toContain("py-2");
    expect(button?.className).toContain("text-sm");
  });

  it("applies large size", () => {
    const { container } = render(<Button size="lg">Large</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("px-6");
    expect(button?.className).toContain("py-3");
    expect(button?.className).toContain("text-base");
  });

  it("shows loading spinner when isLoading is true", () => {
    const { container } = render(<Button isLoading>Loading</Button>);

    const svg = container.querySelector("svg.animate-spin");
    expect(svg).toBeInTheDocument();
  });

  it("disables button when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>,
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("custom-class");
  });

  it("passes through other button props", () => {
    render(
      <Button type="submit" aria-label="Submit form">
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Submit form" });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("applies disabled styling when disabled", () => {
    const { container } = render(<Button disabled>Disabled</Button>);

    const button = container.querySelector("button");
    expect(button?.className).toContain("disabled:opacity-50");
    expect(button?.className).toContain("disabled:cursor-not-allowed");
  });
});
