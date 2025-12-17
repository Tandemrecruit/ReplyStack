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
});


