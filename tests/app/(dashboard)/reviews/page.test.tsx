import { render, screen } from "@testing-library/react";

import ReviewsPage, { metadata } from "@/app/(dashboard)/reviews/page";

describe("app/(dashboard)/reviews/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Reviews | ReplyStack");
    expect(metadata.description).toBe(
      "View and respond to your Google Business reviews",
    );
  });

  it("renders the page heading", () => {
    render(<ReviewsPage />);
    expect(
      screen.getByRole("heading", { name: "Reviews" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<ReviewsPage />);
    expect(
      screen.getByText("View and respond to your Google Business reviews"),
    ).toBeInTheDocument();
  });

  it("renders rating filter dropdown", () => {
    render(<ReviewsPage />);
    const ratingSelect = screen.getByRole("combobox", {
      name: /filter by rating/i,
    });
    expect(ratingSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "All Ratings" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "5 Stars" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1 Star" })).toBeInTheDocument();
  });

  it("renders status filter dropdown", () => {
    render(<ReviewsPage />);
    const statusSelect = screen.getByRole("combobox", {
      name: /filter by status/i,
    });
    expect(statusSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "All Status" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Responded" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ignored" })).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<ReviewsPage />);
    expect(
      screen.getByRole("heading", { name: "No reviews yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your Google Business Profile to start seeing reviews here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders empty state icon", () => {
    render(<ReviewsPage />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});
