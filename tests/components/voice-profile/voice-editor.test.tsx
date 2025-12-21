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
    expect(screen.getByRole("button", { name: /Warm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Direct/i })).toBeInTheDocument();
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

    const warmButton = screen.getByRole("button", { name: /Warm/i });
    expect(warmButton.className).toContain("border-primary-500");
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

  it("handles submission when onSave is undefined", async () => {
    const user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} />);

    await user.type(screen.getByLabelText("Personality Notes"), "Test notes");
    await user.type(screen.getByLabelText("Sign-off Style"), "— Test");

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    // Should not throw error when onSave is undefined
    expect(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    ).toBeInTheDocument();
  });

  it("handles initial max_length with validation error", () => {
    render(
      <VoiceEditor
        profile={{ tone: "friendly", max_length: 30 }}
        onSave={vi.fn()}
      />,
    );

    const errorMessages = screen.getAllByRole("alert");
    const visibleError = errorMessages.find(
      (el) => el.id === "maxlength-error",
    );
    expect(visibleError).toBeDefined();
    expect(visibleError).toHaveTextContent(
      "Maximum response length must be between 50 and 500 words",
    );
  });

  it("handles initial max_length above maximum with validation error", () => {
    render(
      <VoiceEditor
        profile={{ tone: "friendly", max_length: 600 }}
        onSave={vi.fn()}
      />,
    );

    const errorMessages = screen.getAllByRole("alert");
    const visibleError = errorMessages.find(
      (el) => el.id === "maxlength-error",
    );
    expect(visibleError).toBeDefined();
    expect(visibleError).toHaveTextContent(
      "Maximum response length must be between 50 and 500 words",
    );
  });

  it("validates max_length with null value", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    // Simulate null value
    fireEvent.change(maxInput, { target: { value: null } });

    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });
  });

  it("validates max_length with undefined value", async () => {
    const user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    // Simulate undefined value by clearing
    await user.clear(maxInput);

    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeDefined();
    });
  });

  it("renders ARIA live region with maxLengthError", async () => {
    const _user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    fireEvent.change(maxInput, { target: { value: "30" } });

    await waitFor(() => {
      // ARIA live region is in sr-only div, so we need to query by text content
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      expect(liveRegion).toHaveTextContent(
        "Maximum response length must be between 50 and 500 words",
      );
    });
  });

  it("clears errors state on form submission", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    // First submit with invalid max_length
    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "30" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).not.toHaveBeenCalled();

    // Fix the error and submit again
    fireEvent.change(maxInput, { target: { value: "150" } });

    await waitFor(() => {
      const errorMessages = screen.queryAllByRole("alert");
      const visibleError = errorMessages.find(
        (el) => el.id === "maxlength-error",
      );
      expect(visibleError).toBeUndefined();
    });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalled();
  });

  it("handles form submission with string max_length value", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    // Set max_length as string through input
    fireEvent.change(maxInput, { target: { value: "200" } });

    await user.type(screen.getByLabelText("Personality Notes"), "Test");
    await user.type(screen.getByLabelText("Sign-off Style"), "— Test");

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 200, // Should be converted to number
      }),
    );
  });

  it("handles all tone option descriptions", () => {
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    expect(screen.getByText("Warm and approachable")).toBeInTheDocument();
    expect(screen.getByText("Straightforward and to the point")).toBeInTheDocument();
    expect(screen.getByText("Polished and business-like")).toBeInTheDocument();
    expect(screen.getByText("Conversational and personable")).toBeInTheDocument();
    expect(screen.getByText("Relaxed and informal")).toBeInTheDocument();
  });

  it("handles form submission with all fields filled", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /Professional/i }));
    await user.type(
      screen.getByLabelText("Personality Notes"),
      "Family business since 1985",
    );
    await user.type(screen.getByLabelText("Sign-off Style"), "— John, Owner");
    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;
    fireEvent.change(maxInput, { target: { value: "250" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith({
      tone: "professional",
      personality_notes: "Family business since 1985",
      sign_off_style: "— John, Owner",
      max_length: 250,
    });
  });

  it("handles input change for personality notes", async () => {
    const user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const personalityInput = screen.getByLabelText(
      "Personality Notes",
    ) as HTMLTextAreaElement;

    await user.type(personalityInput, "Test personality");

    expect(personalityInput.value).toBe("Test personality");
  });

  it("handles input change for sign-off style", async () => {
    const user = userEvent.setup();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={vi.fn()} />);

    const signOffInput = screen.getByLabelText(
      "Sign-off Style",
    ) as HTMLInputElement;

    await user.type(signOffInput, "— Test Owner");

    expect(signOffInput.value).toBe("— Test Owner");
  });

  it("handles max_length input with empty string then valid value", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceEditor profile={{ tone: "friendly" }} onSave={onSave} />);

    const maxInput = screen.getByLabelText(
      "Maximum Response Length",
    ) as HTMLInputElement;

    // Clear to empty
    await user.clear(maxInput);

    await waitFor(() => {
      expect(maxInput.value).toBe("");
    });

    // Set to valid value
    fireEvent.change(maxInput, { target: { value: "175" } });

    await user.click(
      screen.getByRole("button", { name: "Save Voice Profile" }),
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        max_length: 175,
      }),
    );
  });
});
