import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"

export function LoginForm() {
  const { signIn, loading, error, clearError } = useAuth()
  const { navigate } = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!identifier.trim()) {
      errs.identifier = "Username or email is required"
    }
    if (!password) {
      errs.password = "Password is required"
    }
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validate()) return

    setIsSubmitting(true)
    const result = await signIn({
      identifier: identifier.trim(),
      password,
    })

    if (result.success) {
      setLoginSuccess(true)
      navigate("/dashboard")
    } else {
      setIsSubmitting(false)
    }
  }

  return (
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
          {/* Header Typography exactly matching user screenshot */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sign in
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              to continue to <span className="text-zinc-600 dark:text-zinc-300 font-medium">ITAMS Portal</span>
            </p>
          </div>

          {/* Animated Error & Success Banners */}
          <AnimatePresence mode="wait">
            {error && (
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
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              </motion.div>
            )}

            {loginSuccess && (
              <motion.div
                key="success-banner"
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <div className="font-medium">Signing in...</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Form matching the screenshot inputs */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field with Icon and Underline Style */}
            <div className="space-y-1">
              <div
                className={`relative flex items-center gap-3 pb-2.5 border-b transition-colors duration-150 ${
                  focusedField === "username" || identifier
                    ? "border-zinc-900 dark:border-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800"
                } ${validationErrors.identifier ? "border-red-600" : ""}`}
              >
                <User
                  className="size-4.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                  strokeWidth={1.8}
                />
                <div className="relative flex-1">
                  <input
                    id="username-input"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      if (validationErrors.identifier) {
                        setValidationErrors((prev) => ({ ...prev, identifier: null }))
                      }
                    }}
                    placeholder=""
                    className="w-full bg-transparent text-sm text-foreground outline-none pt-2.5 pb-0 placeholder:text-transparent"
                  />
                  <label
                    htmlFor="username-input"
                    className={`pointer-events-none absolute left-0 transition-all duration-150 select-none ${
                      identifier || focusedField === "username"
                        ? "-top-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                        : "top-2 text-sm text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    Username <span className="text-red-500 font-semibold">*</span>
                  </label>
                </div>
              </div>
              {validationErrors.identifier && (
                <p className="text-[11px] text-red-600 font-medium">{validationErrors.identifier}</p>
              )}
            </div>

            {/* Password Field with Key Icon, Underline, and Eye Toggle */}
            <div className="space-y-1">
              <div
                className={`relative flex items-center gap-3 pb-2.5 border-b transition-colors duration-150 ${
                  focusedField === "password" || password
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
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
                    htmlFor="password-input"
                    className={`pointer-events-none absolute left-0 transition-all duration-150 select-none ${
                      password || focusedField === "password"
                        ? "-top-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                        : "top-2 text-sm text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    Password <span className="text-red-500 font-semibold">*</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Animated Primary Action Button */}
            <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }}>
              <Button
                type="submit"
                variant="brand"
                className="w-full h-11 text-sm font-semibold tracking-wide rounded-[5px] shadow-sm transition-all mt-4"
                isLoading={loading}
              >
                Sign In
              </Button>
            </motion.div>
          </form>

          {/* Centered Forgot Password Link navigating to /forgot-password */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-zinc-500 hover:text-red-700 dark:text-zinc-400 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LoginForm