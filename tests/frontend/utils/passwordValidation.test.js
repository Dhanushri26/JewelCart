import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  getPasswordPolicyErrors,
  isPasswordValid,
} from "../../../frontend/src/utils/passwordValidation";

describe("isValidEmail", () => {
  it("returns true for a valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("returns true for email with subdomain", () => {
    expect(isValidEmail("user@mail.example.co.uk")).toBe(true);
  });

  it("returns false for missing @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("returns false for missing domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });
});

describe("getPasswordPolicyErrors", () => {
  it("returns empty array for a fully valid password", () => {
    expect(getPasswordPolicyErrors("Passw0rd!")).toEqual([]);
  });

  it("reports error when password is too short", () => {
    const errors = getPasswordPolicyErrors("Ab1!");
    expect(errors).toContain("At least 8 characters");
  });

  it("reports error when no lowercase letter", () => {
    const errors = getPasswordPolicyErrors("PASSW0RD!");
    expect(errors).toContain("One lowercase letter");
  });

  it("reports error when no uppercase letter", () => {
    const errors = getPasswordPolicyErrors("passw0rd!");
    expect(errors).toContain("One uppercase letter");
  });

  it("reports error when no digit", () => {
    const errors = getPasswordPolicyErrors("Password!");
    expect(errors).toContain("One number");
  });

  it("reports error when no special character", () => {
    const errors = getPasswordPolicyErrors("Passw0rd");
    expect(errors).toContain("One special character");
  });

  it("returns multiple errors for completely invalid password", () => {
    const errors = getPasswordPolicyErrors("abc");
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe("isPasswordValid", () => {
  it("returns true for a valid password", () => {
    expect(isPasswordValid("Passw0rd!")).toBe(true);
  });

  it("returns false for an invalid password", () => {
    expect(isPasswordValid("weak")).toBe(false);
  });
});
