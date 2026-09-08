import React from "react"
import { Menu, Search, Bell, Laptop, HelpCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UserMenuDropdown } from "@/components/common/UserMenuDropdown"

export function EndUsersHeader({ onToggleMobile, activeTitle = "My Equipment" }) {
  const { profile, user } = useAuth()
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "End User"

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Drawer Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-[5px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="size-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-foreground capitalize">
            {activeTitle}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Personal IT Assets • Custody Portal & Service Requests
          </p>
        </div>
      </div>

      {/* Right Header Tools */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 text-xs text-muted-foreground">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search my devices, tickets..."
            className="bg-transparent text-xs text-foreground outline-none w-36 lg:w-48 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Support Help Button */}
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          title="IT Helpdesk FAQ"
        >
          <HelpCircle className="size-3.5" />
          <span>Support</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4.5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-600" />
        </button>

        {/* Role Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[5px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900">
          <Laptop className="size-3.5" />
          End User
        </span>

        {/* User Dropdown Menu */}
        <UserMenuDropdown />
      </div>
    </header>
  )
}

export default EndUsersHeader
