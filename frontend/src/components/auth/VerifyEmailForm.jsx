import { useEffect, useState } from "react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import { useAuthLogin } from "../../hooks/useAuthLogin";
import { useResendTimer } from "../../hooks/useResendTimer";
import { getCognitoErrorMessage } from "../../utils/cognitoErrors";

export default function VerifyEmailForm({
  email,
  password,
  onLogin,
  onBack,
  onVerifiedWithoutLogin,
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { login, loading: loginLoading } = useAuthLogin(onLogin);
  const { seconds, canResend, start } = useResendTimer(30);

  const loading = verifying || loginLoading;

  useEffect(() => {
    start();
  }, [start]);

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code.trim(),
      });

      if (password) {
        const result = await login(email, password);
        if (result.status !== "signed_in") {
          setError(
            "Email verified successfully, but automatic sign-in failed. Please sign in manually.",
          );
        }
      } else {
        onVerifiedWithoutLogin?.();
      }
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;

    setResending(true);
    setError("");
    setResendMessage("");
    try {
      await resendSignUpCode({ username: email });
      setResendMessage("A new verification code has been sent.");
      start();
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <p className="mb-6 text-center text-sm text-stone-500">
        We have sent a verification code to your email.
      </p>
      <p className="mb-6 text-center text-sm font-medium text-stone-800">
        {email}
      </p>

      <form onSubmit={handleVerify} className="space-y-5">
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
              setError("");
            }}
            placeholder="Verification Code"
            className="w-full rounded-2xl border border-stone-200 bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        {resendMessage && (
          <p className="text-sm text-emerald-600" role="status">
            {resendMessage}
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
              Verify
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </motion.button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="text-stone-500 transition-colors hover:text-stone-800"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className="text-stone-500 transition-colors hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending
              ? "Sending..."
              : canResend
                ? "Resend Code"
                : `Resend Code (${seconds}s)`}
          </button>
        </div>
      </form>
    </div>
  );
}
