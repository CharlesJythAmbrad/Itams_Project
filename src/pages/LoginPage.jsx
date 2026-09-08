import React from "react"
import { AuthShowcase } from "@/components/features/auth/AuthShowcase"
import { LoginForm } from "@/components/features/auth/LoginForm"

export function LoginPage() {
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

          {/* Right Column: Clean Login Form */}
          <section
            aria-label="Authentication Form"
            className="lg:col-span-6 flex flex-col items-center justify-center w-full"
          >
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
