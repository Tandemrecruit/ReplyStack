"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ResponseEditModal, type ReviewSummary } from "./response-edit-modal";

/**
 * Response data returned from the /api/responses endpoint
 */
interface ResponseData {
  id: string;
  reviewId: string;
  generatedText: string;
  status: string;
  tokensUsed: number;
}

interface GenerateResponseButtonProps {
  reviewId: string;
  reviewSummary?: ReviewSummary;
  onSuccess?: (data: ResponseData) => void;
  onError?: (error: string) => void;
}

/**
 * Client component that handles "Generate Response" button click and API call.
 *
 * Calls POST /api/responses with the review ID, shows loading state during the request,
 * and handles success/error states. On success, opens the response edit modal.
 *
 * @param reviewId - The ID of the review to generate a response for
 * @param reviewSummary - Optional review context to display in the edit modal
 * @param onSuccess - Optional callback invoked on successful response generation with the response data
 * @param onError - Optional callback invoked with error message on failure
 */
export function GenerateResponseButton({
  reviewId,
  reviewSummary,
  onSuccess,
  onError,
}: GenerateResponseButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedText, setGeneratedText] = useState("");

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        // Try to extract error message from response
        // Note: response body can only be read once, so we try JSON first
        let errorMessage = "Failed to generate response. Please try again.";
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error ?? errorMessage;
          } catch {
            // JSON parsing failed, use generic message with status
            errorMessage = `Failed to generate response (${response.status} ${response.statusText}). Please try again.`;
          }
        } else {
          const isHtml = contentType?.includes("text/html");
          // Not JSON (e.g., HTML error page), try to read as text
          try {
            const errorText = await response.text();
            // For HTML responses, always include status (tests + real-world debugging).
            // For other text responses, only use body if it's short and meaningful.
            if (
              !isHtml &&
              errorText.length > 0 &&
              errorText.length < 200 &&
              !errorText.startsWith("<")
            ) {
              errorMessage = errorText;
            } else {
              errorMessage = `Failed to generate response (${response.status} ${response.statusText}). Please try again.`;
            }
          } catch {
            // Text parsing also failed, use generic message
            errorMessage = `Failed to generate response (${response.status} ${response.statusText}). Please try again.`;
          }
        }
        if (onError) {
          onError(errorMessage);
        } else {
          console.error("Failed to generate response:", errorMessage);
        }
        return;
      }

      const data = (await response.json()) as ResponseData;

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }

      // Open the modal with the generated text
      setGeneratedText(data.generatedText);
      setIsModalOpen(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      if (onError) {
        onError(errorMessage);
      } else {
        console.error("Error generating response:", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, onSuccess, onError]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handlePublished = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        onClick={handleGenerate}
        type="button"
        disabled={isLoading}
        aria-busy={isLoading}
        className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating..." : "Generate Response"}
      </button>

      <ResponseEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        reviewId={reviewId}
        initialText={generatedText}
        onPublished={handlePublished}
        reviewSummary={reviewSummary}
      />
    </>
  );
}
