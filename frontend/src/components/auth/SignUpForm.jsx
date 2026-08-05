import { useState } from "react";
import { signUp } from "aws-amplify/auth";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, User } from "lucide-react";
import { getCognitoErrorMessage } from "../../utils/cognitoErrors";
import {
  getPasswordPolicyErrors,
  isValidEmail,
} from "../../utils/passwordValidation";

export default function SignUpForm({ onSignUpSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function validateForm() {
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const passwordErrors = getPasswordPolicyErrors(password);
    if (passwordErrors.length > 0) {
      errors.password = `Password must include: ${passwordErrors.join(", ")}.`;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      await signUp({
        username: email.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
            name: fullName.trim(),
          },
        },
      });

      onSignUpSuccess(email.trim(), password);
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

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="group relative">
        <User
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
          size={18}
        />
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          placeholder="Full Name"
          className={`${inputClass} ${fieldErrors.fullName ? errorBorder : normalBorder}`}
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
        )}
      </div>

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
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="Email Address"
          className={`${inputClass} ${fieldErrors.email ? errorBorder : normalBorder}`}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
        )}
      </div>

      <div className="group relative">
        <Lock
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
          size={18}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="Password"
          className={`${inputClass} ${fieldErrors.password ? errorBorder : normalBorder}`}
        />
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
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
          placeholder="Confirm Password"
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
        className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            Create Account
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </motion.button>
    </form>
  );
}
