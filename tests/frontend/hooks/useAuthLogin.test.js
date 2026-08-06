import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";
import { useAuthLogin } from "../../../frontend/src/hooks/useAuthLogin";

describe("useAuthLogin", () => {
  const onLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchAuthSession.mockResolvedValue({});
  });

  it("returns validation_error when email is missing", async () => {
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("", "password");
    });
    expect(status).toEqual({ status: "validation_error" });
    expect(result.current.error).toBeTruthy();
  });

  it("returns validation_error when password is missing", async () => {
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "");
    });
    expect(status).toEqual({ status: "validation_error" });
  });

  it("calls onLogin and returns signed_in on successful sign in", async () => {
    signIn.mockResolvedValue({ isSignedIn: true });
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(signIn).toHaveBeenCalledWith({
      username: "user@test.com",
      password: "Passw0rd!",
    });
    expect(onLogin).toHaveBeenCalled();
    expect(status).toEqual({ status: "signed_in" });
  });

  it("returns new_password_required when next step is NEW_PASSWORD", async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED" },
    });
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(status).toEqual({ status: "new_password_required" });
  });

  it("returns unknown for unrecognised next step", async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: "SOMETHING_ELSE" },
    });
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(status).toEqual({ status: "unknown" });
  });

  it("handles UserAlreadyAuthenticatedException by calling onLogin", async () => {
    const err = new Error("already auth");
    err.name = "UserAlreadyAuthenticatedException";
    signIn.mockRejectedValue(err);
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(onLogin).toHaveBeenCalled();
    expect(status).toEqual({ status: "signed_in" });
  });

  it("handles UserNotConfirmedException and returns not_confirmed", async () => {
    const err = new Error("not confirmed");
    err.name = "UserNotConfirmedException";
    signIn.mockRejectedValue(err);
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(status.status).toBe("not_confirmed");
    expect(status.email).toBe("user@test.com");
    expect(result.current.error).toBeTruthy();
  });

  it("handles generic error and returns error status", async () => {
    const err = new Error("network fail");
    err.name = "NetworkError";
    signIn.mockRejectedValue(err);
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let status;
    await act(async () => {
      status = await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(status).toEqual({ status: "error" });
    expect(result.current.error).toBeTruthy();
  });

  it("loading is false after login completes", async () => {
    signIn.mockResolvedValue({ isSignedIn: true });
    const { result } = renderHook(() => useAuthLogin(onLogin));
    await act(async () => {
      await result.current.login("user@test.com", "Passw0rd!");
    });
    expect(result.current.loading).toBe(false);
  });

  // confirmNewPassword tests
  it("confirmNewPassword returns false when newPassword is empty", async () => {
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let res;
    await act(async () => {
      res = await result.current.confirmNewPassword("");
    });
    expect(res).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("confirmNewPassword calls onLogin and returns true on success", async () => {
    confirmSignIn.mockResolvedValue({ isSignedIn: true });
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let res;
    await act(async () => {
      res = await result.current.confirmNewPassword("NewPassw0rd!");
    });
    expect(confirmSignIn).toHaveBeenCalledWith({
      challengeResponse: "NewPassw0rd!",
    });
    expect(onLogin).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  it("confirmNewPassword returns false when confirmSignIn throws", async () => {
    confirmSignIn.mockRejectedValue(new Error("invalid password"));
    const { result } = renderHook(() => useAuthLogin(onLogin));
    let res;
    await act(async () => {
      res = await result.current.confirmNewPassword("Bad");
    });
    expect(res).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});
