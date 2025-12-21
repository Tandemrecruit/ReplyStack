import { render, screen, waitFor, within } from "@testing-library/react";
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
  describe("Initial render", () => {
    it("renders section heading", () => {
      render(<LiveDemo />);
      expect(
        screen.getByRole("heading", { name: "Paste a review, pick a tone" }),
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<LiveDemo />);
      expect(
        screen.getByText(
          /This is an example preview of what owners publish: short, specific, and human/i,
        ),
      ).toBeInTheDocument();
    });

    it("renders all tone buttons", () => {
      render(<LiveDemo />);
      expect(screen.getByRole("button", { name: "Warm" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Direct" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Concise" }),
      ).toBeInTheDocument();
    });

    it("renders review textarea", () => {
      render(<LiveDemo />);
      expect(screen.getByLabelText("Review text")).toBeInTheDocument();
    });

    it("renders sample selector", () => {
      render(<LiveDemo />);
      expect(
        screen.getByLabelText("Choose a sample review"),
      ).toBeInTheDocument();
    });

    it("renders CTA links", () => {
      render(<LiveDemo />);
      expect(
        screen.getByRole("link", { name: "Start your free trial" }),
      ).toHaveAttribute("href", "/signup");
      expect(
        screen.getByRole("link", { name: "View the app" }),
      ).toHaveAttribute("href", "/login");
    });

    it("renders with default sample review", () => {
      render(<LiveDemo />);
      const textarea = screen.getByLabelText(
        "Review text",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toContain("The stylist was kind and fast");
    });

    it("renders draft reply preview", () => {
      render(<LiveDemo />);
      expect(screen.getByText(/Draft reply \(Warm tone\)/)).toBeInTheDocument();
    });
  });

  describe("Tone selection", () => {
    it("defaults to Warm tone", () => {
      render(<LiveDemo />);
      const warmButton = screen.getByRole("button", { name: "Warm" });
      expect(warmButton).toHaveAttribute("aria-pressed", "true");
    });

    it("updates draft when tone changes to Direct", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      expect(screen.getByText(/Draft reply \(Warm tone\)/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Direct" }));

      await waitFor(() => {
        expect(
          screen.getByText(/Draft reply \(Direct tone\)/),
        ).toBeInTheDocument();
      });

      const directButton = screen.getByRole("button", { name: "Direct" });
      expect(directButton).toHaveAttribute("aria-pressed", "true");
    });

    it("updates draft when tone changes to Concise", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Concise" }));

      await waitFor(() => {
        expect(
          screen.getByText(/Draft reply \(Concise tone\)/),
        ).toBeInTheDocument();
      });

      const conciseButton = screen.getByRole("button", { name: "Concise" });
      expect(conciseButton).toHaveAttribute("aria-pressed", "true");
    });

    it("updates draft content when tone changes", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      // Get initial draft with Warm tone
      const initialDraft = screen.getByText(
        /Thanks so much for the thoughtful review/i,
      );
      expect(initialDraft).toBeInTheDocument();

      // Change to Direct
      await user.click(screen.getByRole("button", { name: "Direct" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /Thanks for the review—appreciate you sharing the details/i,
          ),
        ).toBeInTheDocument();
      });

      // Change to Concise
      await user.click(screen.getByRole("button", { name: "Concise" }));

      await waitFor(() => {
        expect(screen.getByText(/Thanks for the review/i)).toBeInTheDocument();
        expect(
          screen.queryByText(/Thanks so much for the thoughtful review/i),
        ).not.toBeInTheDocument();
      });
    });

    it("only one tone button is active at a time", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const warmButton = screen.getByRole("button", { name: "Warm" });
      const directButton = screen.getByRole("button", { name: "Direct" });
      const conciseButton = screen.getByRole("button", { name: "Concise" });

      expect(warmButton).toHaveAttribute("aria-pressed", "true");
      expect(directButton).toHaveAttribute("aria-pressed", "false");
      expect(conciseButton).toHaveAttribute("aria-pressed", "false");

      await user.click(directButton);

      await waitFor(() => {
        expect(warmButton).toHaveAttribute("aria-pressed", "false");
        expect(directButton).toHaveAttribute("aria-pressed", "true");
        expect(conciseButton).toHaveAttribute("aria-pressed", "false");
      });
    });
  });

  describe("Sample review selection", () => {
    it("renders all sample reviews in selector", () => {
      render(<LiveDemo />);
      const _select = screen.getByLabelText("Choose a sample review");
      expect(
        screen.getByRole("option", { name: "Salon (mixed)" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "HVAC (positive)" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Dental (tough)" }),
      ).toBeInTheDocument();
    });

    it("updates review text when selecting salon-mixed sample", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText(
        "Review text",
      ) as HTMLTextAreaElement;
      const select = screen.getByLabelText("Choose a sample review");

      await user.selectOptions(select, "salon-mixed");

      await waitFor(() => {
        expect(textarea.value).toContain("The stylist was kind and fast");
        expect(textarea.value).toContain("Booking online was easy");
        expect(textarea.value).toContain("Parking was a little tricky");
      });
    });

    it("updates review text when selecting hvac-positive sample", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText(
        "Review text",
      ) as HTMLTextAreaElement;
      const select = screen.getByLabelText("Choose a sample review");

      await user.selectOptions(select, "hvac-positive");

      await waitFor(() => {
        expect(textarea.value).toContain("Tech showed up right on time");
        expect(textarea.value).toContain("the price felt fair");
      });
    });

    it("updates review text when selecting dental-negative sample", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText(
        "Review text",
      ) as HTMLTextAreaElement;
      const select = screen.getByLabelText("Choose a sample review");

      await user.selectOptions(select, "dental-negative");

      await waitFor(() => {
        expect(textarea.value).toContain("waited 40 minutes");
        expect(textarea.value).toContain("the delay was frustrating");
      });
    });

    it("updates draft when sample changes", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const select = screen.getByLabelText("Choose a sample review");

      // Initial draft should mention parking/booking from salon sample
      expect(screen.getByText(/Parking can/i)).toBeInTheDocument();

      // Switch to dental sample (has wait time)
      await user.selectOptions(select, "dental-negative");

      await waitFor(() => {
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
      });
    });

    // Note: "handles invalid sample ID gracefully" test removed
    // HTML select elements can only select existing options - testing invalid IDs
    // is not possible with userEvent.selectOptions
  });

  describe("Manual text input", () => {
    it("updates draft when user types in textarea", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Parking was tricky but booking was easy.");

      await waitFor(() => {
        expect(screen.getByText(/Parking can/i)).toBeInTheDocument();
        expect(
          screen.getByText(/online booking was easy/i),
        ).toBeInTheDocument();
      });
    });

    it("normalizes whitespace in review text display", async () => {
      const user = userEvent.setup();
      const { container } = render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Great   service    with   multiple   spaces");

      await waitFor(() => {
        // Review display should normalize multiple spaces
        // Find the review preview section (bg-background-secondary)
        const reviewPreview = container.querySelector(
          ".bg-background-secondary",
        );
        expect(reviewPreview).toBeDefined();
        const previewText = within(reviewPreview as HTMLElement).getByText(
          /Great service with multiple spaces/i,
        );
        expect(previewText).toBeInTheDocument();
      });
    });

    it("handles empty review text", async () => {
      const user = userEvent.setup();
      const { container } = render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);

      await waitFor(() => {
        // Should show ellipsis for empty text - find review preview section
        const reviewPreview = container.querySelector(
          ".bg-background-secondary",
        );
        expect(reviewPreview).toBeDefined();
        const previewText = within(reviewPreview as HTMLElement).getByText(/…/);
        expect(previewText).toBeInTheDocument();
      });
    });
  });

  describe("Topic detection and draft generation", () => {
    it("detects parking topic and includes parking response", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "The parking situation needs improvement.");

      await waitFor(() => {
        expect(screen.getByText(/Parking can/i)).toBeInTheDocument();
      });
    });

    it("detects wait topic and includes wait response for Warm tone", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "I had to wait a long time.");

      await waitFor(() => {
        // Use simpler regex to avoid em-dash encoding issues
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
      });
    });

    it("detects wait topic and includes concise wait response for Concise tone", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Concise" }));

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "I was late for my appointment.");

      await waitFor(() => {
        expect(
          screen.getByText(
            /Sorry about the wait—our goal is to stay on schedule/i,
          ),
        ).toBeInTheDocument();
      });
    });

    it("detects booking topic and includes booking response", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Booking the appointment was simple.");

      await waitFor(() => {
        expect(
          screen.getByText(/online booking was easy/i),
        ).toBeInTheDocument();
      });
    });

    it("detects booking topic with concise response for Concise tone", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Concise" }));

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Easy to book online.");

      await waitFor(() => {
        expect(screen.getByText(/Glad booking was easy/i)).toBeInTheDocument();
      });
    });

    it("detects price topic and includes price response", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "The pricing was fair and reasonable.");

      await waitFor(() => {
        expect(
          screen.getByText(/Thanks for mentioning pricing/i),
        ).toBeInTheDocument();
      });
    });

    it("detects price topic with concise response for Concise tone", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Concise" }));

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Fair pricing.");

      await waitFor(() => {
        expect(
          screen.getByText(/Appreciate the note on pricing/i),
        ).toBeInTheDocument();
      });
    });

    it("detects multiple topics and includes all relevant responses", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(
        textarea,
        "Parking was difficult, I had to wait, but booking was easy and the price was fair.",
      );

      await waitFor(() => {
        expect(screen.getByText(/Parking can/i)).toBeInTheDocument();
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
        expect(
          screen.getByText(/online booking was easy/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Thanks for mentioning pricing/i),
        ).toBeInTheDocument();
      });
    });

    it("shows generic gratitude when no topics detected", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Great service overall!");

      await waitFor(() => {
        expect(
          screen.getByText(/really glad you had a good experience/i),
        ).toBeInTheDocument();
      });
    });

    it("shows generic gratitude for Direct tone when no topics", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Direct" }));

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Excellent experience!");

      await waitFor(() => {
        expect(
          screen.getByText(/glad the visit went well overall/i),
        ).toBeInTheDocument();
      });
    });

    it("shows generic gratitude for Concise tone when no topics", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      await user.click(screen.getByRole("button", { name: "Concise" }));

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Perfect!");

      await waitFor(() => {
        expect(
          screen.getByText(/Glad it went well overall/i),
        ).toBeInTheDocument();
      });
    });

    it("includes closing line for all tones", async () => {
      const user = userEvent.setup();
      const { container } = render(<LiveDemo />);

      // Helper to check draft contains text (handles curly quotes/apostrophes)
      const draftContains = (text: string) => {
        const draftSection = container.querySelector(".bg-surface-elevated");
        if (!draftSection) return false;
        const draftText = within(draftSection as HTMLElement).queryByText(
          new RegExp(text, "i"),
        );
        return draftText !== null;
      };

      // Warm tone
      await waitFor(() => {
        expect(draftContains("back in, say hi")).toBe(true);
      });

      // Direct tone
      await user.click(screen.getByRole("button", { name: "Direct" }));
      await waitFor(() => {
        expect(draftContains("love to see you again")).toBe(true);
      });

      // Concise tone
      await user.click(screen.getByRole("button", { name: "Concise" }));
      await waitFor(() => {
        expect(draftContains("hope to see you again")).toBe(true);
      });
    });

    it("detects 'waiting' variant of wait topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "I was waiting for a long time.");

      await waitFor(() => {
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
      });
    });

    it("detects 'late' variant of wait topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "The appointment was late.");

      await waitFor(() => {
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
      });
    });

    it("detects 'delay' variant of wait topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "There was a delay in service.");

      await waitFor(() => {
        expect(screen.getByText(/sorry about the wait/i)).toBeInTheDocument();
      });
    });

    it("detects 'book' variant of booking topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "Easy to book an appointment.");

      await waitFor(() => {
        expect(
          screen.getByText(/online booking was easy/i),
        ).toBeInTheDocument();
      });
    });

    it("detects 'pricing' variant of price topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "The pricing was transparent.");

      await waitFor(() => {
        expect(
          screen.getByText(/Thanks for mentioning pricing/i),
        ).toBeInTheDocument();
      });
    });

    it("detects 'expensive' variant of price topic", async () => {
      const user = userEvent.setup();
      render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "A bit expensive but worth it.");

      await waitFor(() => {
        expect(
          screen.getByText(/Thanks for mentioning pricing/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Review display", () => {
    it("displays normalized review text in preview", async () => {
      const user = userEvent.setup();
      const { container } = render(<LiveDemo />);

      const textarea = screen.getByLabelText("Review text");
      await user.clear(textarea);
      await user.type(textarea, "  Great   service   with   extra   spaces  ");

      await waitFor(() => {
        // Should normalize and trim
        // Find the review preview section (bg-background-secondary)
        const reviewPreview = container.querySelector(
          ".bg-background-secondary",
        );
        expect(reviewPreview).toBeDefined();
        const previewText = within(reviewPreview as HTMLElement).getByText(
          /Great service with extra spaces/i,
        );
        expect(previewText).toBeInTheDocument();
      });
    });

    it("displays review with quotes", () => {
      const { container } = render(<LiveDemo />);
      // The review text is wrapped in quotes in the preview section
      // Find the preview section in the review card (background-secondary class)
      const previewCard = container.querySelector(".bg-background-secondary");
      expect(previewCard).toBeDefined();
      // The text should contain the review content
      const previewText = within(previewCard as HTMLElement).getByText(
        /The stylist was kind/i,
      );
      expect(previewText).toBeInTheDocument();
    });
  });
});
