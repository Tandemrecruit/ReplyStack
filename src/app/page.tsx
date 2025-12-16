import Link from 'next/link';
import { Button } from '@/components/ui';

/**
 * Render the ReplyStack landing page layout.
 *
 * The page includes a header with navigation, a hero section with CTAs,
 * a features ("How It Works") section, a pricing card with plan details,
 * and a footer with the current year.
 *
 * @returns The landing page element containing header, hero, features, pricing, and footer
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-gray-900">ReplyStack</div>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Respond to every review
              <br />
              <span className="text-blue-600">in 30 seconds</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              AI-powered responses that sound like you. Connect your Google
              Business Profile and start responding to reviews with one click.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link href="#demo">
                <Button variant="secondary" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              14-day free trial. No credit card required.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                step="1"
                title="Connect"
                description="Link your Google Business Profile with one click. We'll sync your reviews automatically."
              />
              <FeatureCard
                step="2"
                title="Configure"
                description="Set up your voice profile. Tell us your tone, favorite phrases, and how you like to sign off."
              />
              <FeatureCard
                step="3"
                title="Respond"
                description="Generate personalized responses with one click. Edit if needed, then publish directly to Google."
              />
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-center text-gray-600 mb-12">
              One plan, everything included.
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <div className="text-center">
                  <p className="text-gray-600">Professional</p>
                  <p className="text-5xl font-bold text-gray-900 mt-2">
                    $49<span className="text-xl font-normal">/month</span>
                  </p>
                  <p className="text-gray-500 mt-2">per location</p>
                </div>
                <ul className="mt-8 space-y-4">
                  <PricingFeature>Unlimited AI responses</PricingFeature>
                  <PricingFeature>Voice profile customization</PricingFeature>
                  <PricingFeature>Direct publish to Google</PricingFeature>
                  <PricingFeature>Email notifications</PricingFeature>
                  <PricingFeature>Response history</PricingFeature>
                </ul>
                <Link href="/signup" className="block mt-8">
                  <Button className="w-full" size="lg">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ReplyStack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Renders a feature card with a circular step badge, a title, and a description.
 *
 * @param step - Text displayed inside the circular step badge (e.g., "1", "A")
 * @param title - Heading displayed as the card's title
 * @param description - Supporting text describing the feature
 * @returns A JSX element representing the feature card
 */
function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

/**
 * Renders a list item with a green check icon and the provided content for a pricing feature.
 *
 * @param children - Content displayed to the right of the check icon (feature label or node)
 * @returns A `<li>` element containing a green check SVG and the given content
 */
function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center">
      <svg
        className="w-5 h-5 text-green-500 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-gray-600">{children}</span>
    </li>
  );
}