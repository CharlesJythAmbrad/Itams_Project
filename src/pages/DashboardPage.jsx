import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { ITSDDashboardPage } from "./itsd/ITSDDashboardPage"
import { InventoryStaffDashboardPage } from "./inventory_staff/InventoryStaffDashboardPage"
import { EndUsersDashboardPage } from "./end_users/EndUsersDashboardPage"

export function DashboardPage() {
  const { role } = useAuth()

  // Route to the role-specific dashboard page
  switch (role) {
    case "itsd":
      return <ITSDDashboardPage />
    case "inventory_staff":
      return <InventoryStaffDashboardPage />
    case "end_user":
    default:
      return <EndUsersDashboardPage />
  }
}

export default DashboardPage
