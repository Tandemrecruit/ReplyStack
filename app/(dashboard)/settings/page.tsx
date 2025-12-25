import type { Metadata } from "next";

import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings | Replily",
  description: "Manage your Replily settings",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
