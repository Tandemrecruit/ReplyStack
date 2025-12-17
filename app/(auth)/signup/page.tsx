import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | ReplyStack",
  description: "Create your ReplyStack account",
};

/**
 * Renders the Signup page layout for ReplyStack with a header and a placeholder for the signup form.
 *
 * The layout includes a centered title and subtitle, and a card-like region indicating that the signup form will be added.
 *
 * @returns The JSX element for the signup page.
 */
export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Create account</h1>
        <p className="mt-2 text-foreground-secondary">
          Start responding to reviews in seconds
        </p>
      </div>

      {/* TODO: Add signup form */}
      <div className="p-6 bg-surface rounded-lg border border-border">
        <p className="text-foreground-muted text-center">
          Signup form coming soon
        </p>
      </div>
    </div>
  );
}