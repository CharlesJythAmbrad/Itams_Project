import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import { AuthShowcase } from "@/components/features/auth/AuthShowcase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "@/routes/RouterContext"

export function ResetPasswordPage() {
  const { navigate } = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })
  const [validationErrors, setValidationErrors] = useState({})

  // "verifying" = waiting for PASSWORD_RECOVERY event / token exchange
  // "ready"     = session is confirmed, user can set new password
  // "invalid"   = link is bad or expired
  const [sessionState, setSessionState] = useState("verifying")

  useEffect(() => {
    let handled = false

    /**
     * Supabase fires PASSWORD_RECOVERY when the user visits the reset link.
     * The JS client automatically exchanges the URL hash token into a session.
     * We listen for that event before allowing the form to submit.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          handled = true
          setSessionState("ready")
        }
        // On a page refresh the client may re-emit SIGNED_IN / INITIAL_SESSION
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session && !handled) {
          handled = true
          setSessionState("ready")
        }
      }
    )

    // Fallback: check if a session already exists (e.g. user refreshed the page)
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && !handled) {
          handled = true
          setSessionState("ready")
        } else if (!session) {
          // Give onAuthStateChange time to fire the PASSWORD_RECOVERY event
          setTimeout(() => {
            if (!handled) {
              setSessionState("invalid")
              setStatus({
                type: "error",
                message:
                  "This reset link has expired or is invalid. Please request a new password reset link.",
              })
            }
          }, 3000)
        }
      } catch {
        if (!handled) {
          setSessionState("invalid")
          setStatus({
            type: "error",
            message: "Failed to verify the reset link. Please try again.",
          })
        }
      }
    }

    checkExistingSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const validate = () => {
    const errs = {}
    if (!password) {
      errs.password = "New password is required"
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters"
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match"
    }
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setStatus({ type: null, message: "" })

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setStatus({
          type: "error",
          message: error.message || "Failed to update password. Please try again.",
        })
        return
      }

      setStatus({
        type: "success",
        message: "Your password has been updated successfully!",
      })

      // Sign the user out so they are not silently auto-logged in after reset
      await supabase.auth.signOut()

      setTimeout(() => {
        navigate("/signin")
      }, 2500)
    } catch (err) {
      setStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setLoading(false)
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

          {/* Right Column: Reset Password Form */}
          <section
            aria-label="Reset Password Form"
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
                      Set New Password
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Choose a strong password for your account
                    </p>
                  </div>

                  {/* Verifying link spinner */}
                  {sessionState === "verifying" && status.type !== "error" && (
                    <div className="flex items-center gap-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <Loader2 className="size-5 animate-spin shrink-0" />
                      Verifying reset link…
                    </div>
                  )}

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
                        className="overflow-hidden"
                      >
                        <div className="rounded-[5px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 p-4 flex items-start gap-3 text-xs text-green-800 dark:text-green-300">
                          <CheckCircle2 className="size-5 shrink-0 text-green-600 mt-0.5" />
                          <div className="flex-1 leading-relaxed">
                            <p className="font-semibold text-sm">Password Updated</p>
                            <p className="mt-1 text-green-700 dark:text-green-400">
                              {status.message} Redirecting you to the login page…
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password form — only show once the session is confirmed ready */}
                  {sessionState === "ready" && status.type !== "success" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* New Password Field */}
                      <div className="space-y-1">
                        <div
                          className={`relative flex items-center gap-3 pb-2.5 border-b transition-colors duration-150 ${focusedField === "password" || password
                            ? "border-zinc-900 dark:border-zinc-100"
                            : "border-zinc-200 dark:border-zinc-800"
                            } ${validationErrors.password ? "border-red-600" : ""}`}
                        >
                          <KeyRound
                            className="size-4.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                            strokeWidth={1.8}
                          />
                          <div className="relative flex-1">
                            <input
                              id="new-password-input"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              value={password}
                              onFocus={() => setFocusedField("password")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setPassword(e.target.value)
                                if (validationErrors.password) {
                                  setValidationErrors((prev) => ({ ...prev, password: null }))
                                }
                              }}
                              placeholder=""
                              className="w-full bg-transparent text-sm text-foreground outline-none pt-2.5 pb-0 placeholder:text-transparent pr-2"
                            />
                            <label
                              htmlFor="new-password-input"
                              className={`pointer-events-none absolute left-0 transition-all duration-150 select-none ${password || focusedField === "password"
                                ? "-top-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                                : "top-2 text-sm text-zinc-400 dark:text-zinc-500"
                                }`}
                            >
                              New Password <span className="text-red-500 font-semibold">*</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="size-4.5" strokeWidth={1.8} />
                            ) : (
                              <Eye className="size-4.5" strokeWidth={1.8} />
                            )}
                          </button>
                        </div>
                        {validationErrors.password && (
                          <p className="text-[11px] text-red-600 font-medium">{validationErrors.password}</p>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-1">
                        <div
                          className={`relative flex items-center gap-3 pb-2.5 border-b transition-colors duration-150 ${focusedField === "confirmPassword" || confirmPassword
                            ? "border-zinc-900 dark:border-zinc-100"
                            : "border-zinc-200 dark:border-zinc-800"
                            } ${validationErrors.confirmPassword ? "border-red-600" : ""}`}
                        >
                          <KeyRound
                            className="size-4.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                            strokeWidth={1.8}
                          />
                          <div className="relative flex-1">
                            <input
                              id="confirm-password-input"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              value={confirmPassword}
                              onFocus={() => setFocusedField("confirmPassword")}
                              onBlur={() => setFocusedField(null)}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (validationErrors.confirmPassword) {
                                  setValidationErrors((prev) => ({ ...prev, confirmPassword: null }))
                                }
                              }}
                              placeholder=""
                              className="w-full bg-transparent text-sm text-foreground outline-none pt-2.5 pb-0 placeholder:text-transparent pr-2"
                            />
                            <label
                              htmlFor="confirm-password-input"
                              className={`pointer-events-none absolute left-0 transition-all duration-150 select-none ${confirmPassword || focusedField === "confirmPassword"
                                ? "-top-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                                : "top-2 text-sm text-zinc-400 dark:text-zinc-500"
                                }`}
                            >
                              Confirm Password <span className="text-red-500 font-semibold">*</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="size-4.5" strokeWidth={1.8} />
                            ) : (
                              <Eye className="size-4.5" strokeWidth={1.8} />
                            )}
                          </button>
                        </div>
                        {validationErrors.confirmPassword && (
                          <p className="text-[11px] text-red-600 font-medium">{validationErrors.confirmPassword}</p>
                        )}
                      </div>

                      {/* Password Requirements */}
                      <div className="rounded-[5px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3">
                        <div className="text-xs text-blue-800 dark:text-blue-300">
                          <p className="font-semibold mb-1">Password requirements:</p>
                          <ul className="space-y-0.5 text-blue-700 dark:text-blue-400">
                            <li>• At least 8 characters long</li>
                            <li>• Use a mix of letters, numbers, and symbols</li>
                            <li>• Avoid common passwords or personal information</li>
                          </ul>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }}>
                        <Button
                          type="submit"
                          variant="brand"
                          className="w-full h-11 text-sm font-semibold tracking-wide rounded-[5px] shadow-sm transition-all"
                          isLoading={loading}
                        >
                          Update Password
                        </Button>
                      </motion.div>
                    </form>
                  )}

                  {/* Back to login link */}
                  {status.type !== "success" && (
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

export default ResetPasswordPage
