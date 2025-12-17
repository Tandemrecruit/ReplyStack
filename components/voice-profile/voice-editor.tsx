"use client";

import { useState } from "react";

import type { VoiceProfile } from "@/lib/supabase/types";

interface VoiceEditorProps {
  profile?: Partial<VoiceProfile>;
  onSave?: (profile: Partial<VoiceProfile>) => void;
}

const TONE_OPTIONS = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and approachable",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished and business-like",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed and conversational",
  },
  { value: "formal", label: "Formal", description: "Traditional and reserved" },
];

/**
 * Client-side voice profile editor for configuring AI response tone.
 *
 * @param profile - Partial voice profile defaults to seed the form.
 * @param onSave - Invoked with updated profile when the form is submitted.
 */
export function VoiceEditor({ profile, onSave }: VoiceEditorProps) {
  const [formData, setFormData] = useState({
    tone: profile?.tone ?? "friendly",
    personality_notes: profile?.personality_notes ?? "",
    sign_off_style: profile?.sign_off_style ?? "",
    max_length: profile?.max_length ?? 150,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tone Selection */}
      <div>
        <p className="block text-sm font-medium text-foreground mb-3">
          Response Tone
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, tone: option.value })}
              className={`
                p-4 rounded-lg border text-left transition-colors
                ${
                  formData.tone === option.value
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
          ))}
        </div>
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
        <input
          id="maxlength"
          type="number"
          min={50}
          max={500}
          value={formData.max_length}
          onChange={(e) =>
            setFormData({
              ...formData,
              max_length: parseInt(e.target.value, 10),
            })
          }
          className="w-32 px-3 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="ml-2 text-sm text-foreground-secondary">words</span>
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
