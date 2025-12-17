import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VoiceEditor } from "@/components/voice-profile/voice-editor";

describe("components/voice-profile/VoiceEditor", () => {
  it("submits updated form data via onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /Professional/ }));
    await user.type(
      screen.getByLabelText("Personality Notes"),
      "Short and direct.",
    );
    await user.type(screen.getByLabelText("Sign-off Style"), "— Ryan, Owner");

    await user.click(screen.getByRole("button", { name: "Save Voice Profile" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "professional",
        personality_notes: "Short and direct.",
        sign_off_style: "— Ryan, Owner",
      }),
    );
  });

  it("renders provided max_length value", () => {
    render(
      <VoiceEditor
        profile={{ tone: "professional", max_length: 200 }}
        onSave={vi.fn()}
      />,
    );

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    expect(maxInput.value).toBe("200");
  });

  it("saves updated max_length as a number", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    await user.clear(maxInput);
    await user.type(maxInput, "275");

    await user.click(screen.getByRole("button", { name: "Save Voice Profile" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 275,
      }),
    );
  });

  it("handles empty max_length input", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    await user.clear(maxInput);

    await user.click(screen.getByRole("button", { name: "Save Voice Profile" }));

    const payload = onSave.mock.calls[0][0];
    expect(Number.isNaN(payload.max_length as number)).toBe(true);
  });

  it("accepts min boundary value for max_length", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    await user.clear(maxInput);
    await user.type(maxInput, "50");

    await user.click(screen.getByRole("button", { name: "Save Voice Profile" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 50,
      }),
    );
  });

  it("accepts max boundary value for max_length", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    await user.clear(maxInput);
    await user.type(maxInput, "500");

    await user.click(screen.getByRole("button", { name: "Save Voice Profile" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 500,
      }),
    );
  });
});


