import { useState } from "react";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";
import { getCognitoErrorMessage } from "../../utils/cognitoErrors";
import {
  getPasswordPolicyErrors,
  isValidEmail,
} from "../../utils/passwordValidation";

export default function ForgotPasswordForm({ onBack, onSuccess }) {
  const [step, setStep] = useState("REQUEST");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleRequestReset(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await resetPassword({ username: email.trim() });
      setStep("CONFIRM");
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function validateResetForm() {
    const errors = {};

    if (!code.trim()) {
      errors.code = "Verification code is required.";
    }

    const passwordErrors = getPasswordPolicyErrors(newPassword);
    if (passwordErrors.length > 0) {
      errors.newPassword = `Password must include: ${passwordErrors.join(", ")}.`;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleConfirmReset(e) {
    e.preventDefault();
    if (!validateResetForm()) return;

    setLoading(true);
    setError("");
    try {
      await confirmResetPassword({
        username: email.trim(),
        confirmationCode: code.trim(),
        newPassword,
      });
      onSuccess?.();
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-stone-100";
  const errorBorder = "border-rose-300 focus:border-rose-400";
  const normalBorder = "border-stone-200 focus:border-stone-400";

  if (step === "REQUEST") {
    return (
      <div>
        <p className="mb-6 text-center text-sm text-stone-500">
          Enter your registered email and we&apos;ll send you a verification
          code to reset your password.
        </p>

        <form onSubmit={handleRequestReset} className="space-y-5">
          <div className="group relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
              size={18}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Email Address"
              className={`${inputClass} ${normalBorder}`}
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Send Code
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </motion.button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-stone-500 transition-colors hover:text-stone-800"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-center text-sm text-stone-500">
        Enter the verification code sent to{" "}
        <span className="font-medium text-stone-800">{email}</span> and choose a
        new password.
      </p>

      <form onSubmit={handleConfirmReset} className="space-y-4">
        <div className="group relative">
          <KeyRound
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
            size={18}
          />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setFieldErrors((prev) => ({ ...prev, code: undefined }));
            }}
            placeholder="Verification Code"
            className={`${inputClass} ${fieldErrors.code ? errorBorder : normalBorder}`}
          />
          {fieldErrors.code && (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.code}</p>
          )}
        </div>

        <div className="group relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
            size={18}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            placeholder="New Password"
            className={`${inputClass} ${fieldErrors.newPassword ? errorBorder : normalBorder}`}
          />
          {fieldErrors.newPassword && (
            <p className="mt-1 text-xs text-rose-600">
              {fieldErrors.newPassword}
            </p>
          )}
        </div>

        <div className="group relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
            size={18}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((prev) => ({
                ...prev,
                confirmPassword: undefined,
              }));
            }}
            placeholder="Confirm New Password"
            className={`${inputClass} ${fieldErrors.confirmPassword ? errorBorder : normalBorder}`}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Reset Password
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </motion.button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-stone-500 transition-colors hover:text-stone-800"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
