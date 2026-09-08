import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import { AuthShowcase } from "@/components/features/auth/AuthShowcase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { navigate } = useRouter()

  const [email, setEmail] = useState("")
  const [focusedField, setFocusedField] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setStatus({ type: "error", message: "Please enter your registered email address." })
      return
    }

    setLoading(true)
    setStatus({ type: null, message: "" })

    const result = await resetPassword(email.trim())
    setLoading(false)

    if (result.success) {
      setStatus({
        type: "success",
        message: result.message || "Password recovery instructions have been sent to your email.",
      })
    } else {
      setStatus({
        type: "error",
        message: result.error || "Failed to send reset link. Please check your email address.",
      })
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-foreground overflow-y-auto overflow-x-hidden py-6 sm:py-8 lg:py-10">
      {/* Subtle Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none bg-dot-pattern opacity-60 dark:opacity-40" />

      {/* Main Responsive Container */}
      <main className="relative z-10 w-full max-w-[1500px] my-auto px-4 sm:px-8 md:px-10 lg:px-16 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center w-full">
          {/* Left Column: Adaptive ITAMS Logo Showcase */}
          <section
            aria-label="System Branding"
            className="lg:col-span-6 flex items-center justify-center w-full"
          >
            <AuthShowcase />
          </section>

          {/* Right Column: Animated Forgot Password Form */}
          <section
            aria-label="Forgot Password Form"
            className="lg:col-span-6 flex flex-col items-center justify-center w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto"
            >
              <Card
                variant="elevated"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xl shadow-black/5 rounded-[5px]"
              >
                <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 space-y-6">
                  {/* Header Typography */}
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Reset password
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Enter your email to receive recovery instructions
                    </p>
                  </div>

                  {/* Animated Status Banners */}
                  <AnimatePresence mode="wait">
                    {status.type === "error" && (
                      <motion.div
                        key="error-banner"
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
                          <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                          <div className="flex-1 font-medium">{status.message}</div>
                        </div>
                      </motion.div>
                    )}

                    {status.type === "success" && (
                      <motion.div
                        key="success-banner"
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5 overflow-hidden"
                      >
                        <div className="rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                          <div className="flex-1 leading-relaxed">
                            <p className="font-semibold text-sm">Recovery Link Sent</p>
                            <p className="mt-1 text-emerald-700 dark:text-emerald-400">
                              {status.message} Check your inbox and follow the secure link to reset your credentials.
                            </p>
                          </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }}>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 rounded-[5px] text-sm font-medium"
                            onClick={() => navigate("/signin")}
                          >
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Sign in
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {status.type !== "success" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email Field with Icon and Underline Style */}
                      <div className="space-y-1">
                        <div
                          className={`relative flex items-center gap-3 pb-2.5 border-b transition-colors duration-150 ${
                            focusedField || email
                              ? "border-zinc-900 dark:border-zinc-100"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <Mail
                            className="size-4.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                            strokeWidth={1.8}
                          />
                          <div className="relative flex-1">
                            <input
                              id="reset-email-input"
                              type="email"
                              autoComplete="email"
                              value={email}
                              onFocus={() => setFocusedField(true)}
                              onBlur={() => setFocusedField(false)}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder=""
                              className="w-full bg-transparent text-sm text-foreground outline-none pt-2.5 pb-0 placeholder:text-transparent"
                              required
                            />
                            <label
                              htmlFor="reset-email-input"
                              className={`pointer-events-none absolute left-0 transition-all duration-150 select-none ${
                                email || focusedField
                                ? "-top-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                                : "top-2 text-sm text-zinc-400 dark:text-zinc-500"
                              }`}
                            >
                              Email Address <span className="text-red-500 font-semibold">*</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Animated Submit Button */}
                      <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }}>
                        <Button
                          type="submit"
                          variant="brand"
                          className="w-full h-11 text-sm font-semibold tracking-wide rounded-[5px] shadow-sm transition-all"
                          isLoading={loading}
                        >
                          Send Recovery Link
                        </Button>
                      </motion.div>

                      {/* Back to login link */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => navigate("/signin")}
                          className="inline-flex items-center text-sm text-zinc-500 hover:text-red-700 dark:text-zinc-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="size-3.5 mr-1.5" />
                          Back to Sign in
                        </button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ForgotPasswordPage
