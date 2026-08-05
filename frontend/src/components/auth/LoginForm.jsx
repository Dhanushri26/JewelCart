import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuthLogin } from "../../hooks/useAuthLogin";

export default function LoginForm({
  onLogin,
  onForgotPassword,
  onVerifyRequired,
}) {
  const { login, confirmNewPassword, loading, error, setError } =
    useAuthLogin(onLogin);

  const [step, setStep] = useState("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const result = await login(email, password);
    if (result.status === "new_password_required") {
      setStep("NEW_PASSWORD");
    } else if (result.status === "not_confirmed") {
      onVerifyRequired?.(email);
    }
  }

  async function handleNewPassword(e) {
    e.preventDefault();
    await confirmNewPassword(newPassword);
  }

  return (
    <form
      onSubmit={step === "LOGIN" ? handleLogin : handleNewPassword}
      className="space-y-5"
    >
      {step === "LOGIN" ? (
        <motion.div
          key="login-fields"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-5"
        >
          <div className="group relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
              size={18}
            />
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Email or Username"
              className="w-full rounded-2xl border border-stone-200 bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
            />
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
                setError("");
              }}
              placeholder="Password"
              className="w-full rounded-2xl border border-stone-200 bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="password-fields"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <p className="mb-4 text-sm text-stone-500">
            For your security, please create a new password.
          </p>
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
                setError("");
              }}
              placeholder="New Password"
              className="w-full rounded-2xl border border-stone-200 bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
            />
          </div>
        </motion.div>
      )}

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
        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            {step === "LOGIN" ? "Sign In" : "Set Password"}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </motion.button>

      {step === "LOGIN" && (
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-stone-500 transition-colors hover:text-stone-800"
          >
            Forgot Password?
          </button>
        </div>
      )}
    </form>
  );
}
