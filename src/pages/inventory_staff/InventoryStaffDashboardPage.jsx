import React, { useState, useEffect } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  Package,
  QrCode,
  HardDrive,
  UserCheck,
  Plus,
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShieldCheck,
  Wrench,
  Calendar,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InventoryStaffDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
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

      // Get all assets for statistics
      const { data: allAssets, error: allAssetsError } = await supabase
        .from("assets")
        .select("status, warranty_end_date")

      if (allAssetsError) throw allAssetsError

      // Get all assignments and borrowing for statistics
      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from("asset_assignments")
        .select("status")
        .eq("status", "active")

      const { data: allBorrowing, error: allBorrowingError } = await supabase
        .from("asset_borrowing")
        .select("status")
        .eq("status", "active")

      // Don't throw error if tables don't exist
      if (allAssignmentsError) {
        console.warn("All assignments query error:", allAssignmentsError)
      }

      if (allBorrowingError) {
        console.warn("All borrowing query error:", allBorrowingError)
      }

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

      // Calculate statistics
      const statistics = {
        totalAssets: allAssets.length,
        inStock: allAssets.filter(a => a.status === "in_stock").length,
        assigned: (allAssignments || []).length,
        borrowed: (allBorrowing || []).length,
        maintenance: allAssets.filter(a => a.status === "maintenance").length,
        activeWarranties: warrantyStats.active,
        expiringSoon: warrantyStats.expiringSoon,
        expired: warrantyStats.expired,
        pendingRepairs: (allRepairs || []).filter(r => r.status === "pending").length,
        inProgressRepairs: (allRepairs || []).filter(r => r.status === "in_progress").length,
        completedRepairs: (allRepairs || []).filter(r => r.status === "completed").length
      }

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
  }, [])

  const { statistics } = dashboardData

  // Dashboard metrics based on real data
  const dashboardMetrics = [
    { 
      label: "Total Assets", 
      value: statistics.totalAssets.toString(), 
      change: `${statistics.inStock} available`, 
      icon: Package,
      color: "red"
    },
    { 
      label: "Active Assignments", 
      value: (statistics.assigned + statistics.borrowed).toString(), 
      change: `${statistics.assigned} assigned, ${statistics.borrowed} borrowed`, 
      icon: UserCheck,
      color: "purple"
    },
    { 
      label: "Warranty Status", 
      value: statistics.activeWarranties.toString(), 
      change: `${statistics.expiringSoon} expiring soon`, 
      icon: ShieldCheck,
      color: "emerald"
    },
    { 
      label: "Active Repairs", 
      value: (statistics.pendingRepairs + statistics.inProgressRepairs).toString(), 
      change: `${statistics.completedRepairs} completed`, 
      icon: Wrench,
      color: "amber"
    },
  ]

  // Recent activity items
  const getRecentActivity = () => {
    const activities = []
    
    // Add recent assignments
    dashboardData.assignments.forEach(assignment => {
      activities.push({
        id: assignment.id,
        type: 'assignment',
        title: `${assignment.assignment_type === 'assign' ? 'Assigned' : 'Borrowed'}: ${assignment.assets?.name || 'Unknown Asset'}`,
        subtitle: `To ${assignment.borrower_name} • ${assignment.borrower_department}`,
        time: new Date(assignment.assigned_date).toLocaleDateString(),
        icon: UserCheck,
        color: 'red'
      })
    })
    
    // Add recent repairs
    dashboardData.repairs.forEach(repair => {
      activities.push({
        id: repair.id,
        type: 'repair',
        title: `Repair: ${repair.assets?.name || 'Unknown Asset'}`,
        subtitle: `${repair.issue_description} • ${repair.status}`,
        time: new Date(repair.created_at).toLocaleDateString(),
        icon: Wrench,
        color: 'orange'
      })
    })
    
    // Sort by date and return first 8
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
  }

  return (
    <InventoryStaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Top Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
              <Activity className="size-3.5" />
              Dashboard Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardMetrics.map((metric, i) => {
                const Icon = metric.icon
                const colorClasses = {
                  red: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400",
                  purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400",
                  emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
                  amber: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                }
                return (
                  <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                    <CardContent className="p-5 flex items-center justify-between">
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

            {/* Status Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Status Breakdown */}
              <Card className="rounded-[5px]">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="size-4" />
                    Asset Status Overview
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Stock</span>
                    <span className="font-medium text-emerald-600">{statistics.inStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Assigned</span>
                    <span className="font-medium text-red-600">{statistics.assigned}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Borrowed</span>
                    <span className="font-medium text-purple-600">{statistics.borrowed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Under Maintenance</span>
                    <span className="font-medium text-amber-600">{statistics.maintenance}</span>
                  </div>
                </div>
              </Card>

              {/* Warranty Status */}
              <Card className="rounded-[5px]">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Warranty Status
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Warranties</span>
                    <span className="font-medium text-emerald-600">{statistics.activeWarranties}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expiring Soon (30 days)</span>
                    <span className="font-medium text-amber-600">{statistics.expiringSoon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expired</span>
                    <span className="font-medium text-red-600">{statistics.expired}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity & Repairs Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="rounded-[5px] lg:col-span-2">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="size-4" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {getRecentActivity().map((activity, i) => {
                      const Icon = activity.icon
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                          <div className={`p-1.5 rounded-full ${{
                            red: 'bg-red-100 dark:bg-red-950/50 text-red-600',
                            orange: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600'
                          }[activity.color]}`}>
                            <Icon className="size-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      )
                    })}
                    {getRecentActivity().length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-medium text-amber-600">{statistics.pendingRepairs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="font-medium text-red-600">{statistics.inProgressRepairs}</span>
                  </div>
                  <div className="flex justify-between items-center">
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
