import React from "react"
import { motion } from "framer-motion"

export function AuthShowcase() {
  return (
    <div className="flex items-center justify-center w-full p-2 sm:p-4">
      <motion.img
        src="/itams_logo.png"
        alt="ITAMS Logo"
        initial={{ opacity: 0, scale: 0.95, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[160px] sm:max-w-[210px] md:max-w-[260px] lg:max-w-[310px] xl:max-w-[340px] max-h-[16vh] sm:max-h-[20vh] lg:max-h-[36vh] xl:max-h-[38vh] h-auto object-contain select-none transition-all duration-200"
      />
    </div>
  )
}

export default AuthShowcase
