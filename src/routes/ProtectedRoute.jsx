import React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

/**
 * ProtectedRoute component for standard react-router-dom guarding.
 * Checks authentication status and optional role-based access permissions.
 */
export function ProtectedRoute({ allowedRoles = null, children }) {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  // During auth initialization, render the branded loading screen
  if (loading) {
    return (
      <AuthLoadingScreen
        message="Verifying session..."
        submessage="Connecting to ITAMS security vault..."
      />
    )
  }

  // Not authenticated -> redirect to signin default route
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // Check role authorization if allowedRoles are specified
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
