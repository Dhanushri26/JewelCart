import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../../../frontend/src/pages/LoginPage";

vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  fetchAuthSession: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendSignUpCode: vi.fn(),
  resetPassword: vi.fn(),
  confirmResetPassword: vi.fn(),
}));

import { signIn, fetchAuthSession } from "aws-amplify/auth";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAuthSession.mockResolvedValue({});
  });

  it("renders the login form and important text", () => {
    render(<LoginPage onLogin={vi.fn()} />);

    expect(screen.getByText("JewelCart")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Email or Username"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
  });

  it("updates the email input when the user types", async () => {
    const user = userEvent.setup();
    render(<LoginPage onLogin={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("Email or Username"),
      "demo@example.com",
    );

    expect(screen.getByPlaceholderText("Email or Username")).toHaveValue(
      "demo@example.com",
    );
  });

  it("calls signIn and onLogin after a successful login", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    signIn.mockResolvedValue({ isSignedIn: true });

    render(<LoginPage onLogin={onLogin} />);

    await user.type(
      screen.getByPlaceholderText("Email or Username"),
      "demo@example.com",
    );
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(signIn).toHaveBeenCalledWith({
      username: "demo@example.com",
      password: "secret123",
    });
    expect(onLogin).toHaveBeenCalled();
  });

  it("switches to the sign up tab", async () => {
    const user = userEvent.setup();
    render(<LoginPage onLogin={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });
});
