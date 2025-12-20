import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

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
    // Use fireEvent instead of userEvent to bypass HTML5 number input validation,
    // which aligns with the form's noValidate attribute
    fireEvent.change(maxInput, { target: { value: "275" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 275,
      }),
    );
  });

  it("shows validation error and prevents submission when max_length is empty", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    await user.clear(maxInput);

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).not.toHaveBeenCalled();
    const errorMessages = screen.getAllByRole("alert");
    const visibleError = errorMessages.find(
      (el) => el.id === "maxlength-error",
    );
    expect(visibleError).toBeDefined();
    expect(visibleError).toHaveTextContent(
      "Maximum response length must be between 50 and 500 words",
    );
  });

  it("accepts min boundary value for max_length", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "50" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

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
    fireEvent.change(maxInput, { target: { value: "500" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 500,
      }),
    );
  });

  it("shows validation error when max_length is below minimum", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "49" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).not.toHaveBeenCalled();
    const errorMessages = screen.getAllByRole("alert");
    const visibleError = errorMessages.find(
      (el) => el.id === "maxlength-error",
    );
    expect(visibleError).toBeDefined();
    expect(visibleError).toHaveTextContent(
      "Maximum response length must be between 50 and 500 words",
    );
  });

  it("shows validation error when max_length is above maximum", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "501" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).not.toHaveBeenCalled();
    const errorMessages = screen.getAllByRole("alert");
    const visibleError = errorMessages.find(
      (el) => el.id === "maxlength-error",
    );
    expect(visibleError).toBeDefined();
    expect(visibleError).toHaveTextContent(
      "Maximum response length must be between 50 and 500 words",
    );
  });

  it("validates max_length on input change", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });
  });

  it("clears validation error when max_length becomes valid", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });

    fireEvent.change(maxInput, { target: { value: "150" } });

    await waitFor(() => {
      // Use queryAllByRole which returns empty array instead of throwing
      const errorMessages = screen.queryAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeUndefined();
    });
  });

  it("handles null max_length value", async () => {
    const _user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <VoiceEditor
        profile={{ tone: "friendly", max_length: null as never }}
        onSave={onSave}
      />,
    );

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    expect(maxInput.value).toBe("150"); // Should use default
  });

  it("handles undefined max_length value", async () => {
    const _user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <VoiceEditor
        profile={{ tone: "friendly", max_length: null }}
        onSave={onSave}
      />,
    );

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    expect(maxInput.value).toBe("150"); // Should use default
  });

  it("handles NaN max_length value", async () => {
    const _user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <VoiceEditor
        profile={{ tone: "friendly", max_length: NaN }}
        onSave={onSave}
      />,
    );

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    expect(maxInput.value).toBe(""); // Should show empty for NaN
  });

  it("renders all tone options", () => {
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Friendly/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Professional/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Casual/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Formal/i })).toBeInTheDocument();
  });

  it("highlights selected tone option", () => {
    render(<VoiceEditor profile={{ tone: "professional" }} onSave={vi.fn()} />);

    const professionalButton = screen.getByRole("button", {
      name: /Professional/i,
    });
    expect(professionalButton.className).toContain("border-primary-500");
    expect(professionalButton.className).toContain("bg-primary-50");
  });

  it("updates tone when clicking different option", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /Casual/i }));

    await user.type(screen.getByLabelText("Personality Notes"), "Test notes");
    await user.type(screen.getByLabelText("Sign-off Style"), "— Test");

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "casual",
      }),
    );
  });

  it("renders with initial profile values", () => {
    render(
      <VoiceEditor
        profile={{
          tone: "professional",
          personality_notes: "Initial notes",
          sign_off_style: "— Initial",
          max_length: 200,
        }}
        onSave={vi.fn()}
      />,
    );

    expect(
      (screen.getByLabelText("Personality Notes") as HTMLTextAreaElement).value,
    ).toBe("Initial notes");
    expect(
      (screen.getByLabelText("Sign-off Style") as HTMLInputElement).value,
    ).toBe("— Initial");
    expect(
      (screen.getByLabelText("Maximum Response Length") as HTMLInputElement)
        .value,
    ).toBe("200");
  });

  it("uses default tone when profile tone is missing", () => {
    render(<VoiceEditor profile={{}} onSave={vi.fn()} />);

    const friendlyButton = screen.getByRole("button", { name: /Friendly/i });
    expect(friendlyButton.className).toContain("border-primary-500");
  });

  it("uses default max_length when profile max_length is missing", () => {
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    expect(maxInput.value).toBe("150");
  });

  it("handles empty personality notes", () => {
    render(
      <VoiceEditor
        profile={{ tone: "friendly", personality_notes: "" }}
        onSave={vi.fn()}
      />,
    );

    expect(
      (screen.getByLabelText("Personality Notes") as HTMLTextAreaElement).value,
    ).toBe("");
  });

  it("handles empty sign-off style", () => {
    render(
      <VoiceEditor
        profile={{ tone: "friendly", sign_off_style: "" }}
        onSave={vi.fn()}
      />,
    );

    expect(
      (screen.getByLabelText("Sign-off Style") as HTMLInputElement).value,
    ).toBe("");
  });

  it("prevents submission when max_length validation fails", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "25" } });

    await user.type(screen.getByLabelText("Personality Notes"), "Test notes");
    await user.type(screen.getByLabelText("Sign-off Style"), "— Test");

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).not.toHaveBeenCalled();
  });

  it("handles invalid number input for max_length", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    // Simulate invalid input that would result in NaN
    fireEvent.change(maxInput, { target: { value: "abc" } });

    // Should show empty value for invalid input
    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });
  });

  it("handles empty string input for max_length", async () => {
    const user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    await user.clear(maxInput);

    await waitFor(() => {
      expect(maxInput.value).toBe("");
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });
  });

  it("converts string max_length to number on save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "175" } });

    await user.type(screen.getByLabelText("Personality Notes"), "Test notes");
    await user.type(screen.getByLabelText("Sign-off Style"), "— Test");

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 175, // Should be number, not string
      }),
    );
  });

  it("sets aria-invalid when max_length has error", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      expect(maxInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("sets aria-describedby when max_length has error", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      expect(maxInput).toHaveAttribute("aria-describedby", "maxlength-error");
    });
  });

  it("removes aria-describedby when max_length error is cleared", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      expect(maxInput).toHaveAttribute("aria-describedby", "maxlength-error");
    });

    fireEvent.change(maxInput, { target: { value: "150" } });

    await waitFor(() => {
      expect(maxInput).not.toHaveAttribute("aria-describedby");
    });
  });
});
