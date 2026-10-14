import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  Package,
  HardDrive,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Activity,
  Loader2,
  CheckCircle2,
  X,
  Laptop,
  Monitor,
  Printer,
  Network,
  Camera,
  Smartphone,
  Server,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InventoryStaffDashboardPage({ successMessage, showSuccess }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showSuccessMessage, setShowSuccessMessage] = useState(showSuccess || false)
  const roleDetails = profile?.roleDetails
  const [dashboardData, setDashboardData] = useState({
    assets: [],
    assignments: [],
    repairs: [],
    statistics: {
      totalAssets: 0,
      inStock: 0,
      assigned: 0,
      borrowed: 0,
      maintenance: 0,
      activeWarranties: 0,
      expiringSoon: 0,
      expired: 0,
      pendingRepairs: 0,
      inProgressRepairs: 0,
      completedRepairs: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [assetsByCategory, setAssetsByCategory] = useState([])

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError("")

      console.log("Fetching dashboard data...")

      // Fetch assets with warranty status calculation
      const { data: assets, error: assetsError } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (assetsError) throw assetsError

      // Fetch assignments from both tables
      const { data: assignments, error: assignmentsError } = await supabase
        .from("asset_assignments")
        .select(`
          id,
          asset_id,
          assignee_name,
          assignee_department,
          assigned_date,
          status,
          assets (
            name,
            asset_tag,
            category
          )
        `)
        .eq("status", "active")
        .order("assigned_date", { ascending: false })
        .limit(3)

      // Fetch borrowing records
      const { data: borrowingRecords, error: borrowingError } = await supabase
        .from("asset_borrowing")
        .select(`
          id,
          asset_id,
          borrower_name,
          borrower_department,
          borrowed_date,
          status,
          assets (
            name,
            asset_tag,
            category
          )
        `)
        .eq("status", "active")
        .order("borrowed_date", { ascending: false })
        .limit(3)

      // Don't throw error if tables don't exist or have issues
      if (assignmentsError) {
        console.warn("Assignments table error (table may not exist yet):", assignmentsError)
      }

      if (borrowingError) {
        console.warn("Borrowing table error (table may not exist yet):", borrowingError)
      }

      // Combine assignments and borrowing for display
      const formattedAssignments = (assignments || []).map(item => ({
        ...item,
        borrower_name: item.assignee_name,
        borrower_department: item.assignee_department,
        assignment_type: 'assign'
      }))

      const formattedBorrowing = (borrowingRecords || []).map(item => ({
        ...item,
        assigned_date: item.borrowed_date,
        assignment_type: 'borrow'
      }))

      const combinedAssignments = [
        ...formattedAssignments,
        ...formattedBorrowing
      ].sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date)).slice(0, 5)

      // Fetch repairs
      const { data: repairs, error: repairsError } = await supabase
        .from("asset_repairs")
        .select(`
          *,
          assets (
            name,
            asset_tag,
            category
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (repairsError) throw repairsError

      // Get all assets for statistics with their current status
      const { data: allAssets, error: allAssetsError } = await supabase
        .from("assets")
        .select("id, status, warranty_end_date, category")

      if (allAssetsError) throw allAssetsError

      // Build category breakdown
      const categoryMap = {}
      allAssets.forEach(a => {
        const cat = a.category || "other"
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      })
      const total = allAssets.length || 1
      setAssetsByCategory(
        Object.entries(categoryMap)
          .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 100) }))
          .sort((a, b) => b.count - a.count)
      )

      // Get all repairs for statistics
      const { data: allRepairs, error: allRepairsError } = await supabase
        .from("asset_repairs")
        .select("status")

      if (allRepairsError) throw allRepairsError

      // Calculate warranty statistics
      const today = new Date()
      const warrantyStats = allAssets.reduce((acc, asset) => {
        if (asset.warranty_end_date) {
          const endDate = new Date(asset.warranty_end_date)
          const diffTime = endDate - today
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 30) acc.active++
          else if (diffDays > 0 && diffDays <= 30) acc.expiringSoon++
          else if (diffDays < 0) acc.expired++
        }
        return acc
      }, { active: 0, expiringSoon: 0, expired: 0 })

      // Calculate statistics - Count assets by their status field (source of truth)
      const statistics = {
        totalAssets: allAssets.length,
        inStock: allAssets.filter(a => a.status === "in_stock").length,
        assigned: allAssets.filter(a => a.status === "deployed").length, // Fixed: "assigned" -> "deployed"
        borrowed: allAssets.filter(a => a.status === "allocated").length, // Fixed: "borrowed" -> "allocated"
        maintenance: allAssets.filter(a => a.status === "maintenance" || a.status === "under_maintenance").length,
        activeWarranties: warrantyStats.active,
        expiringSoon: warrantyStats.expiringSoon,
        expired: warrantyStats.expired,
        pendingRepairs: (allRepairs || []).filter(r => r.status === "pending").length,
        inProgressRepairs: (allRepairs || []).filter(r => r.status === "in_progress").length,
        completedRepairs: (allRepairs || []).filter(r => r.status === "completed").length
      }

      // Validation: Ensure distribution adds up to total assets
      const distributionTotal = statistics.inStock + statistics.assigned + statistics.borrowed + statistics.maintenance
      console.log('Asset Distribution Validation:', {
        total: statistics.totalAssets,
        inStock: statistics.inStock,
        assigned: statistics.assigned, // (deployed status)
        borrowed: statistics.borrowed, // (allocated status)
        maintenance: statistics.maintenance,
        distributionTotal,
        isValid: distributionTotal === statistics.totalAssets,
        statusMapping: {
          'assigned count': 'deployed status',
          'borrowed count': 'allocated status'
        }
      })

      setDashboardData({
        assets: assets || [],
        assignments: combinedAssignments || [],
        repairs: repairs || [],
        statistics
      })

      console.log("Dashboard data loaded successfully:", statistics)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(`Failed to load dashboard data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData()
    
    // Auto-hide success message after 8 seconds
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  const { statistics } = dashboardData

  // Navigation handlers for clickable cards
  const handleCardClick = (cardType, filter) => {
    switch (cardType) {
      case 'borrowed-return':
        if (filter === 'active') {
          navigate('/dashboard/inventory/borrowed-return?status=active')
        } else if (filter === 'assigned') {
          navigate('/dashboard/inventory/borrowed-return?type=assign&status=active')
        } else if (filter === 'borrowed') {
          navigate('/dashboard/inventory/borrowed-return?type=borrow&status=active')
        } else {
          navigate('/dashboard/inventory/borrowed-return')
        }
        break
      case 'warranty':
        if (filter === 'active') {
          navigate('/dashboard/inventory/warranty?status=active')
        } else if (filter === 'expiring') {
          navigate('/dashboard/inventory/warranty?status=expiring_soon')
        } else if (filter === 'expired') {
          navigate('/dashboard/inventory/warranty?status=expired')
        } else {
          navigate('/dashboard/inventory/warranty')
        }
        break
      case 'repairs':
        if (filter === 'pending') {
          navigate('/dashboard/inventory/repairs?status=pending')
        } else if (filter === 'in_progress') {
          navigate('/dashboard/inventory/repairs?status=in_progress')
        } else if (filter === 'completed') {
          navigate('/dashboard/inventory/repairs?status=completed')
        } else {
          navigate('/dashboard/inventory/repairs')
        }
        break
      default:
        break
    }
  }

  // Dashboard metrics based on real data
  const dashboardMetrics = [
    { 
      label: "Total Assets", 
      value: statistics.totalAssets.toString(), 
      change: `${statistics.inStock} available`, 
      icon: Package,
      color: "red",
      onClick: () => navigate('/dashboard/inventory/assets')
    },
    { 
      label: "Active Assignments", 
      value: (statistics.assigned + statistics.borrowed).toString(), 
      change: `${statistics.assigned} assigned, ${statistics.borrowed} borrowed`, 
      icon: UserCheck,
      color: "purple",
      onClick: () => handleCardClick('borrowed-return', 'active')
    },
    { 
      label: "Warranty Status", 
      value: statistics.activeWarranties.toString(), 
      change: `${statistics.expiringSoon} expiring soon`, 
      icon: ShieldCheck,
      color: "emerald",
      onClick: () => handleCardClick('warranty', 'active')
    },
    { 
      label: "Active Repairs", 
      value: (statistics.pendingRepairs + statistics.inProgressRepairs).toString(), 
      change: `${statistics.completedRepairs} completed`, 
      icon: Wrench,
      color: "amber",
      onClick: () => handleCardClick('repairs', 'pending')
    },
  ]

  // Category icon map
  const getCategoryIcon = (category) => {
    const map = {
      computer: Monitor, laptop: Laptop, server: Server, monitor: Monitor,
      printer: Printer, scanner: Printer, networking: Network, cctv: Camera,
      phone: Smartphone, tablet: Smartphone, projector: Monitor,
      ups: HardDrive, storage: HardDrive, accessory: Package,
      software: Package, other: Package,
    }
    return map[category] || Package
  }

  return (
    <InventoryStaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-4">
        {/* Success Message Banner */}
        <AnimatePresence>
          {showSuccessMessage && successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[5px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3 shadow-sm">
                <CheckCircle2 className="size-5 shrink-0 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-green-800 dark:text-green-300">Request Submitted Successfully!</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{successMessage}</p>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="shrink-0 p-1 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-[3px] transition-colors"
                  aria-label="Dismiss success message"
                >
                  <X className="size-4 text-green-600 dark:text-green-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
              <Activity className="size-3.5" />
              Dashboard Overview
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              IT Asset Management Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
              Real-time overview of assets, assignments, warranties, and repairs across the IT infrastructure.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <TrendingUp className="size-72" />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="size-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-8 animate-spin text-red-600 mr-3" />
            <span className="text-sm text-muted-foreground">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* Main Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dashboardMetrics.map((metric, i) => {
                const Icon = metric.icon
                const colorClasses = {
                  red: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400",
                  purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400",
                  emerald: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400",
                  amber: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                }
                return (
                  <Card 
                    key={i} 
                    variant="elevated" 
                    className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800 cursor-pointer hover:shadow-md hover:border-red-300 transition-all duration-200"
                    onClick={metric.onClick}
                  >
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                        <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{metric.change}</p>
                      </div>
                      <div className={`size-11 rounded-[5px] flex items-center justify-center ${colorClasses[metric.color]}`}>
                        <Icon className="size-5.5" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Secondary Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Status Distribution */}
              <Card className="rounded-[5px]">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="size-4" />
                    Asset Distribution
                  </h3>
                </div>
                <div className="p-3 space-y-2.5">
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => navigate('/dashboard/inventory/assets?status=in_stock')}
                  >
                    <span className="text-muted-foreground">In Stock</span>
                    <span className="font-medium text-emerald-600">{statistics.inStock}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('borrowed-return', 'assigned')}
                  >
                    <span className="text-muted-foreground">Assigned</span>
                    <span className="font-medium text-red-600">{statistics.assigned}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('borrowed-return', 'borrowed')}
                  >
                    <span className="text-muted-foreground">Borrowed</span>
                    <span className="font-medium text-purple-600">{statistics.borrowed}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => navigate('/dashboard/inventory/assets?status=maintenance')}
                  >
                    <span className="text-muted-foreground">Under Maintenance</span>
                    <span className="font-medium text-amber-600">{statistics.maintenance}</span>
                  </div>
                </div>
              </Card>

              {/* Warranty Status */}
              <Card className="rounded-[5px]">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Warranty Status
                  </h3>
                </div>
                <div className="p-3 space-y-2.5">
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('warranty', 'active')}
                  >
                    <span className="text-muted-foreground">Active Warranties</span>
                    <span className="font-medium text-emerald-600">{statistics.activeWarranties}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('warranty', 'expiring')}
                  >
                    <span className="text-muted-foreground">Expiring Soon (30 days)</span>
                    <span className="font-medium text-amber-600">{statistics.expiringSoon}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center text-xs sm:text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('warranty', 'expired')}
                  >
                    <span className="text-muted-foreground">Expired</span>
                    <span className="font-medium text-red-600">{statistics.expired}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Inventory Breakdown by Category & Repairs Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Inventory Breakdown by Category */}
              <Card className="rounded-[5px] lg:col-span-2">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <HardDrive className="size-4 text-red-600" />
                    Asset Distribution
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Inventory breakdown by category</p>
                </div>
                <div className="p-3">
                  {assetsByCategory.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="size-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No assets found</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {assetsByCategory.map((item, i) => {
                        const Icon = getCategoryIcon(item.category)
                        const isFirst = i === 0
                        const isLast = i === assetsByCategory.length - 1
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-2.5 rounded-[5px] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 text-red-600 shrink-0" />
                              <span className="text-sm font-medium text-foreground capitalize">
                                {item.category.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{item.count}</span>
                              <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                              {isFirst && <ChevronUp className="size-3.5 text-muted-foreground" />}
                              {isLast && <ChevronDown className="size-3.5 text-muted-foreground" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* Repairs Summary */}
              <Card className="rounded-[5px]">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Wrench className="size-4" />
                    Repairs Summary
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('repairs', 'pending')}
                  >
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-medium text-amber-600">{statistics.pendingRepairs}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('repairs', 'in_progress')}
                  >
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="font-medium text-red-600">{statistics.inProgressRepairs}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2 rounded transition-colors"
                    onClick={() => handleCardClick('repairs', 'completed')}
                  >
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-medium text-emerald-600">{statistics.completedRepairs}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Assets Table */}
            <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
              <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">Recent Assets</h3>
                  <p className="text-xs text-muted-foreground">Latest assets added to the system</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Asset Tag</th>
                      <th className="px-5 py-3">Asset Name</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Brand</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                    {dashboardData.assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-semibold text-foreground">{asset.asset_tag}</td>
                        <td className="px-5 py-3.5 font-medium text-foreground">{asset.name}</td>
                        <td className="px-5 py-3.5 text-muted-foreground capitalize">{asset.category?.replace('_', ' ')}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{asset.brand || 'N/A'}</td>
                        <td className="px-5 py-3.5 font-medium text-foreground">{asset.location}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                            asset.status === "in_stock"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : asset.status === "allocated" || asset.status === "deployed"
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {asset.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </InventoryStaffLayout>
  )
}

export default InventoryStaffDashboardPage
