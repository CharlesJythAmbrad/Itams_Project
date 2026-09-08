import { useState, useEffect, useCallback } from "react"

/**
 * Custom hook to manage responsive sidebar states:
 * - Desktop collapsible rail
 * - Mobile & tablet slide-over drawer with auto-close on resize
 */
export function useSidebar(initialCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Auto-close mobile drawer on viewport expansion
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapse,
    isMobileOpen,
    openMobile,
    closeMobile,
  }
}

export default useSidebar
