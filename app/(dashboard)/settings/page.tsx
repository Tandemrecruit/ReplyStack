import type { Metadata } from "next";

import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings | Replily",
  description: "Manage your Replily settings",
};

/**
 * Settings page for managing Replily account preferences.
 *
 * @returns A React element containing the Settings page content
 */
export default function SettingsPage() {
  return <SettingsClient />;
}
