import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | ReplyStack",
  description: "Manage your ReplyStack settings",
};

/**
 * Render the Settings page containing Google Business Profile, Voice Profile, and Notifications sections.
 *
 * The page includes controls to connect a Google account, configure voice/tone settings (tone select,
 * personality notes, sign-off style), and toggle email notifications. Markup and form controls include
 * accessible labels and ids for better semantics.
 *
 * @returns The React element for the Settings page
 */
export default function SettingsPage() {
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
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 bg-surface border border-border rounded-md font-medium text-foreground hover:bg-background-secondary transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Google logo</title>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Connect Google Account
          </button>
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
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="tone-select"
            >
              Tone
            </label>
            <select
              id="tone-select"
              className="mt-1 w-full max-w-xs px-3 py-2 bg-surface border border-border rounded-md text-foreground"
            >
              <option>Friendly</option>
              <option>Professional</option>
              <option>Casual</option>
              <option>Formal</option>
            </select>
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
              className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted"
              rows={3}
              placeholder="e.g., Family-owned restaurant since 1985, known for our wood-fired pizzas..."
            />
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
              className="mt-1 w-full max-w-xs px-3 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-foreground-muted"
              placeholder="e.g., — John, Owner"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </section>

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
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600"
            >
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}