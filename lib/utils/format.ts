/**
 * Utility functions for formatting data
 */

/**
 * Convert a Date or date string into a human-readable en-US date string.
 *
 * @param date - The input date to format. If a string is provided, it will be parsed as a Date.
 * @param options - Optional Intl.DateTimeFormatOptions to override the default year/month/day fields.
 * @returns The formatted date string in en-US format (for example, "January 1, 2020").
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * Formats a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  return formatDate(dateObj);
}

/**
 * Truncate a string to a maximum length, appending an ellipsis when truncated.
 *
 * @param text - The input string to truncate
 * @param maxLength - Maximum allowed length of the returned string. When `maxLength >= 3`, the returned string will be no longer than `maxLength`.
 * @returns The original `text` if its length is less than or equal to `maxLength`; otherwise a truncated string that ends with `...` (for `maxLength >= 3`, the result's length will be at most `maxLength`)
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Counts words in a string
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formats a number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format a numeric amount as a localized currency string.
 *
 * @param amount - The numeric value to format
 * @param currency - The ISO 4217 currency code to use (defaults to "USD")
 * @returns The formatted currency string (for example, "$1,234.56")
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}