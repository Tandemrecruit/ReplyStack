import type { Metadata } from "next";

import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings | ReplyStack",
  description: "Manage your ReplyStack settings",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
