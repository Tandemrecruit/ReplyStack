"use client";

import { useEffect, useState } from "react";

import type { VoiceProfile } from "@/lib/supabase/types";

type CustomTone = {
  id: string;
  name: string;
  description: string;
  enhanced_context: string;
  created_at: string;
};

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
 * Manages local form state for tone, personality notes, sign-off style, and maximum response length,
 * and invokes the provided `onSave` callback with the current profile values when the form is submitted.
 *
 * @param props.profile - Optional initial values to prefill the form (partial VoiceProfile).
 * @param props.onSave - Optional callback invoked with the updated partial VoiceProfile on submit.
 *
 */
export function VoiceEditor({ profile, onSave }: VoiceEditorProps) {
  const initialMaxLength = profile?.max_length ?? 150;
  const getInitialMaxLengthError = (value: number): string | null => {
    if (value < 50 || value > 500) {
      return "Maximum response length must be between 50 and 500 words";
    }
    return null;
  };

  const [formData, setFormData] = useState<{
    tone: string;
    personality_notes: string;
    sign_off_style: string;
    max_length: number | string;
  }>({
    tone: profile?.tone ?? "warm",
    personality_notes: profile?.personality_notes ?? "",
    sign_off_style: profile?.sign_off_style ?? "",
    max_length: initialMaxLength,
  });
  const [errors, setErrors] = useState<string | null>(null);
  const [maxLengthError, setMaxLengthError] = useState<string | null>(
    getInitialMaxLengthError(initialMaxLength),
  );
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [isLoadingCustomTones, setIsLoadingCustomTones] = useState(true);

  useEffect(() => {
    const fetchCustomTones = async () => {
      try {
        const response = await fetch("/api/custom-tones");
        const data = await response.json().catch(() => []);
        if (Array.isArray(data)) {
          setCustomTones(data);
        }
      } catch (error) {
        console.error("Error fetching custom tones:", error);
      } finally {
        setIsLoadingCustomTones(false);
      }
    };

    fetchCustomTones();
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

    onSave?.({
      ...formData,
      max_length: maxLengthNum,
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
      </div>

      {/* Personality Notes */}
      <div>
        <label
          htmlFor="personality"
          className="block text-sm font-medium text-foreground"
        >
          Personality Notes
        </label>
        <p className="text-sm text-foreground-muted mb-2">
          Describe your business personality and unique characteristics
        </p>
        <textarea
          id="personality"
          value={formData.personality_notes}
          onChange={(e) =>
            setFormData({ ...formData, personality_notes: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., Family-owned Italian restaurant since 1985. Known for our wood-fired pizzas and friendly service. We treat every customer like family."
        />
      </div>

      {/* Sign-off Style */}
      <div>
        <label
          htmlFor="signoff"
          className="block text-sm font-medium text-foreground"
        >
          Sign-off Style
        </label>
        <p className="text-sm text-foreground-muted mb-2">
          How should responses end?
        </p>
        <input
          id="signoff"
          type="text"
          value={formData.sign_off_style}
          onChange={(e) =>
            setFormData({ ...formData, sign_off_style: e.target.value })
          }
          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., — Maria, Owner"
        />
      </div>

      {/* Max Length */}
      <div>
        <label
          htmlFor="maxlength"
          className="block text-sm font-medium text-foreground"
        >
          Maximum Response Length
        </label>
        <p className="text-sm text-foreground-muted mb-2">
          Target word count for responses
        </p>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              id="maxlength"
              type="number"
              min={50}
              max={500}
              value={
                typeof formData.max_length === "number" &&
                Number.isNaN(formData.max_length)
                  ? ""
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
            <span className="ml-2 text-sm text-foreground-secondary">
              words
            </span>
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
      </div>

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
