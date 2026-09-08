import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutDialog({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Allow closing on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose?.()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-dialog-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Full Screen Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Centered Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-2xl p-6 overflow-hidden z-10 my-auto"
          >
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-[5px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
                <LogOut className="size-5" />
              </div>

              <div className="flex-1 space-y-1.5">
                <h3 id="signout-dialog-title" className="text-base font-bold text-foreground tracking-tight">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to end your current session? You will need to enter your credentials to access the ITAMS portal again.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-[5px] text-xs font-medium cursor-pointer h-9 px-4"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="brand"
                size="sm"
                onClick={onConfirm}
                isLoading={isLoading}
                className="rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer bg-red-700 hover:bg-red-800 text-white h-9 px-4"
              >
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default SignOutDialog
