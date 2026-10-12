import React from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ITSDDashboardPage } from "./itsd/ITSDDashboardPage"
import { InventoryStaffDashboardPage } from "./inventory_staff/InventoryStaffDashboardPage"
import { EndUsersDashboardPage } from "./end_users/EndUsersDashboardPage"

export function DashboardPage() {
  const { role } = useAuth()
  const location = useLocation()
  
  // Extract success message from navigation state
  const successMessage = location.state?.successMessage
  const showSuccess = location.state?.showSuccess

  // Route to the role-specific dashboard page with success message
  switch (role) {
    case "itsd":
      return <ITSDDashboardPage successMessage={successMessage} showSuccess={showSuccess} />
    case "inventory_staff":
      return <InventoryStaffDashboardPage successMessage={successMessage} showSuccess={showSuccess} />
    case "end_user":
    default:
      return <EndUsersDashboardPage successMessage={successMessage} showSuccess={showSuccess} />
  }
}

export default DashboardPage
