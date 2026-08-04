import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "./LoginPage";

// Mock Amplify auth functions so the component can be tested without a real auth setup.
vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

import { signIn } from "aws-amplify/auth";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form and important text", () => {
    // Arrange
    render(<LoginPage onLogin={vi.fn()} />);

    // Assert
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Email or Username"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("updates the email input when the user types", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginPage onLogin={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Email or Username"),
      "demo@example.com",
    );

    // Assert
    expect(screen.getByPlaceholderText("Email or Username")).toHaveValue(
      "demo@example.com",
    );
  });

  it("calls signIn and onLogin after a successful login", async () => {
    // Arrange
    const user = userEvent.setup();
    const onLogin = vi.fn();
    signIn.mockResolvedValue({ isSignedIn: true });

    render(<LoginPage onLogin={onLogin} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Email or Username"),
      "demo@example.com",
    );
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Assert
    expect(signIn).toHaveBeenCalledWith({
      username: "demo@example.com",
      password: "secret123",
    });
    expect(onLogin).toHaveBeenCalled();
  });
});
