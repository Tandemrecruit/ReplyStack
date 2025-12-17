import {
  capitalize,
  countWords,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
  truncate,
} from "@/lib/utils/format";

describe("lib/utils/format", () => {
  it("formatDate formats a date deterministically when a timezone is provided", () => {
    const date = new Date("2020-01-02T12:00:00.000Z");
    expect(formatDate(date, { timeZone: "UTC" })).toBe("January 2, 2020");
  });

  it("formatRelativeTime returns 'Just now' for <60s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:30.000Z"));
    expect(formatRelativeTime(new Date("2025-01-01T00:00:00.000Z"))).toBe(
      "Just now",
    );
    vi.useRealTimers();
  });

  it("formatRelativeTime returns minutes/hours/days ago for recent dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T01:00:00.000Z"));

    expect(formatRelativeTime(new Date("2025-01-01T00:59:00.000Z"))).toBe(
      "1 minute ago",
    );
    expect(formatRelativeTime(new Date("2025-01-01T00:00:00.000Z"))).toBe(
      "1 hour ago",
    );
    expect(formatRelativeTime(new Date("2024-12-30T01:00:00.000Z"))).toBe(
      "2 days ago",
    );

    vi.useRealTimers();
  });

  it("truncate short-circuits when text is already short enough", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncate adds ellipsis when truncating", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("countWords ignores extra whitespace", () => {
    expect(countWords("  hello   world  ")).toBe(2);
  });

  it("capitalize uppercases the first character", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("formatNumber adds commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formatCurrency formats USD by default", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
  });
});


