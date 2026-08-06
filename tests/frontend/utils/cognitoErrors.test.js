import { describe, it, expect } from "vitest";
import { getCognitoErrorMessage } from "../../../frontend/src/utils/cognitoErrors";

describe("getCognitoErrorMessage", () => {
  const cases = [
    ["UsernameExistsException", "An account with this email already exists"],
    ["InvalidPasswordException", "Password does not meet requirements"],
    ["CodeMismatchException", "Invalid verification code"],
    ["ExpiredCodeException", "Verification code has expired"],
    ["UserNotConfirmedException", "Your email is not verified yet"],
    ["NotAuthorizedException", "Incorrect email or password"],
    ["LimitExceededException", "Too many attempts"],
    ["TooManyRequestsException", "Too many attempts"],
    ["UserNotFoundException", "No account found with this email address"],
    ["NetworkError", "Network error"],
  ];

  it.each(cases)("handles %s", (name, expectedSubstring) => {
    const msg = getCognitoErrorMessage({ name, message: "" });
    expect(msg.toLowerCase()).toContain(expectedSubstring.toLowerCase());
  });

  it("handles InvalidParameterException with password message", () => {
    const msg = getCognitoErrorMessage({
      name: "InvalidParameterException",
      message: "password does not conform to policy",
    });
    expect(msg.toLowerCase()).toContain("password");
  });

  it("handles InvalidParameterException without password message", () => {
    const msg = getCognitoErrorMessage({
      name: "InvalidParameterException",
      message: "Value at 'username' failed",
    });
    expect(msg).toContain("Value at 'username' failed");
  });

  it("returns message from unknown error when message provided", () => {
    const msg = getCognitoErrorMessage({
      name: "SomeUnknownException",
      message: "Something odd happened",
    });
    expect(msg).toBe("Something odd happened");
  });

  it("returns fallback for unknown error with no message", () => {
    const msg = getCognitoErrorMessage({
      name: "SomeUnknownException",
      message: "",
    });
    expect(msg).toBe("Something went wrong. Please try again.");
  });

  it("handles null/undefined error gracefully", () => {
    const msg = getCognitoErrorMessage(null);
    expect(typeof msg).toBe("string");
  });
});
