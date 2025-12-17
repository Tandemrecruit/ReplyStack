import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ReplyStack",
  description: "Sign in to your ReplyStack account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-foreground-secondary">
          Sign in to manage your reviews
        </p>
      </div>

      {/* TODO: Add login form */}
      <div className="p-6 bg-surface rounded-lg border border-border">
        <p className="text-foreground-muted text-center">
          Login form coming soon
        </p>
      </div>
    </div>
  );
}
