import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Input } from "@/components/ui/input";

describe("components/ui/Input", () => {
  it("renders with label", () => {
    render(<Input name="email" label="Email address" />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("renders without label", () => {
    render(<Input name="email" placeholder="Enter email" />);

    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("renders error state with aria-invalid", () => {
    render(<Input name="email" label="Email" error="Invalid email" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });

  it("links error message via aria-describedby", () => {
    render(<Input name="email" label="Email" error="Invalid email" />);

    const input = screen.getByLabelText("Email");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toContain("email-error");

    const errorElement = document.getElementById(errorId ?? "");
    expect(errorElement).toHaveTextContent("Invalid email");
  });

  it("renders help text", () => {
    render(
      <Input
        name="email"
        label="Email"
        helpText="We'll never share your email"
      />,
    );

    expect(
      screen.getByText("We'll never share your email"),
    ).toBeInTheDocument();
  });

  it("applies error styling when error is present", () => {
    render(<Input name="email" label="Email" error="Required" />);

    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("border-red-500");
  });

  it("applies normal border when no error", () => {
    render(<Input name="email" label="Email" />);

    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("border-border");
    expect(input.className).not.toContain("border-red-500");
  });

  it("passes through HTML input attributes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="test@example.com"
        required
        autoComplete="email"
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "test@example.com");
    expect(input).toHaveAttribute("autocomplete", "email");

    await user.type(input, "a");
    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Input name="email" label="Email" disabled />);

    const input = screen.getByLabelText("Email");
    expect(input).toBeDisabled();
  });

  it("uses name as id when id is not provided", () => {
    render(<Input name="email" label="Email" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("uses provided id over name", () => {
    render(<Input id="custom-id" name="email" label="Email" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "custom-id");
  });
});
