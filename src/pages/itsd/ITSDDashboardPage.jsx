import React, { useState, useEffect } from "react"
import { ITSDLayout } from "@/layouts/itsd/ITSDLayout"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import {
  Laptop,
  Server,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Plus,
  Database,
  Users,
  Package,
  Wrench,
  Calendar,
  TrendingUp,
  HardDrive,
  Wifi,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Monitor,
  Smartphone,
  Printer,
  Network,
  Camera
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ITSDDashboardPage() {
  const { profile } = useAuth()
  const { navigate } = useRouter()
  const location = useLocation()
  
  // Get tab from URL hash or default to overview
  const getTabFromUrl = () => {
    const hash = location.hash.replace('#', '')
    return hash || 'overview'
  }
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl())
  const roleDetails = profile?.roleDetails

  // Sync tab state with URL hash
  useEffect(() => {
    const tabFromUrl = getTabFromUrl()
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [location.hash])

  // Handle tab change and update URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    // Update URL hash to maintain tab state
    const newUrl = `${location.pathname}#${newTab}`
    navigate(newUrl, { replace: true })
  }

  // System metrics state
  const [systemMetrics, setSystemMetrics] = useState({
    totalAssets: 0,
    activeAssets: 0,
    inMaintenance: 0,
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0,
    totalRepairs: 0,
    openRepairs: 0,
    completedRepairs: 0,
    overdueReturns: 0,
    assignedAssets: 0,
    borrowedAssets: 0
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [systemHealth, setSystemHealth] = useState([])
  const [assetsByCategory, setAssetsByCategory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch comprehensive system data
  const fetchSystemData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch assets data
      const { data: assets } = await supabase.from("assets").select("id, status, category, created_at, updated_at, name, asset_tag")
      
      // Fetch users data using admin function (bypasses RLS)
      let users = null
      try {
        // Use the admin function that can see all users
        const { data: uData, error: uErr } = await supabase.rpc('admin_get_all_users')
        if (uErr) {
          console.error('Error fetching users via admin function:', uErr)
          // Fallback to direct query (will only show current user due to RLS)
          const { data: fallbackU } = await supabase.from("users").select("id, created_at, full_name, email, role, is_deactivated")
          users = fallbackU
        } else {
          users = uData
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
        users = []
      }

      // Fetch repairs from asset_repairs
      const { data: repairs } = await supabase.from("asset_repairs").select("id, status, created_at, repair_ticket")
      const { data: assignments } = await supabase.from("asset_assignments").select("id, status, created_at, assigned_date, assignee_name")
      const { data: borrowing } = await supabase.from("asset_borrowing").select("id, status, created_at, borrowed_date, expected_return_date, borrower_name")

      // Calculate metrics
      const totalAssets = assets?.length || 0
      const activeAssets = assets?.filter(a => ['in_stock', 'deployed', 'allocated'].includes(a.status)).length || 0
      const inMaintenance = assets?.filter(a => a.status === 'maintenance').length || 0
      
      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.is_deactivated !== true).length || 0
      const deactivatedUsers = users?.filter(u => u.is_deactivated === true).length || 0
      
      // Debug logging for user counts
      console.log('Admin Dashboard - User Metrics:', {
        totalUsers,
        activeUsers,
        deactivatedUsers,
        usersData: users
      })
      
      const totalRepairs = repairs?.length || 0
      const openRepairs = repairs?.filter(r => ['pending', 'in_progress', 'quote_pending'].includes(r.status)).length || 0
      const completedRepairs = repairs?.filter(r => r.status === 'completed').length || 0
      
      const assignedAssets = assignments?.filter(a => a.status === 'active').length || 0
      const borrowedAssets = borrowing?.filter(b => b.status === 'active').length || 0
      
      // Check for overdue returns
      const now = new Date()
      const overdueReturns = borrowing?.filter(b => 
        b.status === 'active' && new Date(b.expected_return_date) < now
      ).length || 0

      setSystemMetrics({
        totalAssets,
        activeAssets, 
        inMaintenance,
        totalUsers,
        activeUsers,
        deactivatedUsers,
        totalRepairs,
        openRepairs,
        completedRepairs,
        overdueReturns,
        assignedAssets,
        borrowedAssets
      })

      // Calculate assets by category
      const categoryStats = {}
      assets?.forEach(asset => {
        categoryStats[asset.category] = (categoryStats[asset.category] || 0) + 1
      })
      
      setAssetsByCategory(Object.entries(categoryStats).map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalAssets) * 100)
      })).sort((a, b) => b.count - a.count))

      // Generate recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const recentActivities = [
        ...(assets?.filter(a => new Date(a.created_at) > sevenDaysAgo).map(a => ({
          id: a.id,
          type: 'asset_created',
          description: `New asset "${a.name}" (${a.asset_tag}) added to inventory`,
          timestamp: a.created_at,
          icon: Package,
          color: 'text-red-600'
        })) || []),
        ...(repairs?.filter(r => new Date(r.created_at) > sevenDaysAgo).map(r => ({
          id: r.id,
          type: 'repair_created',
          description: `Repair ticket ${r.repair_ticket} opened`,
          timestamp: r.created_at,
          icon: Wrench,
          color: 'text-orange-600'
        })) || []),
        ...(assignments?.filter(a => new Date(a.created_at) > sevenDaysAgo).map(a => ({
          id: a.id,
          type: 'asset_assigned',
          description: `Asset assigned to ${a.assignee_name}`,
          timestamp: a.created_at,
          icon: Users,
          color: 'text-purple-600'
        })) || []),
        ...(users?.filter(u => new Date(u.created_at) > sevenDaysAgo).map(u => ({
          id: u.id,
          type: 'user_created',
          description: `New user "${u.full_name}" registered`,
          timestamp: u.created_at,
          icon: Users,
          color: 'text-blue-600'
        })) || [])
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)

      setRecentActivity(recentActivities)

      // System health indicators
      const totalSystemItems = totalAssets + totalUsers + totalRepairs
      const healthyItems = activeAssets + activeUsers + completedRepairs
      const systemHealthPercentage = totalSystemItems > 0 ? Math.round((healthyItems / totalSystemItems) * 100) : 100

      setSystemHealth([
        { component: "Asset Fleet", status: inMaintenance > totalAssets * 0.1 ? "warning" : "healthy", value: `${activeAssets}/${totalAssets} Active` },
        { component: "User Accounts", status: deactivatedUsers > totalUsers * 0.2 ? "warning" : "healthy", value: `${activeUsers}/${totalUsers} Active` },
        { component: "Repair Queue", status: openRepairs > 10 ? "critical" : openRepairs > 5 ? "warning" : "healthy", value: `${openRepairs} Open` },
        { component: "Return Compliance", status: overdueReturns > 5 ? "critical" : overdueReturns > 0 ? "warning" : "healthy", value: overdueReturns > 0 ? `${overdueReturns} Overdue` : "All Current" }
      ])

    } catch (error) {
      console.error("Error fetching system data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSystemData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getCategoryIcon = (category) => {
    const iconMap = {
      computer: Monitor,
      laptop: Laptop,
      server: Server,
      monitor: Monitor,
      printer: Printer,
      scanner: Printer,
      networking: Network,
      cctv: Camera,
      phone: Smartphone,
      tablet: Smartphone,
      projector: Monitor,
      ups: HardDrive,
      storage: HardDrive,
      accessory: Package,
      software: Package,
      other: Package
    }
    return iconMap[category] || Package
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return CheckCircle2
      case 'warning': return AlertCircle  
      case 'critical': return XCircle
      default: return AlertCircle
    }
  }

  const fleetMetrics = [
    { label: "Total Assets", value: systemMetrics.totalAssets.toLocaleString(), change: `${systemMetrics.activeAssets} operational`, icon: Package, color: "blue" },
    { label: "System Users", value: systemMetrics.totalUsers.toLocaleString(), change: `${systemMetrics.activeUsers} active accounts`, icon: Users, color: "red" },
    { label: "Active Repairs", value: systemMetrics.openRepairs.toLocaleString(), change: `${systemMetrics.completedRepairs} completed`, icon: Wrench, color: "orange" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "system-monitor":
        return (
          <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="size-5 text-red-600" />
                <h2 className="text-lg font-bold text-foreground">System Monitor</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Database Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <span className="text-sm">Query Response Time</span>
                      <span className="text-sm font-mono text-red-600">~45ms</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <span className="text-sm">Active Connections</span>
                      <span className="text-sm font-mono text-blue-600">12/100</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Application Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <span className="text-sm">API Status</span>
                      <span className="text-sm font-mono text-red-600">✓ Online</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="text-sm font-mono text-red-600">94.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )

      case "asset-oversight":
        return (
          <div className="space-y-4">
            <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="size-5 text-red-600" />
                  <h2 className="text-lg font-bold text-foreground">Asset Oversight</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <Package className="size-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{systemMetrics.totalAssets}</div>
                    <div className="text-sm text-muted-foreground">Total Assets</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <CheckCircle2 className="size-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{systemMetrics.activeAssets}</div>
                    <div className="text-sm text-muted-foreground">Operational</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <Wrench className="size-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{systemMetrics.inMaintenance}</div>
                    <div className="text-sm text-muted-foreground">In Maintenance</div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Asset Category Breakdown */}
            <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
              <div className="p-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Asset Category Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assetsByCategory.slice(0, 8).map((item, i) => {
                    const Icon = getCategoryIcon(item.category)
                    return (
                      <div key={i} className="flex flex-col items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <Icon className="size-6 text-red-600 mb-2" />
                        <div className="text-lg font-bold text-foreground">{item.count}</div>
                        <div className="text-xs text-muted-foreground capitalize text-center">
                          {item.category.replace('_', ' ')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>
        )

      case "security-audit":
        return (
          <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="size-5 text-red-600" />
                <h2 className="text-lg font-bold text-foreground">Security & Audit</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">User Account Security</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Active Accounts</span>
                      <span className="text-sm font-mono text-red-600">{systemMetrics.activeUsers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Deactivated Accounts</span>
                      <span className="text-sm font-mono text-red-600">{systemMetrics.deactivatedUsers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Admin Accounts</span>
                      <span className="text-sm font-mono text-amber-600">3</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Asset Security</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Overdue Returns</span>
                      <span className="text-sm font-mono text-red-600">{systemMetrics.overdueReturns}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Unassigned Assets</span>
                      <span className="text-sm font-mono text-blue-600">
                        {systemMetrics.totalAssets - systemMetrics.assignedAssets - systemMetrics.borrowedAssets}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Missing QR Codes</span>
                      <span className="text-sm font-mono text-amber-600">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )

      case "system-reports":
        return (
          <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="size-5 text-red-600" />
                <h2 className="text-lg font-bold text-foreground">System Reports</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="p-4 h-auto flex-col gap-2">
                    <TrendingUp className="size-5 text-blue-600" />
                    <span className="font-medium">Asset Utilization Report</span>
                    <span className="text-xs text-muted-foreground">Generate detailed usage analytics</span>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto flex-col gap-2">
                    <Users className="size-5 text-red-600" />
                    <span className="font-medium">User Activity Report</span>
                    <span className="text-xs text-muted-foreground">Track user system interactions</span>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto flex-col gap-2">
                    <Wrench className="size-5 text-orange-600" />
                    <span className="font-medium">Maintenance Report</span>
                    <span className="text-xs text-muted-foreground">Review repair and maintenance data</span>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto flex-col gap-2">
                    <ShieldCheck className="size-5 text-red-600" />
                    <span className="font-medium">Security Audit Log</span>
                    <span className="text-xs text-muted-foreground">System security events and changes</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )

      default: // overview
        return (
          <>
            {/* System Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fleetMetrics.map((metric, i) => {
                const Icon = metric.icon
                return (
                  <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                        <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{metric.change}</p>
                      </div>
                      <div className="size-9 rounded-[5px] bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center">
                        <Icon className="size-4.5" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* System Health & Asset Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* System Health Status */}
              <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Activity className="size-4 text-red-600" />
                      System Health Monitor
                    </h3>
                    <p className="text-xs text-muted-foreground">Real-time infrastructure status</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchSystemData} className="text-xs">
                    <Clock className="size-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {systemHealth.map((item, i) => {
                    const StatusIcon = getStatusIcon(item.status)
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`size-4 ${getStatusColor(item.status).split(' ')[0]}`} />
                          <span className="text-sm font-medium text-foreground">{item.component}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Asset Distribution */}
              <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <HardDrive className="size-4 text-red-600" />
                    Asset Distribution
                  </h3>
                  <p className="text-xs text-muted-foreground">Inventory breakdown by category</p>
                </div>
                <div className="p-4">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {assetsByCategory.slice(0, 8).map((item, i) => {
                      const Icon = getCategoryIcon(item.category)
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="size-4 text-red-600" />
                            <span className="text-sm font-medium text-foreground capitalize">
                              {item.category.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{item.count}</span>
                            <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent System Activity */}
            <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
              <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-red-600" />
                    Recent System Activity
                  </h3>
                  <p className="text-xs text-muted-foreground">Latest changes across all system components (last 7 days)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-[5px] text-xs gap-1.5">
                    <TrendingUp className="size-3.5" />
                    View Analytics
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => {
                      const Icon = activity.icon
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors">
                          <Icon className={`size-4 ${activity.color} mt-0.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="size-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity in the last 7 days</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )
    }
  }

  return (
    <ITSDLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="space-y-4">
        {/* Top ITSD Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
              <Activity className="size-3.5" />
              Tier: {roleDetails?.admin_level || "Lead ITSD Administrator"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              IT Systems Desk & Infrastructure Console
            </h2>
            <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
              Specialization: <span className="font-semibold text-white">{roleDetails?.specialization || "Enterprise Infrastructure"}</span> • Shift: <span className="font-semibold text-white">{roleDetails?.shift || "Day Shift"}</span>. Full administrative custody over server nodes and workstation fleets.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Database className="size-72" />
          </div>
        </div>

        {/* Dynamic Tab Content */}
        {renderTabContent()}
      </div>
    </ITSDLayout>
  )
}

export default ITSDDashboardPage
