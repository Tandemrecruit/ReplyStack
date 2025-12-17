import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    default: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

import { LiveDemo } from "@/components/landing/live-demo";

describe("components/landing/LiveDemo", () => {
  it("updates the draft when the tone changes", async () => {
    const user = userEvent.setup();
    render(<LiveDemo />);

    expect(screen.getByText(/Draft reply \(Warm tone\)/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Direct" }));
    expect(screen.getByText(/Draft reply \(Direct tone\)/)).toBeTruthy();
  });

  it("updates review text and draft when switching samples", async () => {
    const user = userEvent.setup();
    render(<LiveDemo />);

    const textarea = screen.getByLabelText("Review text");
    await user.clear(textarea);
    await user.type(textarea, "Parking was tricky but booking was easy.");

    expect(screen.getByText(/Parking can/i)).toBeTruthy();
    expect(screen.getByText(/online booking was easy/i)).toBeTruthy();

    await user.selectOptions(
      screen.getByLabelText("Choose a sample review"),
      "dental-negative",
    );

    expect((textarea as HTMLTextAreaElement).value).toContain(
      "waited 40 minutes",
    );
  });
});


