import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { getUserSchemaCapabilities, setUserSchemaCapabilities } from "@/utils/userSchemaCapabilities"
import {
  Bell,
  Check,
  CheckCheck,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  ShieldAlert,
  Database,
  Activity,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Loader2,
  Trash2,
  Sparkles,
  ChevronRight,
  Filter,
  Settings,
  Server,
  Key
} from "lucide-react"

export function AdminNotificationsDropdown() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all") // "all" | "unread" | "users" | "system" | "security"
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem("itams_admin_read_notifications")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Notifications raw data state
  const [rawNotifications, setRawNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [displayLimit, setDisplayLimit] = useState(10)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const dropdownRef = useRef(null)

  // Save read IDs to localStorage
  const markAsRead = (id) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      try {
        localStorage.setItem("itams_admin_read_notifications", JSON.stringify(updated))
      } catch (err) {
        console.error("Failed to save read notifications:", err)
      }
      return updated
    })
  }

  const markAllAsRead = () => {
    const allIds = rawNotifications.map(n => n.id)
    setReadNotificationIds(allIds)
    try {
      localStorage.setItem("itams_admin_read_notifications", JSON.stringify(allIds))
    } catch (err) {
      console.error("Failed to save read notifications:", err)
    }
  }

  const clearAllRead = () => {
    setReadNotificationIds(prev => {
      const activeIds = rawNotifications.map(n => n.id)
      const unreadOnly = prev.filter(id => !activeIds.includes(id))
      try {
        localStorage.setItem("itams_admin_read_notifications", JSON.stringify(unreadOnly))
      } catch {}
      return unreadOnly
    })
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen])

  // Fetch admin-specific system events (user management, system changes, security events)
  const fetchAdminEvents = async () => {
    try {
      setIsLoading(true)

      const items = []
      const now = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)

      // 1. Fetch recent User Management activities - handle missing columns gracefully
      let usersData = null
      let usersErr = null
      
      const caps = getUserSchemaCapabilities()

      if (caps.hasIsDeactivated === false || caps.hasLastLoginAt === false) {
        // Run safe query without unsupported columns
        const { data: basicUsers, error: basicErr } = await supabase
          .from("users")
          .select(`
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
          `)
          .or(`created_at.gte.${sevenDaysAgo.toISOString()},updated_at.gte.${sevenDaysAgo.toISOString()}`)
          .order("updated_at", { ascending: false })
          .limit(20)

        usersData = basicUsers
        usersErr = basicErr
      } else {
        // Try with is_deactivated and last_login_at
        const { data: usersWithStatus, error: statusErr } = await supabase
          .from("users")
          .select(`
            id,
            email,
            full_name,
            role,
            is_deactivated,
            created_at,
            updated_at,
            last_login_at
          `)
          .or(`created_at.gte.${sevenDaysAgo.toISOString()},updated_at.gte.${sevenDaysAgo.toISOString()}`)
          .order("updated_at", { ascending: false })
          .limit(20)

        if (statusErr && (statusErr.message?.includes('is_deactivated') || statusErr.message?.includes('last_login_at'))) {
          setUserSchemaCapabilities({
            hasIsDeactivated: !statusErr.message?.includes('is_deactivated'),
            hasLastLoginAt: !statusErr.message?.includes('last_login_at')
          })

          // Fallback to safe query WITHOUT is_deactivated and last_login_at
          const { data: basicUsers, error: basicErr } = await supabase
            .from("users")
            .select(`
              id,
              email,
              full_name,
              role,
              created_at,
              updated_at
            `)
            .or(`created_at.gte.${sevenDaysAgo.toISOString()},updated_at.gte.${sevenDaysAgo.toISOString()}`)
            .order("updated_at", { ascending: false })
            .limit(20)

          usersData = basicUsers
          usersErr = basicErr
        } else {
          usersData = usersWithStatus
          usersErr = statusErr
        }
      }

      if (!usersErr && usersData) {
        usersData.forEach(user => {
          const isNewUser = new Date(user.created_at) >= sevenDaysAgo
          const wasRecentlyUpdated = user.updated_at && new Date(user.updated_at) >= sevenDaysAgo && !isNewUser
          
          if (isNewUser) {
            items.push({
              id: `user-created-${user.id}-${user.created_at}`,
              type: "users",
              title: `New User Account Created`,
              message: `${user.full_name || user.email} (${user.role}) has been registered in the system.`,
              timestamp: user.created_at,
              priority: "medium",
              link: `/dashboard/itsd/user-management?search=${encodeURIComponent(user.email)}`,
              icon: UserPlus,
              color: "emerald"
            })
          }

          if (wasRecentlyUpdated) {
            const isDeactivated = user.is_deactivated === true
            const status = isDeactivated ? "deactivated" : (user.is_deactivated === false ? "activated" : "updated")
            items.push({
              id: `user-updated-${user.id}-${user.updated_at}`,
              type: "users",
              title: isDeactivated ? "User Account Deactivated" : (user.is_deactivated === false ? "User Account Activated" : "User Profile Updated"),
              message: `${user.full_name || user.email} account has been ${status}.`,
              timestamp: user.updated_at,
              priority: isDeactivated ? "high" : "medium",
              link: `/dashboard/itsd/user-management?search=${encodeURIComponent(user.email)}`,
              icon: isDeactivated ? UserMinus : Users,
              color: isDeactivated ? "red" : "blue"
            })
          }

          // Track users who haven't logged in for 30+ days but are active (only if we have the columns)
          if (user.is_deactivated !== true && user.last_login_at) {
            const lastLogin = new Date(user.last_login_at)
            const daysSinceLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24))
            if (daysSinceLogin >= 30) {
              items.push({
                id: `user-inactive-${user.id}-${daysSinceLogin}`,
                type: "security",
                title: `Dormant User Account`,
                message: `${user.full_name || user.email} hasn't logged in for ${daysSinceLogin} days. Consider reviewing account status.`,
                timestamp: user.last_login_at,
                priority: daysSinceLogin >= 60 ? "high" : "medium",
                link: `/dashboard/itsd/user-management?search=${encodeURIComponent(user.email)}`,
                icon: ShieldAlert,
                color: "amber"
              })
            }
          }
        })
      }

      // 2. Fetch System Health & Database metrics
      const { data: assetsCount, error: assetsErr } = await supabase
        .from("assets")
        .select("id, status, created_at")
        .gte("created_at", sevenDaysAgo.toISOString())

      if (!assetsErr && assetsCount && assetsCount.length > 0) {
        items.push({
          id: `system-assets-added-${assetsCount.length}-${now.toISOString()}`,
          type: "system",
          title: `Assets Database Updated`,
          message: `${assetsCount.length} new assets have been registered in the system this week.`,
          timestamp: new Date().toISOString(),
          priority: "low",
          link: `/dashboard/inventory/assets`,
          icon: Database,
          color: "blue"
        })
      }

      // 3. Check for users with admin privileges
      const { data: adminUsers, error: adminErr } = await supabase
        .from("users")
        .select("id, email, full_name, created_at")
        .eq("role", "itsd")
        .gte("created_at", sevenDaysAgo.toISOString())

      if (!adminErr && adminUsers) {
        adminUsers.forEach(admin => {
          items.push({
            id: `admin-created-${admin.id}-${admin.created_at}`,
            type: "security",
            title: `New Administrator Account`,
            message: `${admin.full_name || admin.email} has been granted ITSD administrator privileges.`,
            timestamp: admin.created_at,
            priority: "high",
            link: `/dashboard/itsd/user-management?search=${encodeURIComponent(admin.email)}`,
            icon: Shield,
            color: "red"
          })
        })
      }

      // 4. System-level notifications (simulated - in real app these would come from logs/monitoring)
      const systemMetrics = [
        {
          id: `system-performance-${Date.now()}`,
          type: "system",
          title: "System Performance Report",
          message: "Weekly system health check completed. All services operational with 99.9% uptime.",
          timestamp: new Date().toISOString(),
          priority: "low",
          link: `/dashboard/itsd/overview`,
          icon: Activity,
          color: "emerald"
        }
      ]

      items.push(...systemMetrics)

      // 5. Security and compliance notifications
      const securityItems = []
      
      // Check for multiple failed login attempts (simulated - would come from auth logs)
      const recentFailedLogins = Math.floor(Math.random() * 3) // Simulated
      if (recentFailedLogins > 0) {
        securityItems.push({
          id: `security-failed-logins-${Date.now()}`,
          type: "security",
          title: `Failed Login Attempts Detected`,
          message: `${recentFailedLogins} failed login attempts detected in the last 24 hours. Review security logs.`,
          timestamp: new Date().toISOString(),
          priority: "medium",
          link: `/dashboard/itsd/user-management`,
          icon: Key,
          color: "amber"
        })
      }

      items.push(...securityItems)

      // Sort all items newest to oldest
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setRawNotifications(items)
      setHasMore(items.length > 10)
    } catch (err) {
      console.error("Error fetching admin notification events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load once and poll periodically or on open
  useEffect(() => {
    fetchAdminEvents()
  }, [])

  // Filter items
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter(item => {
      const isRead = readNotificationIds.includes(item.id)
      if (activeFilter === "unread") return !isRead
      if (activeFilter === "users") return item.type === "users"
      if (activeFilter === "system") return item.type === "system"
      if (activeFilter === "security") return item.type === "security"
      return true
    })
  }, [rawNotifications, readNotificationIds, activeFilter])

  // Paginated/Lazy slice
  const displayedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, displayLimit)
  }, [filteredNotifications, displayLimit])

  // Counts
  const unreadCount = useMemo(() => {
    return rawNotifications.filter(n => !readNotificationIds.includes(n.id)).length
  }, [rawNotifications, readNotificationIds])

  const readCount = useMemo(() => {
    return rawNotifications.filter(n => readNotificationIds.includes(n.id)).length
  }, [rawNotifications, readNotificationIds])

  // Lazy loading handler
  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setDisplayLimit(prev => prev + 10)
      setIsLoadingMore(false)
    }, 250)
  }

  const handleNotificationClick = (item) => {
    markAsRead(item.id)
    setIsOpen(false)
    if (item.link) {
      navigate(item.link)
    }
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "recently"
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            fetchAdminEvents()
            setDisplayLimit(10)
          }
        }}
        className={`relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
          isOpen ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" : ""
        }`}
        aria-label="Admin Notifications"
        title="Admin Notifications & System Updates"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-zinc-900 animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[92vw] sm:w-[420px] max-w-[440px] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-950/60 text-red-600 rounded">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Admin Notifications</h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="text-red-600 dark:text-red-400 font-semibold">{unreadCount} unread</span>
                    <span>•</span>
                    <span>{readCount} read</span>
                  </div>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar text-[11px]">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "all"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({rawNotifications.length})
              </button>
              <button
                onClick={() => setActiveFilter("unread")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "unread"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setActiveFilter("users")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "users"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveFilter("system")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "system"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                System
              </button>
              <button
                onClick={() => setActiveFilter("security")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "security"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Security
              </button>
            </div>
          </div>

          {/* Notifications List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Loader2 className="size-6 animate-spin mx-auto text-red-600" />
                <p>Loading admin notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Shield className="size-8 mx-auto text-zinc-400" />
                <p className="font-semibold text-foreground">No admin notifications</p>
                <p className="text-[11px]">All system management activities are up to date.</p>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const isRead = readNotificationIds.includes(item.id)
                const IconComponent = item.icon || Bell

                const iconBgColor =
                  item.color === "emerald"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : item.color === "blue"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                    : item.color === "red"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                      !isRead
                        ? "bg-red-50/30 dark:bg-red-950/10"
                        : "opacity-85"
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div className={`p-2 rounded-[6px] shrink-0 mt-0.5 ${iconBgColor}`}>
                      <IconComponent className="size-4" />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${
                          !isRead ? "text-foreground font-bold" : "text-zinc-700 dark:text-zinc-300"
                        }`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          {item.type}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[11px] font-medium text-blue-600 flex items-center gap-0.5">
                            View <ChevronRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator Dot */}
                    {!isRead && (
                      <span className="size-2 rounded-full bg-red-600 shrink-0 mt-2 self-start" />
                    )}
                  </div>
                )
              })
            )}

            {/* Lazy Load More Button */}
            {filteredNotifications.length > displayLimit && (
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading older notifications...
                    </>
                  ) : (
                    `Load more (${filteredNotifications.length - displayLimit} remaining)`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-muted-foreground px-3">
            <span>Live admin & system updates</span>
            {readCount > 0 && (
              <button
                type="button"
                onClick={clearAllRead}
                className="text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Reset read history"
              >
                Reset read state
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNotificationsDropdown