import type { Metadata } from "next";

import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings | Replily",
  description: "Manage your Replily settings",
};

/**
 * Render the Settings page for managing Replily account preferences.
 *
 * Renders the page's UI component tree for settings.
 *
 * @returns A React element containing the Settings page content
 */
export default function SettingsPage() {
  return <SettingsClient />;
}