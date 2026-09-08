import { useMemo } from "react"
import { useAuth } from "./useAuth"

/**
 * Custom hook to encapsulate role-based styling, metadata, and permissions.
 */
export function useUserRole() {
  const { role, profile, user } = useAuth()

  const roleConfig = useMemo(() => {
    switch (role) {
      case "itsd":
        return {
          id: "itsd",
          displayName: "ITSD Administrator",
          badgeLabel: "ITSD Admin",
          colorTheme: "red",
          badgeClass: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-900",
          gradientClass: "from-red-700 to-rose-600",
          headerSub: "IT Systems Desk • Server Infrastructure & Security Vault",
          subRole: profile?.roleDetails?.admin_level || "Lead Administrator",
        }
      case "inventory_staff":
        return {
          id: "inventory_staff",
          displayName: "Inventory Staff",
          badgeLabel: "Inventory Staff",
          colorTheme: "blue",
          badgeClass: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900",
          gradientClass: "from-blue-700 to-indigo-600",
          headerSub: "Asset Custody • Warehouse & Stock Logistics",
          subRole: profile?.roleDetails?.inventory_tier || "Lead Custodian",
        }
      case "end_user":
      default:
        return {
          id: "end_user",
          displayName: "End User",
          badgeLabel: "End User",
          colorTheme: "emerald",
          badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900",
          gradientClass: "from-emerald-700 to-teal-600",
          headerSub: "Personal IT Assets • Custody Portal & Requests",
          subRole: profile?.roleDetails?.department || "Academic Affairs",
        }
    }
  }, [role, profile])

  const userDisplayName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  }, [profile, user])

  return {
    role,
    roleConfig,
    userDisplayName,
    isITSD: role === "itsd",
    isInventoryStaff: role === "inventory_staff",
    isEndUser: role === "end_user",
    roleDetails: profile?.roleDetails || null,
  }
}

export default useUserRole
