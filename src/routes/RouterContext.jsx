import React from "react"
import { useNavigate, useLocation } from "react-router-dom"

/**
 * Standard react-router-dom wrapper hook for backward compatibility and convenience.
 */
export function useRouter() {
  const navigate = useNavigate()
  const location = useLocation()

  return {
    navigate: (to, options) => navigate(to, options),
    replace: (to, options) => navigate(to, { replace: true, ...options }),
    currentPath: location.pathname.toLowerCase(),
    pathname: location.pathname,
    location,
  }
}

/**
 * Pass-through wrapper since BrowserRouter from react-router-dom provides routing context.
 */
export function RouterProvider({ children }) {
  return <>{children}</>
}

export default useRouter
