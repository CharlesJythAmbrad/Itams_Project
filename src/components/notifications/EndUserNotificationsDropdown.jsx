import React, { useState, useEffect, useRef } from "react"
import {
  Bell,
  Package,
  Wrench,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Settings,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"

export function EndUserNotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef(null)
  const { user, profile } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Generate sample notifications for end users
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      generateEndUserNotifications()
    }
  }, [isOpen, notifications.length])

  const generateEndUserNotifications = async () => {
    setIsLoading(true)
    
    try {
      // Get user's assigned assets
      const { data: assignedAssets } = await supabase
        .from("asset_assignments")
        .select(`
          *,
          asset:assets(name, asset_tag, category)
        `)
        .eq("assignee_id", user?.id)
        .eq("status", "active")
        .limit(5)

      // Get user's repair requests
      const { data: repairRequests } = await supabase
        .from("asset_repairs")
        .select(`
          *,
          asset:assets(name, asset_tag)
        `)
        .eq("requested_by", user?.id)
        .order("created_at", { ascending: false })
        .limit(3)

      const mockNotifications = [
        // Asset assignment notifications
        ...(assignedAssets || []).map(assignment => ({
          id: `assignment-${assignment.id}`,
          title: "Asset Assignment Confirmed",
          message: `${assignment.asset?.name} (${assignment.asset?.asset_tag}) has been assigned to you`,
          timestamp: assignment.assigned_date,
          type: "assignment",
          icon: Package,
          color: "blue",
          isRead: Math.random() > 0.3,
          link: "/dashboard#equipment",
        })),

        // Repair status notifications
        ...(repairRequests || []).map(repair => ({
          id: `repair-${repair.id}`,
          title: repair.status === "completed" ? "Repair Completed" : "Repair Update",
          message: `${repair.asset?.name} repair status: ${repair.status.replace('_', ' ')}`,
          timestamp: repair.updated_at,
          type: "repair",
          icon: Wrench,
          color: repair.status === "completed" ? "green" : "amber",
          isRead: Math.random() > 0.4,
          link: "/dashboard#equipment",
        })),

        // System notifications
        {
          id: "system-update-1",
          title: "Asset Return Reminder",
          message: "Your borrowed tablet is due for return in 3 days",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: "reminder",
          icon: RotateCcw,
          color: "amber",
          isRead: false,
          link: "/dashboard#equipment",
        },
        {
          id: "system-update-2",
          title: "Inventory Audit Scheduled",
          message: "Physical verification of your assigned assets scheduled for next week",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          type: "audit",
          icon: CheckCircle2,
          color: "blue",
          isRead: true,
          link: "/dashboard#equipment",
        },
        {
          id: "maintenance-3",
          title: "Maintenance Window",
          message: "Scheduled system maintenance on Saturday 2-4 AM. Limited access expected.",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: "maintenance",
          icon: Settings,
          color: "purple",
          isRead: false,
          link: "/dashboard",
        },
        {
          id: "welcome-4",
          title: "Welcome to ITAMS",
          message: "Your asset custody portal is ready. Explore your dashboard to view assigned equipment.",
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: "welcome",
          icon: User,
          color: "green",
          isRead: true,
          link: "/dashboard",
        },
      ]

      // Sort by timestamp (newest first) and limit
      const sortedNotifications = mockNotifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)

      setNotifications(sortedNotifications)
      setUnreadCount(sortedNotifications.filter(n => !n.isRead).length)
    } catch (error) {
      console.error("Error generating notifications:", error)
      
      // Fallback notifications if database queries fail
      const fallbackNotifications = [
        {
          id: "welcome-fallback",
          title: "Welcome to ITAMS Portal",
          message: "Your personal asset custody dashboard is ready for use.",
          timestamp: new Date().toISOString(),
          type: "welcome",
          icon: User,
          color: "green",
          isRead: false,
          link: "/dashboard",
        }
      ]
      
      setNotifications(fallbackNotifications)
      setUnreadCount(1)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-zinc-900 animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 rounded-[5px] shadow-xl shadow-black/10 dark:shadow-black/50 border border-zinc-200/90 dark:border-zinc-800 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-950/60 text-red-600 rounded">
                  <Bell className="size-4" />
                </div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                </p>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Mark all read
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
                <p className="text-xs text-muted-foreground">
                  You'll receive updates about your assets and requests here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {notifications.map((item, index) => {
                  const Icon = item.icon
                  const isRead = item.isRead

                  const iconBgColor =
                    item.color === "green"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : item.color === "blue"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                      : item.color === "amber"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      : item.color === "purple"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                        !isRead ? "bg-red-50/30 dark:bg-red-950/10" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-full shrink-0 ${iconBgColor}`}>
                          <Icon className="size-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium leading-tight ${
                              !isRead ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {item.title}
                            </h4>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        </div>

                        {/* Unread Indicator Dot */}
                        {!isRead && (
                          <span className="size-2 rounded-full bg-red-600 shrink-0 mt-2 self-start" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 text-center">
            <button className="text-xs text-red-600 hover:text-red-700 font-medium">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EndUserNotificationsDropdown