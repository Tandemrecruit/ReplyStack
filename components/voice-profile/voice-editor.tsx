"use client";

import { useEffect, useState } from "react";

import type { VoiceProfile } from "@/lib/supabase/types";
import type { CustomTone } from "@/lib/types/custom-tone";

interface VoiceEditorProps {
  profile?: Partial<VoiceProfile>;
  onSave?: (profile: Partial<VoiceProfile>) => void;
}

const TONE_OPTIONS = [
  {
    value: "warm",
    label: "Warm",
    description: "Warm and approachable",
  },
  {
    value: "direct",
    label: "Direct",
    description: "Straightforward and to the point",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished and business-like",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Conversational and personable",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed and informal",
  },
];

/**
 * Editable form for configuring an AI voice profile.
 *
 * Manages local form state for tone, personality notes, sign-off style, maximum response length,
 * example responses, and words to use/avoid. Invokes the provided `onSave` callback with the
 * current profile values when the form is submitted.
 *
 * @param props.profile - Optional initial values to prefill the form (partial VoiceProfile).
 * @param props.onSave - Optional callback invoked with the updated partial VoiceProfile on submit.
 */
export function VoiceEditor({ profile, onSave }: VoiceEditorProps) {
  const getInitialMaxLengthError = (value: number): string | null => {
    if (value < 50 || value > 500) {
      return "Maximum response length must be between 50 and 500 words";
    }
    return null;
  };

  // Normalize NaN to empty string for input value
  const normalizeMaxLength = (
    value: number | null | undefined,
  ): number | string => {
    if (value === null || value === undefined) {
      return 150;
    }
    if (typeof value === "number" && Number.isNaN(value)) {
      return "";
    }
    return value;
  };

  const normalizedMaxLength = normalizeMaxLength(profile?.max_length);

  const [formData, setFormData] = useState<{
    tone: string;
    personality_notes: string;
    sign_off_style: string;
    max_length: number | string;
    example_responses: string[];
    words_to_use: string[];
    words_to_avoid: string[];
  }>({
    tone: profile?.tone ?? "warm",
    personality_notes: profile?.personality_notes ?? "",
    sign_off_style: profile?.sign_off_style ?? "",
    max_length: normalizedMaxLength,
    example_responses: profile?.example_responses ?? [],
    words_to_use: profile?.words_to_use ?? [],
    words_to_avoid: profile?.words_to_avoid ?? [],
  });

  // Local state for text inputs that will be parsed into arrays
  const [wordsToUseInput, setWordsToUseInput] = useState(
    profile?.words_to_use?.join(", ") ?? "",
  );
  const [wordsToAvoidInput, setWordsToAvoidInput] = useState(
    profile?.words_to_avoid?.join(", ") ?? "",
  );
  const [newExampleResponse, setNewExampleResponse] = useState("");

  const [errors, setErrors] = useState<string | null>(null);
  const [maxLengthError, setMaxLengthError] = useState<string | null>(() => {
    if (normalizedMaxLength === "") {
      return "Maximum response length must be between 50 and 500 words";
    }
    if (typeof normalizedMaxLength === "number") {
      return getInitialMaxLengthError(normalizedMaxLength);
    }
    return null;
  });
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [isLoadingCustomTones, setIsLoadingCustomTones] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchCustomTones = async () => {
      try {
        const response = await fetch("/api/custom-tones", { signal });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch custom tones: ${response.status} ${response.statusText}`,
          );
        }

        let data: CustomTone[] = [];
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing custom tones response:", parseError);
          throw new Error("Invalid JSON response from server");
        }

        if (!signal.aborted && Array.isArray(data)) {
          setCustomTones(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching custom tones:", error);
      } finally {
        if (!signal.aborted) {
          setIsLoadingCustomTones(false);
        }
      }
    };

    fetchCustomTones();

    return () => {
      controller.abort();
    };
  }, []);

  const validateMaxLength = (value: number | string): boolean => {
    if (value === "" || value === null || value === undefined) {
      setMaxLengthError(
        "Maximum response length must be between 50 and 500 words",
      );
      return false;
    }
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    if (Number.isNaN(numValue) || numValue < 50 || numValue > 500) {
      setMaxLengthError(
        "Maximum response length must be between 50 and 500 words",
      );
      return false;
    }
    setMaxLengthError(null);
    return true;
  };

  // Parse comma-separated input into array, filtering empty strings
  const parseCommaSeparated = (input: string): string[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Add a new example response
  const handleAddExampleResponse = () => {
    const trimmed = newExampleResponse.trim();
    if (trimmed && formData.example_responses.length < 5) {
      setFormData({
        ...formData,
        example_responses: [...formData.example_responses, trimmed],
      });
      setNewExampleResponse("");
    }
  };

  // Remove an example response by index
  const handleRemoveExampleResponse = (index: number) => {
    setFormData({
      ...formData,
      example_responses: formData.example_responses.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    // Validate max_length is within range
    if (!validateMaxLength(formData.max_length)) {
      return;
    }

    // Ensure max_length is a number before saving
    const maxLengthNum =
      typeof formData.max_length === "string"
        ? parseInt(formData.max_length, 10)
        : formData.max_length;

    // Parse words inputs
    const wordsToUse = parseCommaSeparated(wordsToUseInput);
    const wordsToAvoid = parseCommaSeparated(wordsToAvoidInput);

    onSave?.({
      tone: formData.tone,
      personality_notes: formData.personality_notes,
      sign_off_style: formData.sign_off_style,
      max_length: maxLengthNum,
      example_responses:
        formData.example_responses.length > 0
          ? formData.example_responses
          : null,
      words_to_use: wordsToUse.length > 0 ? wordsToUse : null,
      words_to_avoid: wordsToAvoid.length > 0 ? wordsToAvoid : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ARIA live region for error announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {maxLengthError && <span>{maxLengthError}</span>}
        {errors && <span>{errors}</span>}
      </div>

      {errors && (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {errors}
        </div>
      )}

      {/* Tone Selection */}
      <div>
        <p className="block text-sm font-medium text-foreground mb-3">
          Response Tone
        </p>

        {/* Standard Tones */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground-secondary mb-2">
            Standard Tones
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TONE_OPTIONS.map((option) => {
              const isSelected =
                formData.tone === option.value &&
                !formData.tone.startsWith("custom:");
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, tone: option.value })
                  }
                  className={`
                    p-4 rounded-lg border text-left transition-colors
                    ${
                      isSelected
                        ? "border-primary-500 bg-primary-50"
                        : "border-border hover:border-border-hover"
                    }
                  `}
                >
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-foreground-secondary">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Tones */}
        {isLoadingCustomTones && (
          <div>
            <p className="text-sm font-medium text-foreground-secondary mb-2">
              Custom Tones
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-border animate-pulse"
                >
                  <div className="h-5 bg-foreground-muted rounded mb-2 w-3/4" />
                  <div className="h-4 bg-foreground-muted rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
        {!isLoadingCustomTones && customTones.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground-secondary mb-2">
              Custom Tones
            </p>
            <div className="grid grid-cols-2 gap-3">
              {customTones.map((customTone) => {
                const customToneValue = `custom:${customTone.id}`;
                const isSelected = formData.tone === customToneValue;
                return (
                  <button
                    key={customTone.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, tone: customToneValue })
                    }
                    className={`
                      p-4 rounded-lg border text-left transition-colors
                      ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-border hover:border-border-hover"
                      }
                    `}
                  >
                    <p className="font-medium text-foreground">
                      {customTone.name}
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      {customTone.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {!isLoadingCustomTones && customTones.length === 0 && (
          <div>
            <p className="text-sm font-medium text-foreground-secondary mb-2">
              Custom Tones
            </p>
            <p className="text-sm text-foreground-muted">
              No custom tones available. Create one using the tone quiz.
            </p>
          </div>
        )}
      </div>

      {/* Personality Notes */}
      <div>
        <label
          htmlFor="personality-notes"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Personality Notes
        </label>
        <textarea
          id="personality-notes"
          value={formData.personality_notes}
          onChange={(e) =>
            setFormData({ ...formData, personality_notes: e.target.value })
          }
          rows={3}
          placeholder="Family restaurant since 1985. We know our regulars by name."
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-foreground-muted">
          Brief description of your business personality
        </p>
      </div>

      {/* Example Responses - NEW FIELD */}
      <div>
        <label
          htmlFor="example-responses-input"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Example Responses
          <span className="ml-1 font-normal text-foreground-muted">
            ({formData.example_responses.length}/5)
          </span>
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          Paste 3-5 review replies you&apos;ve written that capture your voice.
          The AI will learn from these.
        </p>

        {/* Existing examples */}
        {formData.example_responses.length > 0 && (
          <div className="space-y-2 mb-3">
            {formData.example_responses.map((response, index) => (
              <div
                key={response}
                className="flex items-start gap-2 p-3 bg-background-secondary rounded-md border border-border"
              >
                <p className="flex-1 text-sm text-foreground line-clamp-2">
                  {response}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveExampleResponse(index)}
                  className="text-foreground-muted hover:text-red-600 transition-colors"
                  aria-label={`Remove example ${index + 1}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new example */}
        {formData.example_responses.length < 5 && (
          <div className="flex gap-2">
            <textarea
              id="example-responses-input"
              value={newExampleResponse}
              onChange={(e) => setNewExampleResponse(e.target.value)}
              rows={2}
              placeholder="Thanks so much for the kind words, Sarah! Our team works hard to make every visit special. Hope to see you again soon. — Mike"
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddExampleResponse}
              disabled={!newExampleResponse.trim()}
              className="px-4 py-2 bg-primary-100 text-primary-700 rounded-md font-medium hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Sign-off Style */}
      <div>
        <label
          htmlFor="sign-off-style"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Sign-off Style
        </label>
        <input
          type="text"
          id="sign-off-style"
          value={formData.sign_off_style}
          onChange={(e) =>
            setFormData({ ...formData, sign_off_style: e.target.value })
          }
          placeholder="— Mike, Owner"
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-foreground-muted">
          How you sign off on responses (name, title, business)
        </p>
      </div>

      {/* Words to Use - NEW FIELD */}
      <div>
        <label
          htmlFor="words-to-use"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Words to Use
        </label>
        <input
          type="text"
          id="words-to-use"
          value={wordsToUseInput}
          onChange={(e) => setWordsToUseInput(e.target.value)}
          placeholder="family-owned, handcrafted, neighborhood, thank you"
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-foreground-muted">
          Brand terms and phrases you want the AI to include (comma-separated)
        </p>
      </div>

      {/* Words to Avoid - NEW FIELD */}
      <div>
        <label
          htmlFor="words-to-avoid"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Words to Avoid
        </label>
        <input
          type="text"
          id="words-to-avoid"
          value={wordsToAvoidInput}
          onChange={(e) => setWordsToAvoidInput(e.target.value)}
          placeholder="sorry for any inconvenience, valued customer, competitor names"
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-foreground-muted">
          Words or phrases the AI should never use (comma-separated)
        </p>
      </div>

      {/* Maximum Response Length */}
      <div>
        <label
          htmlFor="max-length"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Maximum Response Length
        </label>
        <div className="flex items-center">
          <input
            type="number"
            id="max-length"
            min={50}
            max={500}
            step={10}
            value={
              typeof formData.max_length === "number"
                ? Number.isNaN(formData.max_length)
                  ? ""
                  : formData.max_length
                : formData.max_length
            }
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setFormData({
                  ...formData,
                  max_length: "",
                });
                validateMaxLength("");
              } else {
                const parsed = parseInt(raw, 10);
                setFormData({
                  ...formData,
                  max_length: parsed,
                });
                validateMaxLength(parsed);
              }
            }}
            aria-invalid={maxLengthError ? "true" : "false"}
            aria-describedby={maxLengthError ? "maxlength-error" : undefined}
            className={`w-32 px-3 py-2 bg-surface border rounded-md text-foreground focus:outline-none focus:ring-2 ${
              maxLengthError
                ? "border-red-500 focus:ring-red-500"
                : "border-border focus:ring-primary-500"
            }`}
          />
          <span className="ml-2 text-sm text-foreground-secondary">words</span>
        </div>
      </div>
      {maxLengthError && (
        <div
          id="maxlength-error"
          role="alert"
          className="mt-2 text-sm text-red-700"
        >
          {maxLengthError}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
        >
          Save Voice Profile
        </button>
      </div>
    </form>
  );
}
