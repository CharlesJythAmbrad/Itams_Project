import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "@/hooks/useSidebar"
import { EndUsersHeader } from "./EndUsersHeader"
import { EndUsersSidebar } from "./EndUsersSidebar"

export function EndUsersLayout({ children, activeTab = "equipment", onTabChange }) {
  const { isCollapsed, toggleCollapse, isMobileOpen, openMobile, closeMobile } = useSidebar()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground flex flex-col lg:flex-row antialiased">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* End User Dedicated Sidebar */}
      <EndUsersSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobile}
        activeNav={activeTab}
        onSelectNav={onTabChange}
      />

      {/* Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <EndUsersHeader
          onToggleMobile={openMobile}
          activeTitle={activeTab === "equipment" ? "Dashboard" : activeTab}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-5 max-w-7xl w-full mx-auto space-y-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default EndUsersLayout
