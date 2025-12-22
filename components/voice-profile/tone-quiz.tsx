"use client";

import { useState } from "react";

type Question = {
  id: number;
  text: string;
  allowMultiple: boolean;
  answers: Array<{
    id: number;
    text: string;
  }>;
};

type QuizAnswer = {
  questionId: number;
  answerIds: number[];
};

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is your preferred communication style?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Warm and empathetic" },
      { id: 2, text: "Direct and straightforward" },
      { id: 3, text: "Professional and polished" },
      { id: 4, text: "Friendly and conversational" },
      { id: 5, text: "Casual and relaxed" },
    ],
  },
  {
    id: 2,
    text: "How do you handle negative reviews?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Acknowledge concerns with empathy and offer solutions" },
      { id: 2, text: "Address issues directly and professionally" },
      { id: 3, text: "Thank for feedback and invite private discussion" },
      { id: 4, text: "Show understanding while maintaining brand voice" },
      { id: 5, text: "Keep it brief and move conversation offline" },
    ],
  },
  {
    id: 3,
    text: "What is your preferred response length?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very brief (50-100 words)" },
      { id: 2, text: "Short (100-150 words)" },
      { id: 3, text: "Medium (150-250 words)" },
      { id: 4, text: "Detailed (250-350 words)" },
      { id: 5, text: "Comprehensive (350+ words)" },
    ],
  },
  {
    id: 4,
    text: "What type of customer relationship do you want to build?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Personal and caring" },
      { id: 2, text: "Professional and trustworthy" },
      { id: 3, text: "Friendly and approachable" },
      { id: 4, text: "Efficient and solution-focused" },
      { id: 5, text: "Relaxed and authentic" },
    ],
  },
  {
    id: 5,
    text: "How do you prioritize handling complaints?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Address immediately with personal attention" },
      { id: 2, text: "Acknowledge quickly and provide clear next steps" },
      { id: 3, text: "Respond professionally with structured approach" },
      { id: 4, text: "Show understanding and offer flexible solutions" },
      { id: 5, text: "Keep response brief and direct to resolution" },
    ],
  },
  {
    id: 6,
    text: "What formality level matches your brand?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very formal" },
      { id: 2, text: "Formal" },
      { id: 3, text: "Moderately formal" },
      { id: 4, text: "Casual" },
      { id: 5, text: "Very casual" },
    ],
  },
  {
    id: 7,
    text: "How urgent should your responses feel?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Very urgent - immediate action" },
      { id: 2, text: "Urgent - prompt response" },
      { id: 3, text: "Moderate - timely but thoughtful" },
      { id: 4, text: "Relaxed - take time to respond" },
      { id: 5, text: "Very relaxed - no rush" },
    ],
  },
  {
    id: 8,
    text: "What communication tone best represents your brand?",
    allowMultiple: false,
    answers: [
      { id: 1, text: "Empathetic and understanding" },
      { id: 2, text: "Confident and authoritative" },
      { id: 3, text: "Professional and reliable" },
      { id: 4, text: "Warm and welcoming" },
      { id: 5, text: "Authentic and genuine" },
    ],
  },
  {
    id: 9,
    text: "What industry type(s) does your business operate in?",
    allowMultiple: true,
    answers: [
      { id: 1, text: "Restaurant & Food Service" },
      { id: 2, text: "Retail & E-commerce" },
      { id: 3, text: "Healthcare & Medical" },
      { id: 4, text: "Professional Services" },
      { id: 5, text: "Hospitality & Travel" },
      { id: 6, text: "Beauty & Wellness" },
      { id: 7, text: "Technology & Software" },
      { id: 8, text: "Education & Training" },
      { id: 9, text: "Real Estate" },
      { id: 10, text: "Other" },
    ],
  },
  {
    id: 10,
    text: "What brand personality traits describe your business?",
    allowMultiple: true,
    answers: [
      { id: 1, text: "Trustworthy" },
      { id: 2, text: "Innovative" },
      { id: 3, text: "Caring" },
      { id: 4, text: "Professional" },
      { id: 5, text: "Friendly" },
      { id: 6, text: "Authentic" },
      { id: 7, text: "Efficient" },
      { id: 8, text: "Creative" },
      { id: 9, text: "Reliable" },
      { id: 10, text: "Approachable" },
    ],
  },
];

type CustomTone = {
  id: string;
  name: string;
  description: string;
  enhancedContext: string;
};

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

      setGeneratedTone({
        id: data.customTone.id,
        name: data.customTone.name,
        description: data.customTone.description,
        enhancedContext: data.customTone.enhancedContext,
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
            return (
              <button
                key={answer.id}
                type="button"
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
                          aria-label="Selected"
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
                  <span className="text-foreground">{answer.text}</span>
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
          disabled={isGenerating || selectedAnswerIds.length === 0}
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
