"use client";

import { useEffect, useState } from "react";

import { GoogleConnectButton } from "@/components/settings/google-connect-button";
import { LocationSelector } from "@/components/settings/location-selector";
import { ToneQuiz } from "@/components/voice-profile/tone-quiz";

type CustomTone = {
  id: string;
  name: string;
  description: string;
  enhanced_context: string;
  created_at: string;
};

const TONE_OPTIONS = [
  { value: "warm", label: "Warm" },
  { value: "direct", label: "Direct" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
];

const DEFAULT_TONE = TONE_OPTIONS[0]?.value ?? "";

/**
 * Renders the Settings client UI for managing account integrations, connected locations,
 * voice profile, and notification preferences.
 *
 * The component loads the user's email notification preference on mount, provides
 * controls to toggle email notifications with optimistic UI and error handling,
 * and exposes a voice profile form (tone, personality notes, sign-off) with client-side
 * validation and a save action that persists changes to the server.
 *
 * @returns The Settings screen as a React element
 */
export function SettingsClient() {
  const [tone, setTone] = useState<string>(DEFAULT_TONE);
  const [personalityNotes, setPersonalityNotes] = useState<string>("");
  const [signOff, setSignOff] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [isUpdatingNotifications, setIsUpdatingNotifications] =
    useState<boolean>(false);
  const [isLoadingNotifications, setIsLoadingNotifications] =
    useState<boolean>(true);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const [fieldErrors, setFieldErrors] = useState<{
    tone?: string;
    personalityNotes?: string;
    signOff?: string;
  }>({});
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [isLoadingCustomTones, setIsLoadingCustomTones] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleSaveVoiceProfile = async () => {
    const errors: Record<string, string> = {};
    const trimmedNotes = personalityNotes.trim();
    const trimmedSignOff = signOff.trim();

    if (!tone) errors.tone = "Select a tone";
    if (!trimmedNotes) errors.personalityNotes = "Add personality details";
    if (!trimmedSignOff) errors.signOff = "Add a sign-off style";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus({
        type: "error",
        message: "Please complete all required voice profile fields.",
      });
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/voice-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          personality_notes: trimmedNotes,
          sign_off_style: trimmedSignOff,
        }),
      });

      let data: { error?: string } | undefined;
      try {
        data = await response.json();
      } catch {
        // Invalid JSON - will use default error message below
        data = undefined;
      }

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data?.error ?? "Failed to save voice profile.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Voice profile saved successfully.",
      });
    } catch (error) {
      console.error("Error saving voice profile", error);
      setStatus({
        type: "error",
        message: "Unable to save voice profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const colorMap: Record<string, string> = {
    success: "text-green-700",
    error: "text-red-700",
  };
  const feedbackColor = colorMap[status.type] ?? "text-foreground-secondary";

  useEffect(() => {
    const fetchNotificationPreference = async () => {
      setIsLoadingNotifications(true);
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json().catch(() => ({}));

        if (response.ok && typeof data.emailNotifications === "boolean") {
          setEmailNotifications(data.emailNotifications);
        }
      } catch (error) {
        console.error("Failed to load notification preferences", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    const fetchCustomTones = async () => {
      setIsLoadingCustomTones(true);
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

    fetchNotificationPreference();
    fetchCustomTones();
  }, []);

  const handleToggleEmailNotifications = async () => {
    const previousValue = emailNotifications;
    const nextValue = !previousValue;

    setEmailNotifications(nextValue);
    setIsUpdatingNotifications(true);
    setNotificationError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: nextValue }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update notifications");
      }
    } catch (error) {
      console.error("Failed to update email notifications", error);
      setEmailNotifications(previousValue);
      setNotificationError(
        "Unable to update email notifications. Please try again.",
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-foreground-secondary">
          Manage your account, voice profile, and integrations
        </p>
      </div>

      {/* Google Connection */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Google Business Profile
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Connect your Google account to fetch and respond to reviews
        </p>
        <div className="mt-4">
          <GoogleConnectButton />
        </div>
      </section>

      {/* Connected Locations */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Connected Locations
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Select which locations to sync reviews from
        </p>
        <div className="mt-4">
          <LocationSelector />
        </div>
      </section>

      {/* Voice Profile */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">Voice Profile</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Configure how AI-generated responses should sound
        </p>

        <div className="mt-6 space-y-6">
          {/* Tone Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="tone-select"
              >
                Tone
              </label>
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Take Tone Quiz
              </button>
            </div>

            {/* Standard Tones */}
            <div className="mb-4">
              <p className="text-xs font-medium text-foreground-secondary mb-1">
                Standard Tones
              </p>
              <select
                id="tone-select"
                value={tone.startsWith("custom:") ? "" : tone}
                onChange={(event) => setTone(event.target.value)}
                className={`w-full max-w-xs px-3 py-2 bg-surface border rounded-md text-foreground ${
                  fieldErrors.tone
                    ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    : "border-border"
                }`}
              >
                <option value="">Select a standard tone...</option>
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Tones */}
            {!isLoadingCustomTones && customTones.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground-secondary mb-1">
                  Custom Tones
                </p>
                <select
                  id="custom-tone-select"
                  value={tone.startsWith("custom:") ? tone : ""}
                  onChange={(event) => setTone(event.target.value)}
                  className={`w-full max-w-xs px-3 py-2 bg-surface border rounded-md text-foreground ${
                    fieldErrors.tone
                      ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      : "border-border"
                  }`}
                >
                  <option value="">Select a custom tone...</option>
                  {customTones.map((customTone) => (
                    <option
                      key={customTone.id}
                      value={`custom:${customTone.id}`}
                    >
                      {customTone.name} - {customTone.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {fieldErrors.tone ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.tone}</p>
            ) : null}
          </div>

          {/* Personality Notes */}
          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="personality-notes"
            >
              Personality Notes
            </label>
            <p className="text-sm text-foreground-muted">
              Describe your business personality and any specific details
            </p>
            <textarea
              id="personality-notes"
              value={personalityNotes}
              onChange={(event) => setPersonalityNotes(event.target.value)}
              className={`mt-1 w-full px-3 py-2 bg-surface border rounded-md text-foreground placeholder:text-foreground-muted ${
                fieldErrors.personalityNotes
                  ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  : "border-border"
              }`}
              rows={3}
              placeholder="e.g., Family-owned restaurant since 1985, known for our wood-fired pizzas..."
            />
            {fieldErrors.personalityNotes ? (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.personalityNotes}
              </p>
            ) : null}
          </div>

          {/* Sign-off */}
          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="signoff-input"
            >
              Sign-off Style
            </label>
            <input
              id="signoff-input"
              type="text"
              value={signOff}
              onChange={(event) => setSignOff(event.target.value)}
              className={`mt-1 w-full max-w-xs px-3 py-2 bg-surface border rounded-md text-foreground placeholder:text-foreground-muted ${
                fieldErrors.signOff
                  ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  : "border-border"
              }`}
              placeholder="e.g., — John, Owner"
            />
            {fieldErrors.signOff ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.signOff}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleSaveVoiceProfile}
            disabled={isSaving}
            aria-busy={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <output aria-live="polite" className={`text-sm ${feedbackColor}`}>
            {status.message ?? ""}
          </output>
        </div>
      </section>

      {/* Tone Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <ToneQuiz
              onComplete={(customTone) => {
                setShowQuiz(false);
                if (customTone) {
                  setTone(`custom:${customTone.id}`);
                  // Refresh custom tones list
                  fetch("/api/custom-tones")
                    .then((res) => res.json())
                    .then((data) => {
                      if (Array.isArray(data)) {
                        setCustomTones(data);
                      }
                    })
                    .catch(console.error);
                }
              }}
              onClose={() => setShowQuiz(false)}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Configure when and how you want to be notified
        </p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email notifications</p>
              <p className="text-sm text-foreground-secondary">
                Get notified when you receive new reviews
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              aria-busy={isUpdatingNotifications}
              aria-label="Email notifications"
              onClick={handleToggleEmailNotifications}
              disabled={isUpdatingNotifications || isLoadingNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                emailNotifications ? "bg-primary-600" : "bg-gray-300"
              } ${isUpdatingNotifications ? "opacity-75 cursor-progress" : ""}`}
            >
              <span
                className={`${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </button>
          </div>
          {notificationError ? (
            <p className="text-right text-sm text-red-600">
              {notificationError}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
