/**
 * @vitest-environment node
 */

import {
  getPasswordRequirementsList,
  PASSWORD_REQUIREMENTS,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation/auth";

describe("lib/validation/auth", () => {
  describe("validateEmail", () => {
    it("returns null for valid email", () => {
      expect(validateEmail("test@example.com")).toBeNull();
      expect(validateEmail("user.name@domain.co.uk")).toBeNull();
      expect(validateEmail("user+tag@example.org")).toBeNull();
    });

    it("returns error for empty email", () => {
      expect(validateEmail("")).toBe("Email is required");
      expect(validateEmail("   ")).toBe("Email is required");
    });

    it("returns error for invalid email format", () => {
      expect(validateEmail("notanemail")).toBe(
        "Please enter a valid email address",
      );
      expect(validateEmail("missing@domain")).toBe(
        "Please enter a valid email address",
      );
      expect(validateEmail("@nodomain.com")).toBe(
        "Please enter a valid email address",
      );
      expect(validateEmail("spaces in@email.com")).toBe(
        "Please enter a valid email address",
      );
    });

    it("trims whitespace from email", () => {
      expect(validateEmail("  test@example.com  ")).toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("returns null for valid password", () => {
      expect(validatePassword("Password1")).toBeNull();
      expect(validatePassword("MySecure123")).toBeNull();
      expect(validatePassword("Test1234")).toBeNull();
    });

    it("returns error for empty password", () => {
      expect(validatePassword("")).toBe("Password is required");
    });

    it("returns error for password too short", () => {
      expect(validatePassword("Pass1")).toBe(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      );
      expect(validatePassword("Ab1")).toBe(
        `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      );
    });

    it("returns error for password without uppercase", () => {
      expect(validatePassword("password1")).toBe(
        "Password must contain at least one uppercase letter",
      );
    });

    it("returns error for password without lowercase", () => {
      expect(validatePassword("PASSWORD1")).toBe(
        "Password must contain at least one lowercase letter",
      );
    });

    it("returns error for password without number", () => {
      expect(validatePassword("Passwordd")).toBe(
        "Password must contain at least one number",
      );
    });
  });

  describe("validatePasswordMatch", () => {
    it("returns null when passwords match", () => {
      expect(validatePasswordMatch("Password1", "Password1")).toBeNull();
    });

    it("returns error for empty confirmation", () => {
      expect(validatePasswordMatch("Password1", "")).toBe(
        "Please confirm your password",
      );
    });

    it("returns error when passwords do not match", () => {
      expect(validatePasswordMatch("Password1", "Password2")).toBe(
        "Passwords do not match",
      );
    });
  });

  describe("getPasswordRequirementsList", () => {
    it("returns list of password requirements", () => {
      const requirements = getPasswordRequirementsList();

      expect(requirements).toContain(
        `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      );
      expect(requirements).toContain("One uppercase letter");
      expect(requirements).toContain("One lowercase letter");
      expect(requirements).toContain("One number");
    });
  });
});
