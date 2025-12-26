import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GenerateResponseButton } from "@/components/reviews/generate-response-button";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock ResponseEditModal
vi.mock("@/components/reviews/response-edit-modal", () => ({
  ResponseEditModal: ({
    isOpen,
    onClose,
    reviewId,
    initialText,
    onPublished,
    reviewSummary,
  }: {
    isOpen: boolean;
    onClose: () => void;
    reviewId: string;
    initialText: string;
    onPublished: () => void;
    reviewSummary?: {
      reviewerName?: string | null;
      rating?: number | null;
      reviewText?: string | null;
    };
  }) => (
    <div data-testid="response-edit-modal">
      {isOpen && (
        <>
          <div>Modal Open</div>
          <button type="button" onClick={onClose}>
            Close Modal
          </button>
          <button type="button" onClick={onPublished}>
            Publish
          </button>
          <div>Review ID: {reviewId}</div>
          <div>Initial Text: {initialText}</div>
          {reviewSummary && (
            <>
              <div data-testid="review-summary-reviewer-name">
                {reviewSummary.reviewerName ?? "Anonymous"}
              </div>
              {reviewSummary.rating != null && (
                <div data-testid="review-summary-rating">
                  {reviewSummary.rating}
                </div>
              )}
              {reviewSummary.reviewText && (
                <div data-testid="review-summary-review-text">
                  {reviewSummary.reviewText}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("components/reviews/GenerateResponseButton", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockRefresh.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial render", () => {
    it("renders Generate Response button", () => {
      render(<GenerateResponseButton reviewId="review-1" />);
      expect(
        screen.getByRole("button", { name: "Generate Response" }),
      ).toBeInTheDocument();
    });

    it("button is enabled initially", () => {
      render(<GenerateResponseButton reviewId="review-1" />);
      const button = screen.getByRole("button", { name: "Generate Response" });
      expect(button).not.toBeDisabled();
    });

    it("renders ResponseEditModal", () => {
      render(<GenerateResponseButton reviewId="review-1" />);
      expect(screen.getByTestId("response-edit-modal")).toBeInTheDocument();
    });

    it("modal is closed initially", () => {
      render(<GenerateResponseButton reviewId="review-1" />);
      expect(screen.queryByText("Modal Open")).not.toBeInTheDocument();
    });
  });

  describe("Successful response generation", () => {
    it("calls API with correct review ID", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you for your review!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: "review-1" }),
        });
      });
    });

    it("opens modal with generated text on success", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you for your review!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Modal Open")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Initial Text: Thank you for your review!"),
      ).toBeInTheDocument();
    });

    it("calls onSuccess callback with response data", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <GenerateResponseButton reviewId="review-1" onSuccess={onSuccess} />,
      );

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResponse);
      });
    });

    it("passes reviewSummary to modal", async () => {
      const user = userEvent.setup();
      const reviewSummary = {
        reviewerName: "John Doe",
        rating: 5,
        reviewText: "Great service!",
      };

      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <GenerateResponseButton
          reviewId="review-1"
          reviewSummary={reviewSummary}
        />,
      );

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Modal Open")).toBeInTheDocument();
      });

      // Assert reviewSummary fields are rendered in the modal
      expect(
        screen.getByTestId("review-summary-reviewer-name"),
      ).toHaveTextContent("John Doe");
      expect(screen.getByTestId("review-summary-rating")).toHaveTextContent(
        "5",
      );
      expect(
        screen.getByTestId("review-summary-review-text"),
      ).toHaveTextContent("Great service!");
    });
  });

  describe("Loading state", () => {
    it("shows loading text while generating", async () => {
      const user = userEvent.setup();
      let resolveFetch: ((value: Response) => void) | undefined;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      expect(
        screen.getByRole("button", { name: "Generating..." }),
      ).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");

      // Resolve fetch
      resolveFetch?.({
        ok: true,
        json: async () => ({
          id: "response-1",
          reviewId: "review-1",
          generatedText: "Thank you!",
          status: "pending",
          tokensUsed: 150,
        }),
      } as Response);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Generate Response" }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    it("handles API error with JSON error message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (key: string) =>
            key === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Server error occurred" }),
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to generate response:",
          "Server error occurred",
        );
      });
    });

    it("handles API error with non-JSON response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: (key: string) => (key === "content-type" ? "text/html" : null),
        },
        text: async () => "Error occurred",
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
        const errorCall = (
          console.error as ReturnType<typeof vi.fn>
        ).mock.calls.find(
          (call) =>
            call[0] === "Failed to generate response:" &&
            typeof call[1] === "string" &&
            call[1].includes("500"),
        );
        expect(errorCall).toBeDefined();
      });
    });

    it("handles API error with short text response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: {
          get: (key: string) => (key === "content-type" ? "text/plain" : null),
        },
        text: async () => "Invalid request",
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to generate response:",
          "Invalid request",
        );
      });
    });

    it("handles API error with long HTML response", async () => {
      const user = userEvent.setup();
      const longHtml = `<html>${"x".repeat(300)}</html>`;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: (key: string) => (key === "content-type" ? "text/html" : null),
        },
        text: async () => longHtml,
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to generate response:",
          expect.stringContaining("500 Internal Server Error"),
        );
      });
    });

    it("handles JSON parse error in error response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: (key: string) =>
            key === "content-type" ? "application/json" : null,
        },
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to generate response:",
          expect.stringContaining("500 Internal Server Error"),
        );
      });
    });

    it("handles text parse error in error response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: (key: string) => (key === "content-type" ? "text/plain" : null),
        },
        text: async () => {
          throw new Error("Read error");
        },
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to generate response:",
          expect.stringContaining("500 Internal Server Error"),
        );
      });
    });

    it("calls onError callback when provided", async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: (key: string) =>
            key === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Server error" }),
      });

      render(<GenerateResponseButton reviewId="review-1" onError={onError} />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Server error");
      });
    });

    it("handles network error", async () => {
      const user = userEvent.setup();
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error generating response:",
          "Network error",
        );
      });
    });

    it("handles non-Error exception", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce("String error");

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error generating response:",
          "An unexpected error occurred. Please try again.",
        );
      });
    });
  });

  describe("Modal interaction", () => {
    it("closes modal when onClose called", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Modal Open")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "Close Modal" });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Modal Open")).not.toBeInTheDocument();
      });
    });

    it("refreshes router when response published", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: "response-1",
        reviewId: "review-1",
        generatedText: "Thank you!",
        status: "pending",
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GenerateResponseButton reviewId="review-1" />);

      const button = screen.getByRole("button", { name: "Generate Response" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Modal Open")).toBeInTheDocument();
      });

      const publishButton = screen.getByRole("button", { name: "Publish" });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });
});
