import { useState } from "react";
import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";
import { getCognitoErrorMessage } from "../utils/cognitoErrors";

/**
 * Shared login logic used by the Login form and post-verification auto-login.
 * Preserves the exact Cognito sign-in flow from the original LoginPage.
 */
export function useAuthLogin(onLogin) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(email, password) {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return { status: "validation_error" };
    }

    setLoading(true);
    setError("");
    try {
      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        await fetchAuthSession();
        onLogin();
        return { status: "signed_in" };
      }

      if (
        result.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        return { status: "new_password_required" };
      }

      return { status: "unknown" };
    } catch (err) {
      if (err.name === "UserAlreadyAuthenticatedException") {
        await fetchAuthSession();
        onLogin();
        return { status: "signed_in" };
      }
      if (err.name === "UserNotConfirmedException") {
        setError(getCognitoErrorMessage(err));
        return { status: "not_confirmed", email };
      }
      setError(getCognitoErrorMessage(err));
      return { status: "error" };
    } finally {
      setLoading(false);
    }
  }

  async function confirmNewPassword(newPassword) {
    if (!newPassword) {
      setError("Please enter a new password.");
      return false;
    }

    setLoading(true);
    setError("");
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });

      if (result.isSignedIn || !result.nextStep) {
        await fetchAuthSession();
        onLogin();
        return true;
      }
      return false;
    } catch (err) {
      setError(
        getCognitoErrorMessage(err) ||
          "Failed to set new password. Please try again.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { login, confirmNewPassword, loading, error, setError };
}
