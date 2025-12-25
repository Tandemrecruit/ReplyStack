import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResponseEditModal } from "@/components/reviews/response-edit-modal";

// Mock next/navigation
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Save original implementations before mocking
const originalFetch = global.fetch;
const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock HTMLDialogElement methods (not implemented in jsdom)
// showModal needs to set the open attribute for the dialog to be visible
HTMLDialogElement.prototype.showModal = vi.fn(function (
  this: HTMLDialogElement,
) {
  this.setAttribute("open", "");
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute("open");
});

// Timeout configuration for waitFor calls
const WAIT_FOR_TIMEOUT = { timeout: 3000 };

describe("components/reviews/ResponseEditModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    reviewId: "review-123",
    initialText: "Thank you for your feedback!",
  };

  afterAll(() => {
    // Restore original implementations to prevent leaks into other test suites
    // This ensures mocks don't persist after this test suite completes
    global.fetch = originalFetch;
    HTMLDialogElement.prototype.showModal = originalShowModal;
    HTMLDialogElement.prototype.close = originalClose;
  });

  beforeEach(() => {
    // Safety: if a test fails/times out while using fake timers,
    // ensure we don't leak them into subsequent tests.
    vi.useRealTimers();
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe("Open/Close behavior", () => {
    it("renders when isOpen is true", () => {
      render(<ResponseEditModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit Response")).toBeInTheDocument();
    });

    it("calls showModal when opened", () => {
      render(<ResponseEditModal {...defaultProps} />);

      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });

    it("displays the initial text in textarea", () => {
      render(<ResponseEditModal {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Thank you for your feedback!");
    });

    it("closes when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when ESC key triggers cancel event", () => {
      const onClose = vi.fn();

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole("dialog");
      const cancelEvent = new Event("cancel", { bubbles: true });
      dialog.dispatchEvent(cancelEvent);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when backdrop is clicked", () => {
      const onClose = vi.fn();

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole("dialog");
      // Simulate clicking on the dialog element itself (backdrop)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: dialog });
      dialog.dispatchEvent(clickEvent);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside modal content", () => {
      const onClose = vi.fn();

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole("dialog");
      const textarea = screen.getByRole("textbox");
      // Simulate clicking on textarea (not backdrop)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: textarea });
      dialog.dispatchEvent(clickEvent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Character and word counts", () => {
    it("displays initial character and word counts", () => {
      render(<ResponseEditModal {...defaultProps} />);

      // "Thank you for your feedback!" = 28 chars, 5 words
      expect(screen.getByText("28 characters")).toBeInTheDocument();
      expect(screen.getByText("5 words")).toBeInTheDocument();
    });

    it("updates counts when text changes", async () => {
      const user = userEvent.setup();

      render(<ResponseEditModal {...defaultProps} initialText="" />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello world");

      expect(screen.getByText("11 characters")).toBeInTheDocument();
      expect(screen.getByText("2 words")).toBeInTheDocument();
    });

    it("shows zero characters and words for empty text", () => {
      render(<ResponseEditModal {...defaultProps} initialText="" />);

      expect(screen.getByText("0 characters")).toBeInTheDocument();
      expect(screen.getByText("0 words")).toBeInTheDocument();
    });

    it("shows zero words for whitespace-only text", () => {
      render(<ResponseEditModal {...defaultProps} initialText="   " />);

      expect(screen.getByText("3 characters")).toBeInTheDocument();
      expect(screen.getByText("0 words")).toBeInTheDocument();
    });

    it("correctly counts multiple words separated by various whitespace", () => {
      render(
        <ResponseEditModal
          {...defaultProps}
          initialText="one  two   three    four"
        />,
      );

      expect(screen.getByText("4 words")).toBeInTheDocument();
    });
  });

  describe("Review context display", () => {
    it("displays review summary when provided", () => {
      render(
        <ResponseEditModal
          {...defaultProps}
          reviewSummary={{
            reviewerName: "John Doe",
            rating: 4,
            reviewText: "Great service!",
          }}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Great service!")).toBeInTheDocument();
    });

    it("shows Anonymous for null reviewer name", () => {
      render(
        <ResponseEditModal
          {...defaultProps}
          reviewSummary={{
            reviewerName: null,
            rating: 3,
            reviewText: "Okay experience",
          }}
        />,
      );

      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("renders stars for rating", () => {
      const rating = 4;
      const { container } = render(
        <ResponseEditModal
          {...defaultProps}
          reviewSummary={{
            reviewerName: "Jane",
            rating,
            reviewText: "Good",
          }}
        />,
      );

      // Find the review summary container by reviewer name to scope the search
      const reviewSummary = screen.getByText("Jane").closest("div");
      expect(reviewSummary).toBeInTheDocument();

      // Find the rating element within the review summary
      if (!reviewSummary) {
        throw new Error("Review summary container not found");
      }
      const ratingElement = within(reviewSummary).getByRole("img");

      // Assert accessible labeling includes the rating value and max
      expect(ratingElement).toHaveAttribute(
        "aria-label",
        `${rating} out of 5 stars`,
      );

      // Should have 5 star SVGs (4 filled, 1 empty)
      const stars = container.querySelectorAll("svg");
      // Filter stars in the review summary area (not stars elsewhere)
      expect(stars.length).toBeGreaterThanOrEqual(5);
    });

    it("does not display review context when not provided", () => {
      render(<ResponseEditModal {...defaultProps} />);

      expect(screen.queryByText("Anonymous")).not.toBeInTheDocument();
    });
  });

  describe("Publish validation", () => {
    it("shows error when trying to publish empty response", async () => {
      const user = userEvent.setup();

      render(<ResponseEditModal {...defaultProps} initialText="" />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Response cannot be empty",
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows error when trying to publish whitespace-only response", async () => {
      const user = userEvent.setup();

      render(<ResponseEditModal {...defaultProps} initialText="   " />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Response cannot be empty",
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("allows retry after fixing validation error", async () => {
      const user = userEvent.setup();

      render(<ResponseEditModal {...defaultProps} initialText="" />);

      // Trigger validation error by attempting to publish empty text
      await user.click(screen.getByRole("button", { name: "Publish" }));
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Fix the validation issue by adding text
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "New text");

      // Retry publish - should succeed now that validation passes
      await user.click(screen.getByRole("button", { name: "Publish" }));
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("Publish success flow", () => {
    it("calls publish API with correct data", async () => {
      const user = userEvent.setup();

      render(<ResponseEditModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reviews/review-123/publish",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response_text: "Thank you for your feedback!",
          }),
        }),
      );
    });

    it("trims whitespace before publishing", async () => {
      const user = userEvent.setup();

      render(
        <ResponseEditModal {...defaultProps} initialText="  Hello world  " />,
      );

      await user.click(screen.getByRole("button", { name: "Publish" }));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reviews/review-123/publish",
        expect.objectContaining({
          body: JSON.stringify({ response_text: "Hello world" }),
        }),
      );
    });

    it("calls onClose and onPublished on success", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onPublished = vi.fn();

      render(
        <ResponseEditModal
          {...defaultProps}
          onClose={onClose}
          onPublished={onPublished}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onPublished).toHaveBeenCalledTimes(1);
      });
    });

    it("calls router.refresh when onPublished not provided", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it("disables buttons during publish", async () => {
      const user = userEvent.setup();

      // Deterministic "in-flight" fetch so we can assert disabled states
      let resolveFetch:
        | ((value: {
            ok: boolean;
            json: () => Promise<{ success: boolean }>;
          }) => void)
        | undefined;

      const fetchPromise = new Promise<{
        ok: boolean;
        json: () => Promise<{ success: boolean }>;
      }>((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockImplementation(() => fetchPromise);

      render(<ResponseEditModal {...defaultProps} />);

      const publishButton = screen.getByRole("button", { name: "Publish" });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });

      const clickPromise = user.click(publishButton);

      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
        expect(publishButton).toBeDisabled();
      }, WAIT_FOR_TIMEOUT);

      resolveFetch?.({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await clickPromise;
    });

    it("disables textarea during publish", async () => {
      const user = userEvent.setup();

      // Create a deferred promise so we can control when fetch resolves
      // This allows us to check the disabled state while the fetch is still pending
      let resolveFetch:
        | ((value: {
            ok: boolean;
            json: () => Promise<{ success: boolean }>;
          }) => void)
        | undefined;
      const fetchPromise = new Promise<{
        ok: boolean;
        json: () => Promise<{ success: boolean }>;
      }>((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockImplementation(() => fetchPromise);

      render(<ResponseEditModal {...defaultProps} />);

      const publishButton = screen.getByRole("button", { name: "Publish" });
      const clickPromise = user.click(publishButton);

      // Wait for the click to trigger and isPublishing to be set to true
      // The textarea should be disabled while the fetch is pending
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeDisabled();
      }, WAIT_FOR_TIMEOUT);

      // Now resolve the fetch to complete the operation
      if (resolveFetch) {
        resolveFetch({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }

      // Wait for click and fetch to complete
      await clickPromise;
    });
  });

  describe("Error handling", () => {
    it("displays API error message", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Google account not connected" }),
      });

      render(<ResponseEditModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Google account not connected",
        );
      }, WAIT_FOR_TIMEOUT);
    });

    it("displays generic error for non-JSON response", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
      });

      render(<ResponseEditModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Failed to publish (500)",
        );
      }, WAIT_FOR_TIMEOUT);
    });

    it("displays error for network failure", async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ResponseEditModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Network error");
      }, WAIT_FOR_TIMEOUT);
    });

    it("does not close modal on error", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<ResponseEditModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("preserves user edits after error", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<ResponseEditModal {...defaultProps} initialText="Original" />);

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.type(textarea, "Edited text");

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);

      // Text should still be there
      expect(textarea).toHaveValue("Edited text");
    });

    it("clears error on successful retry", async () => {
      const user = userEvent.setup();

      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<ResponseEditModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);
    });
  });

  describe("State reset on reopen", () => {
    it("resets text when initialText changes", () => {
      const { rerender } = render(
        <ResponseEditModal {...defaultProps} initialText="First text" />,
      );

      expect(screen.getByRole("textbox")).toHaveValue("First text");

      rerender(
        <ResponseEditModal {...defaultProps} initialText="Second text" />,
      );

      expect(screen.getByRole("textbox")).toHaveValue("Second text");
    });

    it("clears error when initialText changes", async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ResponseEditModal {...defaultProps} initialText="" />,
      );

      // Trigger error
      await user.click(screen.getByRole("button", { name: "Publish" }));
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);

      // Reopen with new text
      rerender(<ResponseEditModal {...defaultProps} initialText="New text" />);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      }, WAIT_FOR_TIMEOUT);
    });
  });
});
