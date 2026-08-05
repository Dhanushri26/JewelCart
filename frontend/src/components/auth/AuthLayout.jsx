import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4 font-sans selection:bg-amber-200">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50vh] w-[50vw] rounded-full bg-amber-100/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[60vh] w-[50vw] rounded-full bg-stone-200/50 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 shadow-lg"
          >
            <ShieldCheck className="text-white" size={28} strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-medium tracking-tight text-stone-900">
            JewelCart
          </h1>
          {title && (
            <h2 className="mt-4 text-xl font-medium text-stone-800">{title}</h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
          )}
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

        {children}
      </motion.div>
    </div>
  );
}
