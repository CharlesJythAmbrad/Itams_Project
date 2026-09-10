import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "@/hooks/useSidebar"
import { ITSDHeader } from "./ITSDHeader"
import { ITSDSidebar } from "./ITSDSidebar"

export function ITSDLayout({ children, activeTab = "overview", onTabChange }) {
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

      {/* ITSD Dedicated Sidebar */}
      <ITSDSidebar
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
        <ITSDHeader
          onToggleMobile={openMobile}
          activeTitle={activeTab === "overview" ? "Dashboard" : activeTab}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-5 max-w-7xl w-full mx-auto space-y-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default ITSDLayout
