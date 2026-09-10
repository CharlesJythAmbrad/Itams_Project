import React from "react"
import { Menu, Search, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UserMenuDropdown } from "@/components/common/UserMenuDropdown"
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown"

export function ITSDHeader({ onToggleMobile, activeTitle = "Overview" }) {
  const { profile, user } = useAuth()
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "ITSD Administrator"

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
          <p className="text-[11px] text-muted-foreground hidden lg:block">
            IT Systems Desk • Infrastructure Console
          </p>
        </div>
      </div>

      {/* Right Header Tools */}
      <div className="flex items-center gap-3">
        {/* Search shortcut */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 text-xs text-muted-foreground">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search nodes, servers, IPs..."
            className="bg-transparent text-xs text-foreground outline-none w-36 lg:w-48 placeholder:text-muted-foreground/70"
          />
          <kbd className="text-[10px] bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Notification Dropdown */}
        <NotificationsDropdown />

        {/* Role Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[5px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900">
          <ShieldCheck className="size-3.5" />
          ITSD Admin
        </span>

        {/* User Dropdown Menu */}
        <UserMenuDropdown />
      </div>
    </header>
  )
}

export default ITSDHeader
