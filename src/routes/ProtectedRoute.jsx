import React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

/**
 * ProtectedRoute component for standard react-router-dom guarding.
 * Checks authentication status and optional role-based access permissions.
 */
export function ProtectedRoute({ allowedRoles = null, children }) {
  const { isAuthenticated, loading, role, profile } = useAuth()
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

  // Check if user account is deactivated
  if (profile?.is_deactivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-md w-full space-y-4 p-6">
          <div className="text-center">
            <div className="size-16 mx-auto bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4">
              <svg className="size-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Account Deactivated</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account has been deactivated by an administrator. Please contact IT support for assistance.
            </p>
            <button
              onClick={() => window.location.href = "/signin"}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check role authorization if allowedRoles are specified
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
