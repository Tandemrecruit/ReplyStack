import type { Metadata } from "next";
import Link from "next/link";

import { LiveDemo } from "@/components/landing/live-demo";

export const metadata: Metadata = {
  title: "ReplyStack | AI-Powered Review Responses for Local Businesses",
  description:
    "Respond to every Google Business review in 30 seconds with AI that sounds like you. Built for restaurants, dental practices, and local service businesses.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                ReplyStack
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(233,95,51,0.12),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(244,180,26,0.14),transparent_28%)]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center relative">
          <div className="text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-50 border border-accent-200 text-accent-800">
              <span className="text-sm font-semibold">
                Built for local businesses
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Respond to every review in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-400">
                30 seconds
              </span>{" "}
              with replies that sound like you.
            </h1>

            <p className="text-xl text-foreground-secondary max-w-2xl">
              Owner-quality replies, drafted for you in seconds—without the
              canned “AI voice.” Built for busy restaurants, dental practices,
              and service shops that need to sound like the real you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/25"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 border border-foreground text-foreground font-semibold rounded-full hover:border-primary-500 hover:text-primary-700 transition-colors bg-surface"
              >
                See How It Works
              </Link>
              <Link
                href="#live-demo"
                className="w-full sm:w-auto px-8 py-4 border border-dashed border-primary-400 text-primary-700 font-semibold rounded-full hover:bg-primary-50 transition-colors bg-surface"
              >
                See a live example
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-foreground-muted">
                No credit card required. Cancel anytime.
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="flex -space-x-2">
                  {[
                    { initials: "JM", label: "Jasmine (salon owner)" },
                    { initials: "DC", label: "Dr. Chen (dentist)" },
                    { initials: "MR", label: "Marco (restaurant owner)" },
                  ].map((item) => (
                    <div
                      key={item.initials}
                      title={item.label}
                      aria-hidden="true"
                      className="w-8 h-8 rounded-full border-2 border-surface bg-gradient-to-br from-primary-500 to-accent-400 text-white text-[11px] font-bold flex items-center justify-center shadow-sm"
                    >
                      {item.initials}
                    </div>
                  ))}
                </div>
                <span className="text-foreground-secondary">
                  140+ local owners publish replies with ReplyStack
                </span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="absolute -left-6 -top-6 w-28 h-28 rounded-3xl border border-accent-200 bg-accent-50/80 blur-0" />
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border border-primary-200 bg-primary-50/70" />

            <div className="relative space-y-4">
              <div className="p-6 rounded-2xl bg-surface border border-border shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                      GB
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Green Bistro
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Austin, TX · Google
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-accent-50 text-accent-700 border border-accent-200">
                    New review
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-4 h-4 text-star"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <title>Star rating</title>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-foreground-muted">
                      Sarah M.
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    "Best pizza in Austin! The thin crust is perfect and
                    delivery was super fast."
                  </p>
                </div>

                <div className="rounded-xl border border-primary-200 bg-surface-elevated p-4 mt-4 space-y-2 shadow-sm shadow-primary-500/10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary-700">
                      Draft reply
                    </p>
                    <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded-full border border-primary-100">
                      Owner tone
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    Sarah, thanks for the kind words. The thin crust is my
                    dad&apos;s recipe from 1994, and our team hustles to keep
                    deliveries quick. Can&apos;t wait to have you back. — Joe
                    (owner)
                  </p>
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>Voice: Warm • Neighborly • First-person</span>
                    <span>Tone score: 96 (last 30 days)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <div className="flex gap-1">
                      {["Warm", "Direct", "Cheerful"].map((tone) => (
                        <span
                          key={tone}
                          className="px-2 py-1 rounded-full border border-border bg-surface text-foreground"
                        >
                          {tone}
                        </span>
                      ))}
                    </div>
                    <span className="ml-auto text-foreground-muted">
                      Tap to preview
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-border text-sm font-semibold text-foreground hover:border-primary-500 hover:text-primary-700 transition-colors"
                  >
                    Edit reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LiveDemo />

      {/* Social Proof */}
      <section className="py-12 border-y border-border bg-background-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-foreground-muted mb-6 tracking-wide uppercase">
            Trusted by local businesses
          </p>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background-secondary to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background-secondary to-transparent" />
            <div className="flex gap-3 overflow-x-auto py-1 px-1 md:justify-center md:flex-wrap">
              {[
                "Maria's Corner Bakery · Tulsa",
                "Dr. Chen Family Dental · Seattle",
                "QuickFix HVAC · Denver",
                "Southside Barbers · Austin",
                "Harborview Auto · Tampa",
              ].map((name) => (
                <div
                  key={name}
                  className="shrink-0 px-4 py-2 rounded-full border border-accent-200 bg-accent-50 text-accent-800 text-sm font-semibold"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="how-it-works"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_30%_20%,rgba(233,95,51,0.06),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(244,180,26,0.08),transparent_26%)]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How ReplyStack Works
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
              Three simple steps, built for local owners—not AI tinkerers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Connect Google",
                description:
                  "Link your Google Business Profile in one click. We import your last 200 reviews in about a minute.",
              },
              {
                title: "Set Your Voice",
                description:
                  "We learn from your past replies + a 6-question tone quiz. Choose Warm, Direct, or Concierge tone on each draft.",
              },
              {
                title: "Respond Instantly",
                description:
                  "Generate, tweak, and publish straight to Google—no copy/paste. Most owners publish the first draft without edits.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="relative p-8 bg-surface rounded-2xl border border-accent-200 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-6 border border-primary-200">
                  <span className="text-lg font-bold text-primary-700">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-foreground-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Stop ignoring reviews.
                <br />
                <span className="text-primary-600">
                  Start building relationships.
                </span>
              </h2>
              <p className="mt-6 text-lg text-foreground-secondary">
                Every unanswered review is a missed opportunity. Customers
                expect a human reply—and 89% read business responses before
                choosing.
              </p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-success flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Included</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">
                    <strong>Save 10+ hours per week</strong> on review
                    management (avg across single-location shops)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-success flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Included</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">
                    <strong>100% response rate</strong> without hiring extra
                    help
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-success flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Included</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">
                    <strong>Replies that sound owner-written</strong> with your
                    tone locked in
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-success flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Included</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">
                    <strong>Defuse tough reviews</strong> with calm, accountable
                    replies you approve
                  </span>
                </li>
              </ul>
            </div>

            {/* Proof points instead of duplicate preview */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Avg. response time",
                  value: "27 sec",
                  meta: "Last 30 days",
                },
                {
                  label: "Response rate",
                  value: "100%",
                  meta: "Across 124 recent reviews",
                },
                {
                  label: "Tone match score",
                  value: "96/100",
                  meta: "Owner-approved replies",
                },
                {
                  label: "Hours saved weekly",
                  value: "10+",
                  meta: "Single-location average",
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="p-5 rounded-2xl border border-accent-200 bg-surface shadow-sm flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground-muted">
                      {item.label}
                    </p>
                    {index === 0 ? (
                      <span className="text-[11px] px-2 py-1 rounded-full border border-primary-200 bg-primary-50 text-primary-700">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {item.value}
                  </p>
                  <p className="text-xs text-foreground-muted">{item.meta}</p>
                  {index === 2 ? (
                    <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full w-[92%] bg-gradient-to-r from-primary-500 to-accent-400" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            One plan, all features. No hidden fees.
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Best for single-location shops getting 10–200 reviews per month.
          </p>

          {/* Pricing Card */}
          <div className="mt-12 max-w-md mx-auto p-8 bg-surface rounded-2xl border border-border shadow-lg shadow-primary-500/10">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-700 mb-4">
              <span className="inline-block h-1.5 w-10 rounded-full bg-primary-500" />
              PRO PLAN
              <span className="inline-block h-1.5 w-10 rounded-full bg-accent-400" />
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-foreground">$49</span>
              <span className="text-foreground-secondary">/month</span>
            </div>

            <ul className="mt-8 space-y-4 text-left">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Included</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-foreground">Unlimited AI responses</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Included</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-foreground">1 business location</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Included</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-foreground">Custom voice profile</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Included</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-foreground">Email notifications</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Included</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-foreground">Priority support</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="mt-8 block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors text-center shadow-sm shadow-primary-500/25"
            >
              Start 14-Day Free Trial
            </Link>
            <p className="mt-3 text-sm text-foreground-muted">
              No credit card required
            </p>
            <div className="mt-4 text-sm text-foreground-secondary space-y-2">
              <p>
                Questions?{" "}
                <Link
                  href="mailto:support@replystack.com"
                  className="text-primary-700 hover:underline"
                >
                  Email us
                </Link>
              </p>
              <p>
                Quick answers:{" "}
                <Link
                  href="/pricing-faq"
                  className="text-primary-700 hover:underline"
                >
                  Pricing FAQ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0f3d3e] via-[#0c3233] to-[#0f3d3e] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to transform your review management?
          </h2>
          <p className="text-xl text-accent-100">
            Join hundreds of local businesses responding faster with ReplyStack.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-full hover:bg-accent-50 transition-colors"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white/70 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              View the app
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                ReplyStack
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-foreground-secondary">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link
                href="mailto:support@replystack.com"
                className="hover:text-foreground"
              >
                Contact
              </Link>
              <Link
                href="mailto:support@replystack.com?subject=Help%20choosing%20a%20plan"
                className="hover:text-foreground"
              >
                Need help choosing?
              </Link>
            </div>

            <p className="text-sm text-foreground-muted">
              &copy; {new Date().getFullYear()} ReplyStack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
