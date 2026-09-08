import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ProtectedRoute } from "./ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ITSDDashboardPage } from "@/pages/itsd/ITSDDashboardPage"
import { InventoryStaffDashboardPage } from "@/pages/inventory_staff/InventoryStaffDashboardPage"
import { EndUsersDashboardPage } from "@/pages/end_users/EndUsersDashboardPage"
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage"
import { AuthLoadingScreen } from "@/components/common/AuthLoadingScreen"

/**
 * Public route wrapper that redirects authenticated users to their dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <AuthLoadingScreen
        message="Loading ITAMS Portal..."
        submessage="Connecting to secure database..."
      />
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRoutes() {
  const location = useLocation()

  return (
    <div className="w-full min-h-screen">
      <Routes location={location}>
          {/* Primary Authentication Route: /signin */}
          <Route
            path="/signin"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          {/* Aliases redirecting to /signin */}
          <Route path="/login" element={<Navigate to="/signin" replace />} />
          <Route path="/signup" element={<Navigate to="/signin" replace />} />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes using standard react-router-dom ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            {/* Automatic role-dispatching dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Direct role-specific dashboard routes with RBAC protection */}
            <Route
              path="/dashboard/itsd"
              element={
                <ProtectedRoute allowedRoles={["itsd"]}>
                  <ITSDDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inventory"
              element={
                <ProtectedRoute allowedRoles={["inventory_staff"]}>
                  <InventoryStaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/user"
              element={
                <ProtectedRoute allowedRoles={["end_user"]}>
                  <EndUsersDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* User Profile, Credentials & Settings Page */}
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </div>
  )
}

export default AppRoutes
