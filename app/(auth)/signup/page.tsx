import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | ReplyStack",
  description: "Create your ReplyStack account",
};

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

