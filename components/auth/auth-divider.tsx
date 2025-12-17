"use client";

type AuthDividerProps = {
  text?: string;
};

export function AuthDivider({ text = "Or continue with" }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-surface text-foreground-muted">{text}</span>
      </div>
    </div>
  );
}
