"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface GenerateResponseButtonProps {
  reviewId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Client component that handles "Generate Response" button click and API call.
 *
 * Calls POST /api/responses with the review ID, shows loading state during the request,
 * and handles success/error states. On success, triggers optional callback or refreshes the page.
 *
 * @param reviewId - The ID of the review to generate a response for
 * @param onSuccess - Optional callback invoked on successful response generation
 * @param onError - Optional callback invoked with error message on failure
 */
export function GenerateResponseButton({
  reviewId,
  onSuccess,
  onError,
}: GenerateResponseButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error ?? "Failed to generate response. Please try again.";
        if (onError) {
          onError(errorMessage);
        } else {
          console.error("Failed to generate response:", errorMessage);
        }
        return;
      }

      // Success - refresh the page to show updated review status
      // Future: navigate to response preview/edit modal
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
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
  }, [reviewId, onSuccess, onError, router]);

  return (
    <button
      onClick={handleGenerate}
      type="button"
      disabled={isLoading}
      className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Generating..." : "Generate Response"}
    </button>
  );
}
