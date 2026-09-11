import React, { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  ShieldCheck,
  Package,
  Laptop,
  KeyRound,
  Settings,
  Mail,
  Calendar,
  Fingerprint,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Save,
  Clock,
  ShieldAlert,
  HardDrive,
  Bell,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SignOutDialog } from "@/components/common/SignOutDialog"
import { ITSDLayout } from "@/layouts/itsd/ITSDLayout"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { EndUsersLayout } from "@/layouts/end_users/EndUsersLayout"

export function ProfileSettingsPage() {
  const { user, profile, role, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const currentTab = searchParams.get("tab") || "overview"
  const setTab = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  // Profile Form States
  const [fullName, setFullName] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null)
  const [copiedId, setCopiedId] = useState(false)

  // Password Form States
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  // Sign out modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Sync state when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name)
    }
  }, [profile, user])

  const displayName = fullName || profile?.full_name || user?.email?.split("@")[0] || "User"
  const userEmail = profile?.email || user?.email || "user@itams.edu"
  const userId = user?.id || "N/A"
  const createdAtFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "September 8, 2026"

  // Role visual configuration
  const roleMeta = {
    itsd: {
      name: "ITSD Admin",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
      accentGrad: "from-red-700 via-rose-600 to-red-800",
      icon: ShieldCheck,
      desc: "IT Systems Desk & Infrastructure Vault Administrator",
      permissions: [
        { label: "Server Node Fleet Management", allowed: true },
        { label: "System Security Vault & Infrastructure Admin", allowed: true },
        { label: "Row-Level Security & RBAC Policy Oversight", allowed: true },
        { label: "Cross-Department Asset Audit Trail Access", allowed: true },
        { label: "Warehouse Stock Ledger Intake & Dispatch", allowed: true },
      ],
    },
    inventory_staff: {
      name: "IT Specialist",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
      accentGrad: "from-red-900 via-red-800 to-zinc-900",
      icon: Package,
      desc: "Asset Custody & Warehouse Stock Logistics Specialist",
      permissions: [
        { label: "Warehouse Stock Ledger Read/Write", allowed: true },
        { label: "Hardware Tagging, Serial & QR Code Intake", allowed: true },
        { label: "Asset Dispatch & Custody Transfer", allowed: true },
        { label: "Warehouse Storage Bay Relocation", allowed: true },
        { label: "Server Node Infrastructure Architecture", allowed: false },
      ],
    },
    end_user: {
      name: "End User",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      accentGrad: "from-emerald-700 via-teal-600 to-emerald-800",
      icon: Laptop,
      desc: "Enterprise Personnel Asset Custody Workspace",
      permissions: [
        { label: "Assigned Personal Equipment Custody", allowed: true },
        { label: "Hardware Service & Repair Ticket Requests", allowed: true },
        { label: "Asset Handover & Return Submission", allowed: true },
        { label: "Warehouse Bay Relocation", allowed: false },
        { label: "Server Node Infrastructure Administration", allowed: false },
      ],
    },
  }

  const currentRole = roleMeta[role] || roleMeta.end_user
  const RoleIcon = currentRole.icon

  // Copy User UUID
  const handleCopyId = async () => {
    if (!userId) return
    try {
      await navigator.clipboard.writeText(userId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Update Full Name
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setIsUpdatingProfile(true)
    setProfileMessage(null)

    try {
      // 1. Update Supabase Auth user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })
      if (authError) throw authError

      // 2. Also update public.users table
      if (user?.id) {
        await supabase
          .from("users")
          .update({ full_name: fullName.trim() })
          .eq("id", user.id)
      }

      setProfileMessage({
        type: "success",
        text: "Your profile name has been successfully updated.",
      })
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err.message || "Failed to update profile name.",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match. Please re-enter.",
      })
      return
    }

    setIsUpdatingPassword(true)

    try {
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (pwdError) throw pwdError

      setPasswordMessage({
        type: "success",
        text: "Your password has been changed successfully.",
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err.message || "Failed to update password.",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Handle Sign Out confirmation
  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setShowSignOutModal(false)
    navigate("/signin")
  }

  // Choose the surrounding layout according to current role
  const LayoutComponent =
    role === "itsd"
      ? ITSDLayout
      : role === "inventory_staff"
      ? InventoryStaffLayout
      : EndUsersLayout

  return (
    <LayoutComponent activeTab="profile">
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className={`p-6 sm:p-8 rounded-[5px] bg-gradient-to-r ${currentRole.accentGrad} text-white shadow-lg relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <RoleIcon className="size-48" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="size-16 sm:size-20 rounded-[5px] bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-[5px] bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    <RoleIcon className="size-3.5" />
                    {currentRole.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 font-normal">
                  {userEmail}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-white/70 pt-0.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Member since {createdAtFormatted}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" /> RLS Verified
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSignOutModal(true)}
              className="self-start sm:self-center rounded-[5px] text-xs font-semibold text-white border-white/40 bg-white/10 hover:bg-white/20 hover:text-white cursor-pointer h-9 px-3.5"
            >
              <LogOut className="size-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[5px] border-b-2 transition-colors cursor-pointer shrink-0 ${
              currentTab === "overview"
                ? "border-red-700 text-red-700 dark:border-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <User className="size-4" />
            <span>Profile & Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("credentials")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[5px] border-b-2 transition-colors cursor-pointer shrink-0 ${
              currentTab === "credentials"
                ? "border-red-700 text-red-700 dark:border-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <KeyRound className="size-4" />
            <span>Credentials & Access</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-[5px] border-b-2 transition-colors cursor-pointer shrink-0 ${
              currentTab === "settings"
                ? "border-red-700 text-red-700 dark:border-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Settings className="size-4" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Tab 1: Profile & Identity */}
        {currentTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Cols: Edit Identity & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Form */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Personal Identity Details
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Update your official display name associated with your ITAMS account.
                  </p>
                </div>

                {profileMessage && (
                  <div
                    className={`p-3 rounded-[5px] text-xs font-medium flex items-center gap-2.5 ${
                      profileMessage.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full legal name"
                        className="rounded-[5px] text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Primary System Email
                      </label>
                      <Input
                        type="email"
                        value={userEmail}
                        disabled
                        className="rounded-[5px] text-xs h-9 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <Button
                      type="submit"
                      variant="brand"
                      size="sm"
                      isLoading={isUpdatingProfile}
                      className="rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer bg-red-700 hover:bg-red-800 text-white h-9 px-4"
                    >
                      <Save className="size-3.5" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>

              {/* Role-Specific Assignment Details */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Role Custody & Operational Scope
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Assigned organizational parameters and security boundary.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[5px] border ${currentRole.badgeColor}`}>
                    {currentRole.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {role === "itsd" && (
                    <>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Clearance Level</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {profile?.roleDetails?.admin_level || "Tier 3 Lead Admin"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Assigned Shift</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">Day Shift (08:00 - 17:00 PHT)</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Security Clearance</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">Zero Trust Security Vault</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Node Custody Scope</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">1,482 Workstation Nodes</p>
                      </div>
                    </>
                  )}

                  {role === "inventory_staff" && (
                    <>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Staff Badge Number</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {profile?.roleDetails?.badge_number || "INV-8821"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Department</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">ITSD</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Custody Scope</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">Stock Intake & Hardware Serial Ledger</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Verification Status</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Certified Logistics Handler</p>
                      </div>
                    </>
                  )}

                  {role === "end_user" && (
                    <>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Department</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {profile?.roleDetails?.department || "College of Engineering"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Assigned Workstation</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">Engineering Lab 402 • Desk 08</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Active Custody Devices</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">1 Laptop • 1 Monitor • 1 Dock</p>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                        <p className="text-[11px] text-muted-foreground font-medium">Maintenance Warranty Status</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Active Full Coverage</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Account Metadata Card */}
            <div className="space-y-6">
              <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  System Identifiers
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block">
                      Account User UUID
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-[5px] text-foreground truncate flex-1 select-all border border-zinc-200 dark:border-zinc-700">
                        {userId}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyId}
                        className="size-8 shrink-0 rounded-[5px] cursor-pointer"
                        title="Copy UUID"
                      >
                        {copiedId ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block">
                      Authentication Provider
                    </label>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      Supabase GoTrue (Password Auth)
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block">
                      Database Table
                    </label>
                    <p className="text-xs font-mono text-foreground mt-0.5">
                      public.{role === "itsd" ? "itsd_users" : role === "inventory_staff" ? "inventory_staff_users" : "end_users"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block">
                      Account Status
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Credentials & Access Data */}
        {currentTab === "credentials" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Cols: Credentials Overview & Permissions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Credentials & Login Identity */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Authentication Credentials
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    System login credentials and assigned GoTrue identity metadata.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Primary Login Email
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground truncate">
                      {userEmail}
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      System Username Alias
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground truncate">
                      {userEmail.split("@")[0]}
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Password Hash Mechanism
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      Bcrypt (GoTrue Managed)
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Security Policy Level
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      PostgreSQL RLS Protected
                    </p>
                  </div>
                </div>
              </div>

              {/* RBAC Permissions Matrix */}
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Permissions enforced on public schema tables for the <strong className="text-foreground">{currentRole.name}</strong> role.
                  </p>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-[5px] overflow-hidden">
                  {currentRole.permissions.map((perm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 sm:px-4 text-xs bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">{perm.label}</span>
                      {perm.allowed ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-[5px] border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="size-3.5" />
                          Permitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700">
                          Restricted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Password Update */}
            <div className="space-y-6">
              <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Lock className="size-4.5 text-red-700 dark:text-red-500" />
                  <h3 className="text-sm font-bold">
                    Update Password
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Change your login password. Must be at least 6 characters.
                </p>

                {passwordMessage && (
                  <div
                    className={`p-3 rounded-[5px] text-xs font-medium flex items-center gap-2 ${
                      passwordMessage.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-[5px] text-xs h-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((p) => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-[5px] text-xs h-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    isLoading={isUpdatingPassword}
                    className="w-full rounded-[5px] text-xs font-semibold cursor-pointer bg-red-700 hover:bg-red-800 text-white h-9 mt-2"
                  >
                    Update Password
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Account Settings & Preferences */}
        {currentTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Preferences */}
            <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  System Preferences
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure notification triggers and interface options.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Critical Infrastructure Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Receive real-time badges for offline nodes</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Enabled
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Security Audit Logging</p>
                    <p className="text-[11px] text-muted-foreground">Log login timestamps and role changes</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Enforced
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Daily Warehouse Digest</p>
                    <p className="text-[11px] text-muted-foreground">Summary of equipment checkout statuses</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px] bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Optional
                  </span>
                </div>
              </div>
            </div>

            {/* Session Management & Danger Zone */}
            <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[5px] shadow-xs space-y-5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Session & Security Termination
                </h2>
                <p className="text-xs text-muted-foreground">
                  Active session status and account departure actions.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Current Active Session</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Online Now
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Authenticated via Supabase JWT with Role-Based RLS claims.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignOutModal(true)}
                  className="rounded-[5px] text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/60 cursor-pointer h-9 px-4 gap-2"
                >
                  <LogOut className="size-3.5" />
                  Sign Out from ITAMS
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirmation Dialog via Portal */}
      <SignOutDialog
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isSigningOut}
      />
    </LayoutComponent>
  )
}

export default ProfileSettingsPage
