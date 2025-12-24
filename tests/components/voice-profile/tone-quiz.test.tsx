import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToneQuiz } from "@/components/voice-profile/tone-quiz";
import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import type { CustomTone } from "@/lib/types/custom-tone";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("components/voice-profile/ToneQuiz", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial render", () => {
    it("renders quiz header and first question", () => {
      render(<ToneQuiz />);
      expect(
        screen.getByRole("heading", { name: "Tone Quiz" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Answer 10 questions to generate a custom tone for your business",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(QUIZ_QUESTIONS[0]?.text ?? ""),
      ).toBeInTheDocument();
    });

    it("shows progress indicator", () => {
      render(<ToneQuiz />);
      expect(screen.getByText("1 of 10")).toBeInTheDocument();
    });

    it("renders all answer options for first question", () => {
      render(<ToneQuiz />);
      const firstQuestion = QUIZ_QUESTIONS[0];
      if (firstQuestion) {
        for (const answer of firstQuestion.answers) {
          expect(screen.getByText(answer.text)).toBeInTheDocument();
        }
      }
    });

    it("shows 'Select all that apply' for multi-select questions", async () => {
      const user = userEvent.setup();
      // Find a multi-select question
      const multiSelectIndex = QUIZ_QUESTIONS.findIndex((q) => q.allowMultiple);
      if (multiSelectIndex === -1) {
        throw new Error("No multi-select question found in QUIZ_QUESTIONS");
      }

      render(<ToneQuiz />);

      // Navigate to the multi-select question by answering previous questions
      for (let i = 0; i < multiSelectIndex; i++) {
        const answer = screen.getByText(
          QUIZ_QUESTIONS[i]?.answers[0]?.text ?? "",
        );
        await user.click(answer);
        await user.click(screen.getByRole("button", { name: "Next" }));
        await waitFor(() => {
          expect(
            screen.queryByText(QUIZ_QUESTIONS[i]?.text ?? ""),
          ).not.toBeInTheDocument();
        });
      }

      // Assert "Select all that apply" text is visible for multi-select question
      expect(screen.getByText("Select all that apply")).toBeInTheDocument();
    });

    it("renders Back button only when not on first question", () => {
      render(<ToneQuiz />);
      expect(
        screen.queryByRole("button", { name: "Back" }),
      ).not.toBeInTheDocument();
    });

    it("renders Close button when onClose prop provided", () => {
      const onClose = vi.fn();
      render(<ToneQuiz onClose={onClose} />);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("does not render Close button when onClose not provided", () => {
      render(<ToneQuiz />);
      expect(
        screen.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Question navigation", () => {
    it("advances to next question when answer selected and Next clicked", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      const firstAnswer = screen.getByText(
        QUIZ_QUESTIONS[0]?.answers[0]?.text ?? "",
      );
      await user.click(firstAnswer);

      const nextButton = screen.getByRole("button", { name: "Next" });
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[1]?.text ?? ""),
        ).toBeInTheDocument();
      });
      expect(screen.getByText("2 of 10")).toBeInTheDocument();
    });

    it("shows error when trying to advance without selecting answer", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      const nextButton = screen.getByRole("button", { name: "Next" });
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please select at least one answer"),
        ).toBeInTheDocument();
      });
    });

    it("allows going back to previous question", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      // Answer first question and advance
      const firstAnswer = screen.getByText(
        QUIZ_QUESTIONS[0]?.answers[0]?.text ?? "",
      );
      await user.click(firstAnswer);
      await user.click(screen.getByRole("button", { name: "Next" }));

      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[1]?.text ?? ""),
        ).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole("button", { name: "Back" });
      await user.click(backButton);

      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[0]?.text ?? ""),
        ).toBeInTheDocument();
      });
    });

    it("does not allow going back from first question", () => {
      render(<ToneQuiz />);
      expect(
        screen.queryByRole("button", { name: "Back" }),
      ).not.toBeInTheDocument();
    });

    it("preserves answer when navigating back and forth", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      const firstAnswer = screen.getByText(
        QUIZ_QUESTIONS[0]?.answers[0]?.text ?? "",
      );
      await user.click(firstAnswer);
      expect(firstAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "true",
      );

      await user.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[1]?.text ?? ""),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Back" }));
      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[0]?.text ?? ""),
        ).toBeInTheDocument();
      });

      // Answer should still be selected
      expect(firstAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("calls onClose when Close clicked during quiz screen", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ToneQuiz onClose={onClose} />);

      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Answer selection", () => {
    it("allows single answer selection for single-select questions", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      const firstAnswer = screen.getByText(
        QUIZ_QUESTIONS[0]?.answers[0]?.text ?? "",
      );
      const secondAnswer = screen.getByText(
        QUIZ_QUESTIONS[0]?.answers[1]?.text ?? "",
      );

      await user.click(firstAnswer);
      expect(firstAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(secondAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "false",
      );

      await user.click(secondAnswer);
      expect(firstAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "false",
      );
      expect(secondAnswer.closest("button")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("allows multiple answer selection for multi-select questions", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      // Navigate to a multi-select question (question 9)
      for (let i = 0; i < 8; i++) {
        const answer = screen.getByText(
          QUIZ_QUESTIONS[i]?.answers[0]?.text ?? "",
        );
        await user.click(answer);
        await user.click(screen.getByRole("button", { name: "Next" }));
        await waitFor(() => {
          expect(
            screen.queryByText(QUIZ_QUESTIONS[i]?.text ?? ""),
          ).not.toBeInTheDocument();
        });
      }

      // Now on question 9 (multi-select)
      const multiSelectQuestion = QUIZ_QUESTIONS[8];
      if (multiSelectQuestion && multiSelectQuestion.allowMultiple) {
        const firstAnswer = screen.getByText(
          multiSelectQuestion.answers[0]?.text ?? "",
        );
        const secondAnswer = screen.getByText(
          multiSelectQuestion.answers[1]?.text ?? "",
        );

        await user.click(firstAnswer);
        await user.click(secondAnswer);

        expect(firstAnswer.closest("button")).toHaveAttribute(
          "aria-checked",
          "true",
        );
        expect(secondAnswer.closest("button")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      }
    });

    it("allows deselecting answers in multi-select questions", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      // Navigate to a multi-select question
      for (let i = 0; i < 8; i++) {
        const answer = screen.getByText(
          QUIZ_QUESTIONS[i]?.answers[0]?.text ?? "",
        );
        await user.click(answer);
        await user.click(screen.getByRole("button", { name: "Next" }));
        await waitFor(() => {
          expect(
            screen.queryByText(QUIZ_QUESTIONS[i]?.text ?? ""),
          ).not.toBeInTheDocument();
        });
      }

      const multiSelectQuestion = QUIZ_QUESTIONS[8];
      if (multiSelectQuestion && multiSelectQuestion.allowMultiple) {
        const firstAnswer = screen.getByText(
          multiSelectQuestion.answers[0]?.text ?? "",
        );

        await user.click(firstAnswer);
        expect(firstAnswer.closest("button")).toHaveAttribute(
          "aria-checked",
          "true",
        );

        await user.click(firstAnswer);
        expect(firstAnswer.closest("button")).toHaveAttribute(
          "aria-checked",
          "false",
        );
      }
    });
  });

  describe("Tone generation", () => {
    it("shows 'Generate Tone' button on last question", async () => {
      const user = userEvent.setup();
      render(<ToneQuiz />);

      // Navigate to last question
      for (let i = 0; i < QUIZ_QUESTIONS.length - 1; i++) {
        const answer = screen.getByText(
          QUIZ_QUESTIONS[i]?.answers[0]?.text ?? "",
        );
        await user.click(answer);
        await user.click(screen.getByRole("button", { name: "Next" }));
        await waitFor(() => {
          expect(
            screen.queryByText(QUIZ_QUESTIONS[i]?.text ?? ""),
          ).not.toBeInTheDocument();
        });
      }

      expect(
        screen.getByRole("button", { name: "Generate Tone" }),
      ).toBeInTheDocument();
    });

    it("generates tone when last question answered", async () => {
      const user = userEvent.setup();
      const mockCustomTone: CustomTone = {
        id: "tone-1",
        name: "Test Tone",
        description: "Test description",
        enhancedContext: "Test context",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customTone: mockCustomTone }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        // For multi-select, select first two answers
        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/tone-quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"answers"'),
        });
      });

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Your Custom Tone" }),
        ).toBeInTheDocument();
      });
    });

    it("shows generated tone details", async () => {
      const user = userEvent.setup();
      const mockCustomTone: CustomTone = {
        id: "tone-1",
        name: "Test Tone",
        description: "Test description",
        enhancedContext: "Test context",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customTone: mockCustomTone }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(screen.getByText("Test Tone")).toBeInTheDocument();
        expect(screen.getByText("Test description")).toBeInTheDocument();
      });
    });

    it("shows error when tone generation fails", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Generation failed" }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(screen.getByText("Generation failed")).toBeInTheDocument();
      });
    });

    it("shows error when response is invalid", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "data" }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(
          screen.getByText("Invalid response from server. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("handles network error during tone generation", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("Tone result actions", () => {
    const completeQuiz = async (user: ReturnType<typeof userEvent.setup>) => {
      const mockCustomTone: CustomTone = {
        id: "tone-1",
        name: "Test Tone",
        description: "Test description",
        enhancedContext: "Test context",
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customTone: mockCustomTone }),
      });

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Your Custom Tone" }),
        ).toBeInTheDocument();
      });
    };

    it("calls onComplete with tone when Apply This Tone clicked", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(<ToneQuiz onComplete={onComplete} />);
      await completeQuiz(user);

      const applyButton = screen.getByRole("button", {
        name: "Apply This Tone",
      });
      await user.click(applyButton);

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "tone-1",
          name: "Test Tone",
        }),
      );
    });

    it("calls onComplete with null when Skip clicked", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(<ToneQuiz onComplete={onComplete} />);
      await completeQuiz(user);

      const skipButton = screen.getByRole("button", { name: "Skip" });
      await user.click(skipButton);

      expect(onComplete).toHaveBeenCalledWith(null);
    });

    it("resets quiz when Retake Quiz clicked", async () => {
      const user = userEvent.setup();

      render(<ToneQuiz />);
      await completeQuiz(user);

      const retakeButton = screen.getByRole("button", { name: "Retake Quiz" });
      await user.click(retakeButton);

      await waitFor(() => {
        expect(
          screen.getByText(QUIZ_QUESTIONS[0]?.text ?? ""),
        ).toBeInTheDocument();
      });
      expect(screen.getByText("1 of 10")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("handles invalid question index gracefully", async () => {
      // Reset modules to allow re-importing with mocked QUIZ_QUESTIONS
      vi.resetModules();

      // Mock QUIZ_QUESTIONS to be empty array to trigger guard case
      vi.doMock("@/lib/quiz/questions", () => ({
        QUIZ_QUESTIONS: [],
      }));

      // Re-import component after mock
      const { ToneQuiz: ToneQuizMocked } = await import(
        "@/components/voice-profile/tone-quiz"
      );

      const onClose = vi.fn();
      render(<ToneQuizMocked onClose={onClose} />);

      // Should show error message
      expect(
        screen.getByText("Error: Invalid question index"),
      ).toBeInTheDocument();

      // Should show Close button when onClose provided
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toBeInTheDocument();

      // Clean up mock and restore modules
      vi.doUnmock("@/lib/quiz/questions");
      vi.resetModules();
    });

    it("validates tone response structure", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          customTone: {
            id: "tone-1",
            name: "Test",
            // Missing required fields
          },
        }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(
          screen.getByText("Invalid response format. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("handles null enhancedContext in tone response", async () => {
      const user = userEvent.setup();
      const mockCustomTone: CustomTone = {
        id: "tone-1",
        name: "Test Tone",
        description: "Test description",
        enhancedContext: null,
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customTone: mockCustomTone }),
      });

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(screen.getByText("Test Tone")).toBeInTheDocument();
      });
    });
  });

  describe("Loading states", () => {
    it("shows loading message while generating tone", async () => {
      const user = userEvent.setup();
      let resolveFetch: ((value: Response) => void) | undefined;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      render(<ToneQuiz />);

      // Answer all questions
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const question = QUIZ_QUESTIONS[i];
        if (!question) continue;

        if (question.allowMultiple && question.answers.length >= 2) {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
          await user.click(screen.getByText(question.answers[1]?.text ?? ""));
        } else {
          await user.click(screen.getByText(question.answers[0]?.text ?? ""));
        }

        const buttonText =
          i === QUIZ_QUESTIONS.length - 1 ? "Generate Tone" : "Next";
        await user.click(screen.getByRole("button", { name: buttonText }));

        if (i < QUIZ_QUESTIONS.length - 1) {
          await waitFor(() => {
            expect(screen.queryByText(question.text)).not.toBeInTheDocument();
          });
        }
      }

      await waitFor(() => {
        expect(
          screen.getByText("Generating your custom tone..."),
        ).toBeInTheDocument();
      });

      // Resolve fetch
      resolveFetch?.({
        ok: true,
        json: async () => ({
          customTone: {
            id: "tone-1",
            name: "Test",
            description: "Test",
            enhancedContext: null,
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        }),
      } as Response);

      await waitFor(() => {
        expect(
          screen.queryByText("Generating your custom tone..."),
        ).not.toBeInTheDocument();
      });
    });
  });
});
