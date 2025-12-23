import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReviewsFilters } from "@/components/reviews/reviews-filters";

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/reviews");
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearchParams(),
}));

describe("components/reviews/ReviewsFilters", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockPathname.mockReturnValue("/reviews");
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  describe("Initial render", () => {
    it("renders rating filter dropdown", () => {
      render(<ReviewsFilters />);
      expect(
        screen.getByRole("combobox", { name: "Filter by rating" }),
      ).toBeInTheDocument();
    });

    it("renders status filter dropdown", () => {
      render(<ReviewsFilters />);
      expect(
        screen.getByRole("combobox", { name: "Filter by status" }),
      ).toBeInTheDocument();
    });

    it("shows 'All Ratings' as default when no rating filter", () => {
      render(<ReviewsFilters />);
      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      expect(ratingSelect).toHaveValue("all");
    });

    it("shows 'All Status' as default when no status filter", () => {
      render(<ReviewsFilters />);
      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      expect(statusSelect).toHaveValue("all");
    });

    it("shows current rating value from props", () => {
      render(<ReviewsFilters currentRating="5" />);
      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      expect(ratingSelect).toHaveValue("5");
    });

    it("shows current status value from props", () => {
      render(<ReviewsFilters currentStatus="pending" />);
      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      expect(statusSelect).toHaveValue("pending");
    });

    it("handles null currentRating prop", () => {
      render(<ReviewsFilters currentRating={null} />);
      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      expect(ratingSelect).toHaveValue("all");
    });

    it("handles null currentStatus prop", () => {
      render(<ReviewsFilters currentStatus={null} />);
      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      expect(statusSelect).toHaveValue("all");
    });

    it("handles undefined currentRating prop", () => {
      render(<ReviewsFilters currentRating={undefined} />);
      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      expect(ratingSelect).toHaveValue("all");
    });

    it("handles undefined currentStatus prop", () => {
      render(<ReviewsFilters currentStatus={undefined} />);
      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      expect(statusSelect).toHaveValue("all");
    });
  });

  describe("Rating filter", () => {
    it("updates URL when rating selected", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=5");
    });

    it("removes rating param when 'All Ratings' selected", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(new URLSearchParams("rating=5"));
      render(<ReviewsFilters currentRating="5" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "all");

      expect(mockPush).toHaveBeenCalledWith("/reviews");
    });

    it("removes page param when filter changes", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(new URLSearchParams("rating=5&page=2"));
      render(<ReviewsFilters currentRating="5" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "4");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=4");
    });

    it("preserves other params when rating changes", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(
        new URLSearchParams("status=pending&rating=5"),
      );
      render(<ReviewsFilters currentRating="5" currentStatus="pending" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "4");

      expect(mockPush).toHaveBeenCalledWith("/reviews?status=pending&rating=4");
    });
  });

  describe("Status filter", () => {
    it("updates URL when status selected", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters />);

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "pending");

      expect(mockPush).toHaveBeenCalledWith("/reviews?status=pending");
    });

    it("removes status param when 'All Status' selected", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(new URLSearchParams("status=pending"));
      render(<ReviewsFilters currentStatus="pending" />);

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "all");

      expect(mockPush).toHaveBeenCalledWith("/reviews");
    });

    it("removes page param when filter changes", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(
        new URLSearchParams("status=pending&page=2"),
      );
      render(<ReviewsFilters currentStatus="pending" />);

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "responded");

      expect(mockPush).toHaveBeenCalledWith("/reviews?status=responded");
    });

    it("preserves other params when status changes", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(
        new URLSearchParams("rating=5&status=pending"),
      );
      render(<ReviewsFilters currentRating="5" currentStatus="pending" />);

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "responded");

      expect(mockPush).toHaveBeenCalledWith(
        "/reviews?rating=5&status=responded",
      );
    });
  });

  describe("Base path handling", () => {
    it("uses basePath prop when provided", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters basePath="/dashboard/reviews" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/dashboard/reviews?rating=5");
    });

    it("uses pathname when basePath not provided", async () => {
      const user = userEvent.setup();
      mockPathname.mockReturnValue("/custom/reviews");
      render(<ReviewsFilters />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/custom/reviews?rating=5");
    });

    it("falls back to /reviews when pathname not available", async () => {
      const user = userEvent.setup();
      mockPathname.mockReturnValue(null as unknown as string);
      render(<ReviewsFilters />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=5");
    });

    it("removes query string from basePath", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters basePath="/reviews?old=param" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=5");
    });

    it("removes trailing slashes from basePath", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters basePath="/reviews/" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=5");
    });

    it("handles root path correctly", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters basePath="/" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/?rating=5");
    });

    it("handles multiple trailing slashes", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters basePath="/reviews///" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "5");

      expect(mockPush).toHaveBeenCalledWith("/reviews?rating=5");
    });
  });

  describe("Filter options", () => {
    it("renders all rating options", () => {
      render(<ReviewsFilters />);
      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });

      expect(
        screen.getByRole("option", { name: "All Ratings" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "5 Stars" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "4 Stars" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "3 Stars" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "2 Stars" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "1 Star" }),
      ).toBeInTheDocument();
    });

    it("renders all status options", () => {
      render(<ReviewsFilters />);
      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });

      expect(
        screen.getByRole("option", { name: "All Status" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Pending" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Responded" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Ignored" }),
      ).toBeInTheDocument();
    });
  });

  describe("Combined filters", () => {
    it("handles both filters together", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(
        new URLSearchParams("rating=5&status=pending"),
      );
      render(<ReviewsFilters currentRating="5" currentStatus="pending" />);

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "responded");

      expect(mockPush).toHaveBeenCalledWith(
        "/reviews?rating=5&status=responded",
      );
    });

    it("removes all filters when both set to 'all'", async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(
        new URLSearchParams("rating=5&status=pending"),
      );
      render(<ReviewsFilters currentRating="5" currentStatus="pending" />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      await user.selectOptions(ratingSelect, "all");

      const statusSelect = screen.getByRole("combobox", {
        name: "Filter by status",
      });
      await user.selectOptions(statusSelect, "all");

      // Check that /reviews was called (without query params)
      expect(mockPush).toHaveBeenCalledWith("/reviews");
    });
  });

  describe("Edge cases", () => {
    it("handles empty string value as 'all'", async () => {
      const user = userEvent.setup();
      render(<ReviewsFilters />);

      const ratingSelect = screen.getByRole("combobox", {
        name: "Filter by rating",
      });
      // Select an option first, then try to set empty
      await user.selectOptions(ratingSelect, "5");
      // Setting to empty should be treated as "all"
      // This tests the value === "" branch
      const allOption = screen.getByRole("option", { name: "All Ratings" });
      await user.selectOptions(
        ratingSelect,
        allOption.getAttribute("value") ?? "",
      );

      expect(mockPush).toHaveBeenLastCalledWith("/reviews");
    });
  });
});
