import { useState } from "react";
import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [step, setStep] = useState("LOGIN"); // "LOGIN" | "NEW_PASSWORD"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await signIn({
        username: email,
        password,
      });

      if (result.isSignedIn) {
        await fetchAuthSession();
        onLogin();
        return;
      }

      if (
        result.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        setStep("NEW_PASSWORD");
        return;
      }
    } catch (err) {
      if (err.name === "UserAlreadyAuthenticatedException") {
        await fetchAuthSession();
        onLogin();
        return;
      }
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(e) {
    if (e) e.preventDefault();
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      // confirmSignIn often just resolves on success, we check nextStep or isSignedIn implicitly
      if (result.isSignedIn || !result.nextStep) {
        await fetchAuthSession();
        onLogin();
      }
    } catch (err) {
      setError(err.message || "Failed to set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4 font-sans selection:bg-amber-200">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Subtle background abstract shapes */}
        <div className="absolute -left-[10%] -top-[10%] h-[50vh] w-[50vw] rounded-full bg-amber-100/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[60vh] w-[50vw] rounded-full bg-stone-200/50 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 shadow-lg"
          >
            <ShieldCheck className="text-white" size={28} strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-medium tracking-tight text-stone-900">
            {step === "LOGIN" ? "Welcome back" : "Update Password"}
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            {step === "LOGIN"
              ? "Enter your credentials to access your luxury selection."
              : "For your security, please create a new password."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 backdrop-blur-sm">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  type="text" // Using text to allow username or email
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
              <div className="group relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-stone-900"
                  size={18}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full rounded-2xl border border-stone-200 bg-white/50 py-4 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
                />
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-70"
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
        </form>
      </motion.div>
    </div>
  );
}
