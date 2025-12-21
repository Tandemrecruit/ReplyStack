import { render, screen } from "@testing-library/react";

import SettingsPage, { metadata } from "@/app/(dashboard)/settings/page";

// Mock the SettingsClient component
vi.mock("@/app/(dashboard)/settings/settings-client", () => ({
  SettingsClient: () => <div data-testid="settings-client">SettingsClient</div>,
}));

describe("app/(dashboard)/settings/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Settings | ReplyStack");
    expect(metadata.description).toBe("Manage your ReplyStack settings");
  });

  it("renders the SettingsClient component", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("settings-client")).toBeInTheDocument();
  });
});
