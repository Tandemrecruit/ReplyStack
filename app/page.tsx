import type { Metadata } from "next";
import Link from "next/link";

import { LiveDemo } from "@/components/landing/live-demo";
import { WaitlistForm } from "@/components/landing/waitlist-form";

export const metadata: Metadata = {
  title: "Replily | AI-Powered Review Responses for Local Businesses",
  description:
    "Respond to every Google review in minutes with replies that sound like you. Built for restaurants, dental practices, and local service businesses.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation - Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-white"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                Replily
              </span>
            </Link>

            <Link
              href="#waitlist"
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-all shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Form Above Fold */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-primary-500/20 to-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-to-tr from-accent-400/15 to-primary-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 border border-accent-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                </span>
                <span className="text-sm font-medium text-accent-700">
                  Limited early access — 47 spots left
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight">
                Stop ignoring reviews.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
                  Start replying in minutes.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-foreground-secondary max-w-lg mx-auto lg:mx-0">
                AI-powered responses that sound like{" "}
                <em className="not-italic font-semibold text-foreground">
                  you
                </em>{" "}
                wrote them. Built for restaurants, dental practices, and local
                shops.
              </p>

              {/* Social proof - simple and honest */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border">
                <span className="text-sm text-foreground-secondary">
                  Built for{" "}
                  <span className="font-semibold text-foreground">
                    local businesses
                  </span>{" "}
                  who actually respond to reviews
                </span>
              </div>
            </div>

            {/* Right: Waitlist Form */}
            <div id="waitlist" className="lg:pl-8">
              <div className="relative">
                {/* Glow effect behind form */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-accent-400/20 to-primary-500/20 rounded-3xl blur-2xl opacity-60" />
                <div className="relative">
                  <WaitlistForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-16 px-4 sm:px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              See it in action
            </h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              Paste any review, pick your tone, get a reply you&apos;d actually
              send.
            </p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* Benefits Section - Bento Grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header - more personality */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3">
              The end of &quot;I&apos;ll reply later&quot;
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Every review answered. None of the guilt.
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Large card - Speed, not time saved */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
                  From review to reply
                </p>
                <h3 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
                  Under 30 seconds
                </h3>
                <p className="text-foreground-secondary max-w-md">
                  New review comes in. You tap a button. A reply—in your
                  voice—is ready to publish. That&apos;s it.
                </p>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary-200/50 rounded-full blur-2xl group-hover:bg-primary-300/50 transition-colors" />
              <div className="absolute right-8 bottom-8 text-primary-300/40">
                <svg
                  className="w-32 h-32"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.92 6-4.72 7.28L13 17v5l5-5h-1.53c2.79-1.64 4.53-4.65 4.53-8 0-5.18-4.16-9.41-9-9.95zM11 2.05C6.03 2.52 2 6.74 2 12c0 3.35 1.74 6.36 4.53 8H5l5 5v-5l-2.28 2.28C4.92 20 3 17.21 3 14c0-4.08 3.05-7.44 7-7.93V2.05z" />
                </svg>
              </div>
            </div>

            {/* Tall card - Your voice */}
            <div className="md:col-span-2 md:row-span-2 p-6 rounded-3xl bg-gradient-to-b from-accent-50 to-accent-100 border border-accent-200 flex flex-col relative overflow-hidden">
              <div>
                <p className="text-sm font-semibold text-accent-600 uppercase tracking-wide mb-3">
                  Your voice
                </p>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Sounds like you wrote it
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Not generic AI. Your tone, your personality.
                </p>
              </div>

              {/* Mini example */}
              <div className="mt-4 p-4 rounded-2xl bg-surface border border-border flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Joe&apos;s Pizza
                  </p>
                </div>
                <p className="text-sm text-foreground">
                  &quot;Hey Sarah! That thin crust is my dad&apos;s recipe from
                  &apos;94—glad it&apos;s still a hit. See you next time! —
                  Joe&quot;
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium">
                    Warm
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    Personal
                  </span>
                </div>
              </div>
            </div>

            {/* Wide card - Response rate - FIXED: items-center instead of items-start */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-foreground text-background relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                  100%
                </div>
                <div>
                  <p className="font-semibold text-background">Response rate</p>
                  <p className="text-sm opacity-70">
                    Finally answer every single one
                  </p>
                </div>
              </div>
            </div>

            {/* Small card - Tough reviews */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-surface border border-border relative overflow-hidden group hover:border-primary-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-2xl">
                  <span>😤</span>
                  <span className="text-foreground-muted text-base">→</span>
                  <span>🤝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Tough reviews?
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Turn them into second chances
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-surface/50 to-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to reply faster?
          </h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            Join the waitlist and be first to try Replily when we launch.
          </p>
          <Link
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            Get Early Access
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-7-7l7 7-7 7"
              />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-foreground-muted">
            No credit card required • Free during beta
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-white"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <span className="font-semibold text-foreground">Replily</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="mailto:support@replily.com"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>

          <p className="text-sm text-foreground-muted">© 2025 Replily</p>
        </div>
      </footer>
    </div>
  );
}
