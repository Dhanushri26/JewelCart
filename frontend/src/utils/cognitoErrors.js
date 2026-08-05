/**
 * Maps Cognito / Amplify auth errors to user-friendly messages.
 */
export function getCognitoErrorMessage(error) {
  const name = error?.name || "";
  const message = error?.message || "";

  switch (name) {
    case "UsernameExistsException":
      return "An account with this email already exists. Try signing in instead.";
    case "InvalidPasswordException":
      return "Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, numbers, and special characters.";
    case "CodeMismatchException":
      return "Invalid verification code. Please check and try again.";
    case "ExpiredCodeException":
      return "Verification code has expired. Please request a new one.";
    case "UserNotConfirmedException":
      return "Your email is not verified yet. Please verify your email to continue.";
    case "NotAuthorizedException":
      return "Incorrect email or password. Please try again.";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "Too many attempts. Please wait a moment and try again.";
    case "UserNotFoundException":
      return "No account found with this email address.";
    case "InvalidParameterException":
      if (message.toLowerCase().includes("password")) {
        return "Password does not meet the required policy.";
      }
      return message || "Invalid input. Please check your details.";
    case "NetworkError":
      return "Network error. Please check your connection and try again.";
    default:
      return message || "Something went wrong. Please try again.";
  }
}
