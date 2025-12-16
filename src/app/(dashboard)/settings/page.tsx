'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

/**
 * Render the account settings page with sections for profile, Google Business Profile, notifications, billing, and account deletion.
 *
 * The profile section includes editable fields for name, email, and business name and a Save Profile action that simulates persistence (1 second delay) and logs the profile values.
 *
 * @returns The React element for the Settings page UI
 */
export default function SettingsPage() {
  const [name, setName] = useState('John Smith');
  const [email, setEmail] = useState('john@example.com');
  const [businessName, setBusinessName] = useState("Smith's Auto Repair");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Save to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log('Saving profile:', { name, email, businessName });
  };

  return (
    <div>
      <Header title="Settings" description="Manage your account and preferences" />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <Button onClick={handleSaveProfile} isLoading={isSaving}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Google Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Google Business Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div>
                  <p className="font-medium text-green-800">Connected</p>
                  <p className="text-sm text-green-600">
                    Smith&apos;s Auto Repair - Main Street
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Disconnect
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Your Google Business Profile is connected. Reviews are synced
              automatically.
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <NotificationToggle
                label="New review alerts"
                description="Get notified when you receive a new review"
                defaultChecked={true}
              />
              <NotificationToggle
                label="Daily digest"
                description="Receive a daily summary of your reviews"
                defaultChecked={false}
              />
              <NotificationToggle
                label="Negative review alerts"
                description="Get immediate alerts for reviews 3 stars and below"
                defaultChecked={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900">Professional Plan</p>
                <p className="text-sm text-gray-500">$49/month</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your next billing date is January 15, 2025
            </p>
            <div className="flex gap-2">
              <Button variant="secondary">Manage Subscription</Button>
              <Button variant="ghost">View Invoices</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button variant="danger">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Renders a labeled toggle control that manages its own on/off state.
 *
 * @param label - The primary label text displayed next to the toggle
 * @param description - The secondary description text displayed below the label
 * @param defaultChecked - The initial checked state of the toggle when mounted
 * @returns A JSX element containing the label, description, and a button-style toggle whose checked state is managed locally
 */
function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}