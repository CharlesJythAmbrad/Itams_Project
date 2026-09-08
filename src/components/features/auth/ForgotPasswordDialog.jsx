import React, { useState } from "react"
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export function ForgotPasswordDialog({ isOpen, onClose, defaultEmail = "" }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })

  if (!isOpen) return null

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
        message: result.error || "Failed to send reset link. Please verify your email.",
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-[5px] bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl border border-border/80"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
            <KeyRound className="size-5.5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
            <p className="text-xs text-muted-foreground">
              Enter your email to receive recovery instructions
            </p>
          </div>
        </div>

        {status.type === "success" ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Instructions Sent</p>
                <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
                  {status.message} Check your inbox and follow the secure link to reset your credentials.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={onClose}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.type === "error" && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 flex items-center gap-2.5 text-red-800 dark:text-red-300 text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{status.message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-xs font-semibold text-foreground/80">
                Registered Email Address <span className="text-red-600">*</span>
              </label>
              <Input
                id="reset-email"
                type="email"
                autoFocus
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={Mail}
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-10"
                onClick={onClose}
                disabled={loading}
              >
                <ArrowLeft className="size-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                className="flex-1 h-10 font-semibold"
                isLoading={loading}
              >
                Send Link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordDialog
