import React, { useState } from "react"
import {
  LayoutDashboard,
  Package,
  Layers,
  HardDrive,
  QrCode,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { Button } from "@/components/ui/button"
import { SignOutDialog } from "@/components/common/SignOutDialog"

export function InventoryStaffSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeNav = "stock",
  onSelectNav,
}) {
  const { profile, user, signOut } = useAuth()
  const { navigate } = useRouter()
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Inventory Staff"

  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Expanded when not collapsed, or when hovered/focused in collapsed mode, or on mobile drawer
  const isExpanded = !isCollapsed || isHovered || isMobileOpen

  const navItems = [
    { id: "stock", label: "Dashboard", icon: LayoutDashboard },
  ]

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutModal(false)
    navigate("/signin")
  }

  return (
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
      {/* Centered Big Logo Header - enlarged & fit when open */}
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

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <p className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2.5 mb-1.5 ${
          !isExpanded ? "hidden" : "block"
        }`}>
          Warehouse Operations
        </p>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeNav === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectNav?.(item.id)
                navigate("/dashboard")
                onCloseMobile()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[5px] text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? "bg-blue-700 text-white font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              } ${!isExpanded ? "justify-center px-2" : ""}`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1">
        <button
          type="button"
          onClick={onToggleCollapse}
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
  )
}

export default InventoryStaffSidebar
