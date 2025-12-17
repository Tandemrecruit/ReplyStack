"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const TONES = ["Warm", "Direct", "Concise"] as const;

type Tone = (typeof TONES)[number];

interface SampleReview {
  id: string;
  label: string;
  text: string;
}

const SAMPLE_REVIEWS: SampleReview[] = [
  {
    id: "salon-mixed",
    label: "Salon (mixed)",
    text: "The stylist was kind and fast. Booking online was easy. Parking was a little tricky, but I’m happy with the cut.",
  },
  {
    id: "hvac-positive",
    label: "HVAC (positive)",
    text: "Tech showed up right on time and explained everything clearly. The repair was quick and the price felt fair. Appreciate the professionalism.",
  },
  {
    id: "dental-negative",
    label: "Dental (tough)",
    text: "Staff was friendly but I waited 40 minutes past my appointment time. The cleaning was fine, but the delay was frustrating.",
  },
];

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function detectTopics(review: string) {
  const lowered = review.toLowerCase();

  return {
    mentionsParking: lowered.includes("parking"),
    mentionsWait:
      lowered.includes("wait") ||
      lowered.includes("waiting") ||
      lowered.includes("late") ||
      lowered.includes("delay"),
    mentionsBooking: lowered.includes("booking") || lowered.includes("book"),
    mentionsPrice:
      lowered.includes("price") ||
      lowered.includes("pricing") ||
      lowered.includes("expensive") ||
      lowered.includes("fair"),
  };
}

/**
 * Constructs a short draft reply tailored to the review content and the chosen tone.
 *
 * Analyzes `review` for mentions of parking, wait times, booking, and pricing and includes
 * tone-appropriate sentences that address any detected topics, then appends a closing line.
 *
 * @param review - The review text to analyze and respond to.
 * @param tone - The reply voice to use (`"Warm" | "Direct" | "Concise"`).
 * @returns The composed reply text that addresses detected topics and matches the selected tone.
 */
function buildDraftReply(review: string, tone: Tone): string {
  const clean = normalize(review);
  const topics = detectTopics(clean);

  const openerByTone: Record<Tone, string> = {
    Warm: "Thanks so much for the thoughtful review.",
    Direct: "Thanks for the review—appreciate you sharing the details.",
    Concise: "Thanks for the review.",
  };

  const gratitudeByTone: Record<Tone, string> = {
    Warm: "I’m really glad you had a good experience overall.",
    Direct: "I’m glad the visit went well overall.",
    Concise: "Glad it went well overall.",
  };

  const closeByTone: Record<Tone, string> = {
    Warm: "If you’re ever back in, say hi—I’d love to take care of you again. — Alex (owner)",
    Direct: "If you’re back in, we’d love to see you again. — Alex (owner)",
    Concise: "Hope to see you again. — Alex (owner)",
  };

  const sentences: string[] = [];
  sentences.push(openerByTone[tone]);

  if (topics.mentionsWait) {
    if (tone === "Concise") {
      sentences.push("Sorry about the wait—our goal is to stay on schedule.");
    } else {
      sentences.push(
        "I’m sorry about the wait—that’s not the experience we want for you, and we’re tightening our scheduling so it doesn’t happen again.",
      );
    }
  }

  if (topics.mentionsBooking) {
    sentences.push(
      tone === "Concise"
        ? "Glad booking was easy."
        : "I’m glad the online booking was easy—making things simple is a big priority for us.",
    );
  }

  if (topics.mentionsParking) {
    sentences.push(
      tone === "Concise"
        ? "Parking can be tricky—we’re improving directions."
        : "Parking can definitely be tricky. We’re updating our directions and signage so it’s easier next time.",
    );
  }

  if (topics.mentionsPrice) {
    sentences.push(
      tone === "Concise"
        ? "Appreciate the note on pricing."
        : "Thanks for mentioning pricing—we try to keep things straightforward and fair.",
    );
  }

  // If none of the above topics hit, add a generic gratitude line for balance.
  if (
    !topics.mentionsWait &&
    !topics.mentionsBooking &&
    !topics.mentionsParking &&
    !topics.mentionsPrice
  ) {
    sentences.push(gratitudeByTone[tone]);
  }

  sentences.push(closeByTone[tone]);

  // Keep it readable: join with spaces, but avoid double punctuation.
  return sentences.join(" ");
}

/**
 * Interactive demo that generates an owner reply draft from a review and a chosen tone.
 *
 * Renders a self-contained "Try a sample reply" UI where users can paste or pick a sample
 * review, choose a tone (Warm, Direct, Concise), and see a live preview of the incoming
 * review and the generated draft reply. Controls include tone buttons, a review textarea,
 * a sample selector, and action links for starting a trial or viewing the app.
 *
 * @returns The rendered live-demo section as a JSX.Element
 */
export function LiveDemo() {
  const [tone, setTone] = useState<Tone>("Warm");
  const [sampleId, setSampleId] = useState<string>(SAMPLE_REVIEWS[0]?.id ?? "");
  const [reviewText, setReviewText] = useState<string>(
    SAMPLE_REVIEWS[0]?.text ?? "",
  );

  const draft = useMemo(
    () => buildDraftReply(reviewText, tone),
    [reviewText, tone],
  );

  function handlePickSample(nextId: string) {
    const found = SAMPLE_REVIEWS.find((r) => r.id === nextId);
    if (!found) return;
    setSampleId(found.id);
    setReviewText(found.text);
  }

  return (
    <section
      id="live-demo"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border/60"
    >
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary-700 uppercase tracking-wide">
            Try a sample reply
          </p>
          <h2 className="text-3xl font-bold text-foreground">
            Paste a review, pick a tone
          </h2>
          <p className="text-lg text-foreground-secondary">
            This is an example preview of what owners publish: short, specific,
            and human. In the app you can tweak the draft and publish to Google.
          </p>

          <div className="flex flex-wrap gap-3">
            {TONES.map((t) => {
              const isActive = t === tone;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary-600 text-white border border-primary-600 shadow-sm shadow-primary-500/25"
                      : "border border-border text-foreground hover:border-primary-500 hover:text-primary-700 bg-background",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-foreground"
              htmlFor="demo-review"
            >
              Review text
            </label>
            <textarea
              id="demo-review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="Paste a recent Google review here…"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">
                  Use a sample:
                </span>
                <select
                  className="rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={sampleId}
                  onChange={(e) => handlePickSample(e.target.value)}
                  aria-label="Choose a sample review"
                >
                  {SAMPLE_REVIEWS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors text-center"
                >
                  Start your free trial
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-dashed border-primary-400 text-primary-700 font-semibold rounded-full hover:bg-primary-50 transition-colors text-center"
                >
                  View the app
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background border border-border shadow-sm space-y-4">
          <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    aria-hidden="true"
                    className="w-4 h-4 text-star"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-foreground-muted">New review</span>
            </div>
            <p className="text-sm text-foreground">
              “{normalize(reviewText) || "…"}”
            </p>
          </div>

          <div className="rounded-xl border border-primary-200 bg-surface-elevated p-4 space-y-2 shadow-sm shadow-primary-500/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary-700">
                Draft reply ({tone} tone)
              </p>
              <span className="text-[11px] text-foreground-muted">Preview</span>
            </div>
            <p className="text-sm text-foreground">{draft}</p>
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Voice: Owner-written</span>
              <span>Publish in 1 click</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
