import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Laptop,
  Server,
  ShieldCheck,
  Package,
  Layers,
  QrCode,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  CheckCircle2,
  HardDrive,
  Activity,
  UserCheck,
  ClipboardList,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { SignOutDialog } from "@/components/common/SignOutDialog"
import { UserMenuDropdown } from "@/components/common/UserMenuDropdown"

export function DashboardLayout({ children, activeTab = "overview", onTabChange }) {
  const { user, profile, role, signOut } = useAuth()
  const { navigate } = useRouter()

  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop collapse state
  const [isMobileOpen, setIsMobileOpen] = useState(false) // Mobile & tablet slide-over drawer state
  const [isHovered, setIsHovered] = useState(false)

  // Expanded when not collapsed, or when hovered/focused in collapsed mode, or on mobile drawer
  const isExpanded = !isCollapsed || isHovered || isMobileOpen

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const roleMeta = {
    itsd: {
      name: "ITSD Admin",
      badgeColor: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300",
      navItems: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    inventory_staff: {
      name: "Inventory Staff",
      badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300",
      navItems: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    end_user: {
      name: "End User",
      badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300",
      navItems: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
  }

  const currentRole = roleMeta[role] || roleMeta.end_user
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutModal(false)
    navigate("/signin")
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground flex flex-col lg:flex-row antialiased">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. MOBILE & TABLET BACKDROP OVERLAY */}
      {/* ------------------------------------------------------------------------ */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. SIDEBAR (DESKTOP RAIL + RESPONSIVE MOBILE/TABLET DRAWER) */}
      {/* ------------------------------------------------------------------------ */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true)
        }}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => {
          if (isCollapsed) setIsHovered(true)
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsHovered(false)
          }
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:w-64" : "lg:w-20"
        } ${
          isCollapsed && isHovered
            ? "shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
            : ""
        } ${
          isMobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Brand Header with centered big logo */}
        <div className="h-20 relative flex items-center justify-center px-4 border-b border-zinc-200/80 dark:border-zinc-800 transition-all duration-300">
          <img
            src="/itams_logo.png"
            alt="ITAMS Logo"
            className={`object-contain mx-auto transition-all duration-300 ${
              isExpanded
                ? "h-14 max-w-[190px]"
                : "h-9 max-w-[52px]"
            }`}
          />

          {/* Mobile drawer close button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Role Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2.5 mb-1.5 ${
            !isExpanded ? "hidden" : "block"
          }`}>
            Navigation
          </p>

          {currentRole.navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange?.(item.id)
                  navigate("/dashboard")
                  setIsMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[5px] text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? "bg-red-700 text-white font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                } ${!isExpanded ? "justify-center px-2" : ""}`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
                {isExpanded && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer with Collapse Button (Desktop) & Sign Out */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1">
          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Open Sidebar" : "Collapse Sidebar"}
            className={`hidden lg:flex w-full items-center gap-2 p-2 rounded-[5px] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
              !isExpanded ? "justify-center" : "justify-start"
            }`}
          >
            {isCollapsed ? (
              <>
                <ChevronRight className="size-4 shrink-0" />
                {isExpanded && <span>Open Sidebar</span>}
              </>
            ) : (
              <>
                <ChevronLeft className="size-4 shrink-0" />
                {isExpanded && <span>Collapse Sidebar</span>}
              </>
            )}
          </button>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSignOutModal(true)}
            className={`w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[5px] cursor-pointer ${
              !isExpanded ? "justify-center px-0" : ""
            }`}
          >
            <LogOut className="size-4 shrink-0" />
            {isExpanded && <span>Sign Out</span>}
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <SignOutDialog
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleConfirmSignOut}
          isLoading={isSigningOut}
        />
      </aside>

      {/* ------------------------------------------------------------------------ */}
      {/* 3. MAIN WRAPPER & HEADER */}
      {/* ------------------------------------------------------------------------ */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Sticky Header */}
        <header className="h-16 sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 md:px-8 flex items-center justify-between">
          {/* Left: Mobile Drawer Trigger & Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Hamburger button on mobile & tablet */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-[5px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              aria-label="Open mobile navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb Title */}
            <div>
              <h1 className="text-sm sm:text-base font-bold text-foreground capitalize">
                {activeTab.replace("-", " ")}
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                ITAMS Portal • {currentRole.name} Console
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Search shortcut */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 text-xs text-muted-foreground">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Quick search assets..."
                className="bg-transparent text-xs text-foreground outline-none w-36 lg:w-48 placeholder:text-muted-foreground/70"
              />
              <kbd className="text-[10px] bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 font-mono">
                ⌘K
              </kbd>
            </div>

            {/* Notification bell */}
            <button
              type="button"
              className="relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-600" />
            </button>

            {/* Role Badge Indicator */}
            <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-[5px] border ${currentRole.badgeColor}`}>
              {currentRole.name}
            </span>

            {/* User Dropdown Menu */}
            <UserMenuDropdown />
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
