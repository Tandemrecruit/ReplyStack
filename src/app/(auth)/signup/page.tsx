'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, CardContent } from '@/components/ui';

/**
 * Client-side signup page that renders a registration form with an optional Google signup action.
 *
 * Renders controlled inputs for name, business name, email, and password, shows inline error messages when signup fails, and navigates to `/dashboard` on successful submission. The Google signup button is a placeholder for OAuth integration.
 *
 * @returns The React element for the signup page UI.
 */
export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // TODO: Implement actual signup with Supabase
    try {
      // Placeholder for signup logic
      console.log('Signup attempt:', { name, email, password, businessName });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Redirect to onboarding/dashboard on success
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth signup
    console.log('Google signup clicked');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            ReplyStack
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Start your free trial
          </h2>
          <p className="mt-2 text-gray-600">
            14 days free. No credit card required.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              className="w-full mb-4"
              onClick={handleGoogleSignup}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              Sign up with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Your name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
              />

              <Input
                label="Business name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Smith's Auto Repair"
                required
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                helperText="Must be at least 8 characters"
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}