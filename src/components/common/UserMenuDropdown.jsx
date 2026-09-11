import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Package,
  Laptop,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { SignOutDialog } from "@/components/common/SignOutDialog"

export function UserMenuDropdown() {
  const { user, profile, role, signOut } = useAuth()
  const { navigate } = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef(null)

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const email = profile?.email || user?.email || "user@itams.edu"

  // Role metadata configurations
  const roleConfig = {
    itsd: {
      title: "ITSD Admin",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
      avatarGrad: "from-red-700 to-rose-600",
      icon: ShieldCheck,
      detail: profile?.roleDetails?.admin_level || "Tier 3 Lead Admin",
    },
    inventory_staff: {
      title: "IT Specialist",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
      avatarGrad: "from-red-700 to-rose-600",
      icon: Package,
      detail: profile?.roleDetails?.badge_number ? `Badge: ${profile.roleDetails.badge_number}` : "Warehouse Logistics",
    },
    end_user: {
      title: "End User",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      avatarGrad: "from-emerald-700 to-teal-600",
      icon: Laptop,
      detail: profile?.roleDetails?.department || "General Staff",
    },
  }

  const currentRole = roleConfig[role] || roleConfig.end_user
  const RoleIcon = currentRole.icon

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleNavigate = (path) => {
    setIsOpen(false)
    navigate(path)
  }

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutDialog(false)
    navigate("/signin")
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-600/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <div
          className={`size-8 rounded-[5px] bg-gradient-to-tr ${currentRole.avatarGrad} text-white flex items-center justify-center font-bold text-xs shadow-xs relative`}
        >
          {displayName.charAt(0).toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        </div>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 origin-top-right bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xl py-1.5 z-50 divide-y divide-zinc-100 dark:divide-zinc-800/80 focus:outline-none"
          >
            {/* User Identity Header */}
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div
                  className={`size-10 rounded-[5px] bg-gradient-to-tr ${currentRole.avatarGrad} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mb-1">
                    {email}
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <RoleIcon className="size-3 shrink-0" />
                    <span className="truncate">{currentRole.title}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleNavigate("/profile?tab=overview")}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
              >
                <User className="size-4 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">My Profile</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Personal info & role details</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("/profile?tab=credentials")}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
              >
                <KeyRound className="size-4 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">Credentials & Access</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Security vault, login ID & keys</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("/profile?tab=settings")}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
              >
                <Settings className="size-4 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">Account Settings</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Preferences & theme options</span>
                </div>
              </button>
            </div>

            {/* Sign Out Button */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setShowSignOutDialog(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer font-medium"
              >
                <LogOut className="size-4 text-red-600 dark:text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog via React Portal */}
      <SignOutDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isSigningOut}
      />
    </div>
  )
}

export default UserMenuDropdown
