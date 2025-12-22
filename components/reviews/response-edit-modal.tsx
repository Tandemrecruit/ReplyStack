"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Review summary data for context display in the modal header
 */
export interface ReviewSummary {
  reviewerName?: string | null;
  rating?: number | null;
  reviewText?: string | null;
}

interface ResponseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  initialText: string;
  onPublished?: () => void;
  reviewSummary?: ReviewSummary | undefined;
}

/**
 * Modal component for editing and publishing AI-generated responses.
 *
 * Uses native <dialog> element for accessibility. Displays review context,
 * editable response textarea with character/word counts, and publish/cancel actions.
 */
export function ResponseEditModal({
  isOpen,
  onClose,
  reviewId,
  initialText,
  onPublished,
  reviewSummary,
}: ResponseEditModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<Element | null>(null);

  const [responseText, setResponseText] = useState(initialText);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when initialText changes (new modal open)
  useEffect(() => {
    setResponseText(initialText);
    setError(null);
  }, [initialText]);

  // Handle dialog open/close with focus management
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Store the trigger element for focus restoration
      triggerRef.current = document.activeElement;
      dialog.showModal();
      // Focus textarea after dialog opens
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } else {
      dialog.close();
      // Restore focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle ESC key and backdrop click
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      // Check if clicked on backdrop (the dialog element itself, not its content)
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  // Calculate character and word counts
  const charCount = responseText.length;
  const wordCount =
    responseText.trim() === "" ? 0 : responseText.trim().split(/\s+/).length;

  const handlePublish = useCallback(async () => {
    const trimmedText = responseText.trim();
    if (trimmedText.length === 0) {
      setError("Response cannot be empty");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response_text: trimmedText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to publish (${response.status})`);
      }

      // Success - close modal and refresh
      onClose();
      if (onPublished) {
        onPublished();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish response",
      );
    } finally {
      setIsPublishing(false);
    }
  }, [responseText, reviewId, onClose, onPublished, router]);

  // Render star rating - uses star position as key since order is fixed
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={`star-${i + 1}`}
        className={`h-4 w-4 ${i < rating ? "text-star" : "text-star-empty"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Don't render content when modal is closed to avoid duplicate text in DOM
  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/50"
      aria-labelledby="modal-title"
    >
      {/* Centered content container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-lg">
          {/* Header */}
          <div className="border-b border-border px-6 py-4">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-foreground"
            >
              Edit Response
            </h2>

            {/* Review context */}
            {reviewSummary && (
              <div className="mt-3 rounded-md bg-background-secondary p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {reviewSummary.reviewerName ?? "Anonymous"}
                  </span>
                  {reviewSummary.rating != null && (
                    <span
                      className="flex items-center gap-0.5"
                      role="img"
                      aria-label={`${reviewSummary.rating} out of 5 stars`}
                    >
                      {renderStars(reviewSummary.rating)}
                    </span>
                  )}
                </div>
                {reviewSummary.reviewText && (
                  <p className="line-clamp-2 text-sm text-foreground-secondary">
                    {reviewSummary.reviewText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Textarea */}
            <label htmlFor="response-text" className="sr-only">
              Response text
            </label>
            <textarea
              ref={textareaRef}
              id="response-text"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="h-64 w-full resize-none rounded-md border border-border bg-surface p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              placeholder="Edit your response..."
              disabled={isPublishing}
            />

            {/* Character/word count */}
            <div className="mt-2 flex gap-4 text-sm text-foreground-muted">
              <span>{charCount} characters</span>
              <span aria-hidden="true">·</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              isLoading={isPublishing}
            >
              Publish
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
