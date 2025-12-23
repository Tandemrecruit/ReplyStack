"use client";

import { useState } from "react";

import { QUIZ_QUESTIONS, type QuizAnswer } from "@/lib/quiz/questions";
import type { CustomTone } from "@/lib/types/custom-tone";

interface ToneQuizProps {
  onComplete?: (customTone: CustomTone | null) => void;
  onClose?: () => void;
}

/**
 * Interactive 10-question quiz that generates custom tones based on user responses.
 * Supports both single-select and multi-select questions.
 *
 * @param props.onComplete - Callback invoked when quiz is completed with generated custom tone (or null if skipped)
 * @param props.onClose - Callback invoked when quiz is closed without completing
 */
export function ToneQuiz({ onComplete, onClose }: ToneQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTone, setGeneratedTone] = useState<CustomTone | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  // Guard: if no current question, return early (shouldn't happen in normal flow)
  if (!currentQuestion) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p>Error: Invalid question index</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-surface-hover transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id,
  );
  const selectedAnswerIds = currentAnswer?.answerIds ?? [];

  const handleAnswerSelect = (answerId: number) => {
    if (currentQuestion.allowMultiple) {
      // Multi-select: toggle answer
      const newAnswerIds = selectedAnswerIds.includes(answerId)
        ? selectedAnswerIds.filter((id) => id !== answerId)
        : [...selectedAnswerIds, answerId];

      setAnswers((prev) => {
        const filtered = prev.filter(
          (a) => a.questionId !== currentQuestion.id,
        );
        return [
          ...filtered,
          { questionId: currentQuestion.id, answerIds: newAnswerIds },
        ];
      });
    } else {
      // Single-select: replace answer
      setAnswers((prev) => {
        const filtered = prev.filter(
          (a) => a.questionId !== currentQuestion.id,
        );
        return [
          ...filtered,
          { questionId: currentQuestion.id, answerIds: [answerId] },
        ];
      });
    }
  };

  const handleNext = () => {
    if (selectedAnswerIds.length === 0) {
      setError("Please select at least one answer");
      return;
    }
    setError(null);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - generate custom tone
      handleGenerateTone();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    }
  };

  const handleGenerateTone = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/tone-quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to generate custom tone");
      }

      // Validate response structure and required fields
      if (
        !data ||
        typeof data !== "object" ||
        !data.customTone ||
        typeof data.customTone !== "object"
      ) {
        setError("Invalid response from server. Please try again.");
        return;
      }

      const { customTone } = data;

      // Validate required fields and their types
      if (
        typeof customTone.id !== "string" ||
        typeof customTone.name !== "string" ||
        typeof customTone.description !== "string" ||
        (customTone.enhancedContext !== null &&
          typeof customTone.enhancedContext !== "string") ||
        typeof customTone.createdAt !== "string"
      ) {
        setError("Invalid response format. Please try again.");
        return;
      }

      setGeneratedTone({
        id: customTone.id,
        name: customTone.name,
        description: customTone.description,
        enhancedContext: customTone.enhancedContext,
        createdAt: customTone.createdAt,
      });
    } catch (err) {
      console.error("Error generating custom tone:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate custom tone",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTone = () => {
    if (generatedTone) {
      onComplete?.(generatedTone);
    }
  };

  const handleSkip = () => {
    onComplete?.(null);
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setGeneratedTone(null);
    setError(null);
  };

  // Results screen
  if (generatedTone) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Your Custom Tone
          </h2>
          <p className="mt-1 text-foreground-secondary">
            Based on your quiz responses, we've generated a personalized tone
            for your business
          </p>
        </div>

        <div className="p-6 bg-surface rounded-lg border border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {generatedTone.name}
          </h3>
          <p className="mt-2 text-foreground-secondary">
            {generatedTone.description}
          </p>
        </div>

        {error && (
          <div
            className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleApplyTone}
            className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Apply This Tone
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-surface-hover transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-surface-hover transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tone Quiz</h2>
        <p className="mt-1 text-foreground-secondary">
          Answer 10 questions to generate a custom tone for your business
        </p>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm text-foreground-secondary whitespace-nowrap">
              {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          {currentQuestion.text}
        </h3>
        {currentQuestion.allowMultiple && (
          <p className="text-sm text-foreground-muted">Select all that apply</p>
        )}

        <div className="space-y-2">
          {currentQuestion.answers.map((answer) => {
            const isSelected = selectedAnswerIds.includes(answer.id);
            const answerTextId = `answer-text-${currentQuestion.id}-${answer.id}`;
            return (
              // Note: aria-checked is valid here because role="checkbox" or role="radio"
              // changes the semantic meaning of the button element. Biome's linter
              // doesn't recognize this pattern and will show a false positive warning.
              // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-checked is valid when role="checkbox" or role="radio" is set
              <button
                key={answer.id}
                type="button"
                role={currentQuestion.allowMultiple ? "checkbox" : "radio"}
                aria-checked={isSelected}
                aria-labelledby={answerTextId}
                onClick={() => handleAnswerSelect(answer.id)}
                className={`
                  w-full p-4 rounded-lg border text-left transition-colors
                  ${
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-border hover:border-border-hover"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {currentQuestion.allowMultiple ? (
                    <div
                      className={`
                        mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${
                          isSelected
                            ? "border-primary-600 bg-primary-600"
                            : "border-border"
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          role="img"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`
                        mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? "border-primary-600" : "border-border"}
                      `}
                    >
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-primary-600" />
                      )}
                    </div>
                  )}
                  <span id={answerTextId} className="text-foreground">
                    {answer.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {isGenerating && (
        <div className="p-4 bg-surface border border-border rounded-md">
          <p className="text-foreground-secondary">
            Generating your custom tone...
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {currentQuestionIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isGenerating}
            className="px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isGenerating}
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
        >
          {currentQuestionIndex === QUIZ_QUESTIONS.length - 1
            ? "Generate Tone"
            : "Next"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
