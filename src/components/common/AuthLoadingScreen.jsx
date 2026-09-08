import React from "react"
import { motion, AnimatePresence } from "framer-motion"

export function AuthLoadingScreen({
  message = "Authenticating session...",
  submessage = "Verifying security credentials & access permissions...",
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm p-4 select-none"
    >
      {/* Background radial accent */}
      <div className="absolute inset-0 bg-radial from-red-600/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated ITAMS Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: -8 }}
          animate={{
            scale: [0.97, 1.02, 0.97],
            opacity: 1,
            y: 0,
          }}
          transition={{
            scale: {
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut",
            },
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
          }}
          className="relative flex items-center justify-center p-3 rounded-[5px]"
        >
          <img
            src="/itams_logo.png"
            alt="ITAMS Logo"
            className="h-14 sm:h-16 w-auto max-w-[220px] object-contain drop-shadow-sm"
          />
        </motion.div>

        {/* Loading UI Below the Logo */}
        <div className="w-56 sm:w-64 mt-6 space-y-3 flex flex-col items-center">
          {/* Animated Gradient Progress Track */}
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden relative shadow-inner border border-zinc-200/60 dark:border-zinc-700/60">
            <motion.div
              className="h-full bg-gradient-to-r from-red-700 via-rose-500 to-red-700 rounded-full w-2/5"
              initial={{ x: "-100%" }}
              animate={{ x: "280%" }}
              transition={{
                repeat: Infinity,
                duration: 1.1,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </div>

          {/* Status Text */}
          <div className="space-y-1">
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-sm font-bold tracking-tight text-foreground"
            >
              {message}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-xs text-muted-foreground leading-tight"
            >
              {submessage}
            </motion.p>
          </div>

          {/* Animated pulsating micro-dots */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="size-1.5 rounded-full bg-red-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="size-1.5 rounded-full bg-red-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="size-1.5 rounded-full bg-red-600 animate-bounce" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AuthLoadingScreen
