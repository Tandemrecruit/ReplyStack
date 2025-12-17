/**
 * Authentication validation utilities for email and password validation.
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
} as const;

/**
 * Validates an email address format.
 * @param email - The email address to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Email is required";
  }

  // Basic email regex - covers most valid email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address";
  }

  return null;
}

/**
 * Validates a password against security requirements.
 * Requirements: min 8 characters, uppercase, lowercase, and number.
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`;
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
}

/**
 * Validates that two passwords match.
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns Error message if they don't match, null if they match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return "Please confirm your password";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match";
  }

  return null;
}

/**
 * Returns a list of password requirements for display to users.
 */
export function getPasswordRequirementsList(): string[] {
  const requirements: string[] = [];

  requirements.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push("One uppercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push("One lowercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push("One number");
  }

  return requirements;
}
