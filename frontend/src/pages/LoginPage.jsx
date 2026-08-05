import { useState } from "react";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import SignUpForm from "../components/auth/SignUpForm";
import VerifyEmailForm from "../components/auth/VerifyEmailForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

const VIEWS = {
  TABS: "tabs",
  VERIFY: "verify",
  FORGOT: "forgot",
};

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState(VIEWS.TABS);
  const [activeTab, setActiveTab] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleSignUpSuccess(email, password) {
    setPendingEmail(email);
    setPendingPassword(password);
    setSuccessMessage("");
    setView(VIEWS.VERIFY);
  }

  function handleVerifyRequired(email) {
    setPendingEmail(email);
    setPendingPassword("");
    setSuccessMessage("");
    setView(VIEWS.VERIFY);
  }

  function handleBackToTabs() {
    setView(VIEWS.TABS);
    setActiveTab("login");
    setPendingPassword("");
  }

  function handlePasswordResetSuccess() {
    setSuccessMessage(
      "Password reset successfully. You can now sign in with your new password.",
    );
    setView(VIEWS.TABS);
    setActiveTab("login");
  }

  function handleVerifiedWithoutLogin() {
    setSuccessMessage(
      "Email verified successfully. Please sign in with your credentials.",
    );
    handleBackToTabs();
  }

  const layoutProps = {
    verify: {
      title: "Verify Email",
      subtitle: null,
    },
    forgot: {
      title: "Reset Password",
      subtitle: null,
    },
    tabs: {
      title: null,
      subtitle:
        activeTab === "login"
          ? "Enter your credentials to access your luxury selection."
          : "Create your account to start shopping.",
    },
  };

  const currentLayout =
    view === VIEWS.VERIFY
      ? layoutProps.verify
      : view === VIEWS.FORGOT
        ? layoutProps.forgot
        : layoutProps.tabs;

  return (
    <AuthLayout title={currentLayout.title} subtitle={currentLayout.subtitle}>
      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 backdrop-blur-sm">
          {successMessage}
        </div>
      )}

      {view === VIEWS.VERIFY ? (
        <VerifyEmailForm
          email={pendingEmail}
          password={pendingPassword}
          onLogin={onLogin}
          onBack={handleBackToTabs}
          onVerifiedWithoutLogin={handleVerifiedWithoutLogin}
        />
      ) : view === VIEWS.FORGOT ? (
        <ForgotPasswordForm
          onBack={handleBackToTabs}
          onSuccess={handlePasswordResetSuccess}
        />
      ) : (
        <>
          <div className="mb-8 flex rounded-2xl border border-stone-200 bg-stone-100/50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setSuccessMessage("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                activeTab === "login"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setSuccessMessage("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                activeTab === "signup"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === "login" ? (
            <LoginForm
              onLogin={onLogin}
              onForgotPassword={() => {
                setSuccessMessage("");
                setView(VIEWS.FORGOT);
              }}
              onVerifyRequired={handleVerifyRequired}
            />
          ) : (
            <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
          )}
        </>
      )}
    </AuthLayout>
  );
}
