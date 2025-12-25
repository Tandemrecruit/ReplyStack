import { render, screen } from "@testing-library/react";

import UpdatePasswordPage, {
  metadata,
} from "@/app/(auth)/update-password/page";

// Mock the UpdatePasswordForm component
vi.mock("@/components/auth/update-password-form", () => ({
  UpdatePasswordForm: () => (
    <div data-testid="update-password-form">UpdatePasswordForm</div>
  ),
}));

describe("app/(auth)/update-password/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Update Password | Replily");
    expect(metadata.description).toBe("Set your new password");
  });

  it("renders the page heading", () => {
    render(<UpdatePasswordPage />);
    expect(
      screen.getByRole("heading", { name: "Set new password" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<UpdatePasswordPage />);
    expect(
      screen.getByText("Enter your new password below"),
    ).toBeInTheDocument();
  });

  it("renders the UpdatePasswordForm component", () => {
    render(<UpdatePasswordPage />);
    expect(screen.getByTestId("update-password-form")).toBeInTheDocument();
  });
});
