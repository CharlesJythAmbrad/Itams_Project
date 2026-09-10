import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Package,
  Calendar,
  ExternalLink,
  Loader2,
  Trash2,
  Sparkles,
  ChevronRight,
  Filter
} from "lucide-react"

export function NotificationsDropdown() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all") // "all" | "unread" | "repairs" | "warranty" | "borrow"
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem("itams_read_notifications")
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
        localStorage.setItem("itams_read_notifications", JSON.stringify(updated))
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
      localStorage.setItem("itams_read_notifications", JSON.stringify(allIds))
    } catch (err) {
      console.error("Failed to save read notifications:", err)
    }
  }

  const clearAllRead = () => {
    setReadNotificationIds(prev => {
      const activeIds = rawNotifications.map(n => n.id)
      const unreadOnly = prev.filter(id => !activeIds.includes(id))
      try {
        localStorage.setItem("itams_read_notifications", JSON.stringify(unreadOnly))
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

  // Fetch real system events (repairs, status updates, warranties expiring, overdue borrowings)
  const fetchLiveEvents = async () => {
    try {
      setIsLoading(true)

      const items = []
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)

      // 1. Fetch recent Repairs and Status updates
      const { data: repairsData, error: repairsErr } = await supabase
        .from("asset_repairs")
        .select(`
          id,
          repair_ticket,
          status,
          priority,
          issue_description,
          created_at,
          updated_at,
          asset_id,
          assets (
            name,
            asset_tag
          )
        `)
        .order("updated_at", { ascending: false })
        .limit(25)

      if (!repairsErr && repairsData) {
        repairsData.forEach(repair => {
          const isUrgent = repair.priority === "urgent" || repair.priority === "high"
          const assetName = repair.assets?.name || "Asset"
          const assetTag = repair.assets?.asset_tag || "Unknown"

          items.push({
            id: `repair-${repair.id}-${repair.status}-${repair.updated_at || repair.created_at}`,
            type: "repairs",
            title: `Repair Request ${repair.repair_ticket}: ${repair.status.replace(/_/g, " ").toUpperCase()}`,
            message: `${assetName} (${assetTag}) - ${repair.issue_description}`,
            timestamp: repair.updated_at || repair.created_at,
            priority: repair.priority,
            link: `/dashboard/inventory/repairs?search=${encodeURIComponent(repair.repair_ticket)}`,
            icon: Wrench,
            color: repair.status === "completed" 
              ? "emerald" 
              : repair.status === "in_progress" 
              ? "blue" 
              : isUrgent 
              ? "red" 
              : "amber"
          })
        })
      }

      // 2. Fetch Assets with Warranty Expiring or Expired
      const { data: warrantyData, error: warrantyErr } = await supabase
        .from("assets")
        .select("id, name, asset_tag, warranty_end_date, status, updated_at")
        .not("warranty_end_date", "is", null)
        .order("warranty_end_date", { ascending: true })
        .limit(20)

      if (!warrantyErr && warrantyData) {
        warrantyData.forEach(asset => {
          const endDate = new Date(asset.warranty_end_date)
          const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
            items.push({
              id: `warranty-expired-${asset.id}`,
              type: "warranty",
              title: "Warranty Expired",
              message: `${asset.name} (${asset.asset_tag}) warranty expired on ${endDate.toLocaleDateString()}.`,
              timestamp: asset.warranty_end_date,
              priority: "high",
              link: `/dashboard/inventory/warranty?search=${encodeURIComponent(asset.asset_tag)}`,
              icon: ShieldAlert,
              color: "red"
            })
          } else if (diffDays <= 30) {
            items.push({
              id: `warranty-expiring-${asset.id}`,
              type: "warranty",
              title: `Warranty Expiring Soon (${diffDays}d left)`,
              message: `${asset.name} (${asset.asset_tag}) warranty will lapse on ${endDate.toLocaleDateString()}.`,
              timestamp: asset.warranty_end_date,
              priority: diffDays <= 7 ? "urgent" : "medium",
              link: `/dashboard/inventory/warranty?search=${encodeURIComponent(asset.asset_tag)}`,
              icon: AlertTriangle,
              color: "amber"
            })
          }
        })
      }

      // 3. Fetch Overdue / Active Borrowings
      const { data: borrowingData, error: borrowErr } = await supabase
        .from("asset_borrowing")
        .select(`
          id,
          borrower_name,
          expected_return_date,
          status,
          borrowed_date,
          assets (
            name,
            asset_tag
          )
        `)
        .eq("status", "active")
        .order("expected_return_date", { ascending: true })
        .limit(20)

      if (!borrowErr && borrowingData) {
        borrowingData.forEach(borrow => {
          const returnDate = new Date(borrow.expected_return_date)
          const isOverdue = returnDate < now
          const assetName = borrow.assets?.name || "Asset"
          const assetTag = borrow.assets?.asset_tag || ""

          if (isOverdue) {
            items.push({
              id: `borrow-overdue-${borrow.id}`,
              type: "borrow",
              title: "Overdue Borrowed Asset",
              message: `${assetName} (${assetTag}) borrowed by ${borrow.borrower_name} was due on ${returnDate.toLocaleDateString()}.`,
              timestamp: borrow.expected_return_date,
              priority: "urgent",
              link: `/dashboard/inventory/borrowed-return?search=${encodeURIComponent(assetTag)}`,
              icon: Clock,
              color: "red"
            })
          }
        })
      }

      // 4. Fetch Assets in Maintenance Status
      const { data: maintenanceAssets, error: maintErr } = await supabase
        .from("assets")
        .select("id, name, asset_tag, updated_at")
        .eq("status", "maintenance")
        .order("updated_at", { ascending: false })
        .limit(10)

      if (!maintErr && maintenanceAssets) {
        maintenanceAssets.forEach(asset => {
          items.push({
            id: `asset-maint-${asset.id}-${asset.updated_at}`,
            type: "repairs",
            title: "Asset in Maintenance",
            message: `${asset.name} (${asset.asset_tag}) status changed to Under Maintenance.`,
            timestamp: asset.updated_at || new Date().toISOString(),
            priority: "medium",
            link: `/dashboard/inventory/assets?search=${encodeURIComponent(asset.asset_tag)}`,
            icon: Package,
            color: "blue"
          })
        })
      }

      // Sort all items newest to oldest
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setRawNotifications(items)
      setHasMore(items.length > 10)
    } catch (err) {
      console.error("Error fetching live notification events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load once and poll periodically or on open
  useEffect(() => {
    fetchLiveEvents()
  }, [])

  // Filter items
  const filteredNotifications = useMemo(() => {
    return rawNotifications.filter(item => {
      const isRead = readNotificationIds.includes(item.id)
      if (activeFilter === "unread") return !isRead
      if (activeFilter === "repairs") return item.type === "repairs"
      if (activeFilter === "warranty") return item.type === "warranty"
      if (activeFilter === "borrow") return item.type === "borrow"
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
            fetchLiveEvents()
            setDisplayLimit(10)
          }
        }}
        className={`relative p-2 rounded-[5px] text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
          isOpen ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" : ""
        }`}
        aria-label="Notifications"
        title="Notifications & Updates"
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
                  <Bell className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Notifications</h3>
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
                onClick={() => setActiveFilter("repairs")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "repairs"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Repairs
              </button>
              <button
                onClick={() => setActiveFilter("warranty")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "warranty"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Warranties
              </button>
              <button
                onClick={() => setActiveFilter("borrow")}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors shrink-0 ${
                  activeFilter === "borrow"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          {/* Notifications List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Loader2 className="size-6 animate-spin mx-auto text-red-600" />
                <p>Loading notification updates...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Package className="size-8 mx-auto text-zinc-400" />
                <p className="font-semibold text-foreground">No notifications found</p>
                <p className="text-[11px]">You are completely caught up with updates.</p>
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
                            Open <ChevronRight className="size-3" />
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
            <span>Live inventory updates</span>
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

export default NotificationsDropdown
