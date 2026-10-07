import React, { useState, useEffect } from "react"
import { ITSDLayout } from "@/layouts/itsd/ITSDLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { DataTablePagination } from "@/components/common/DataTablePagination"
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserX,
  LogIn,
  LogOut,
  Shield,
  Package,
  Wrench,
  Monitor,
  Activity as ActivityIcon
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ActivityLogsPage() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState("all")
  const [selectedResourceType, setSelectedResourceType] = useState("all")
  const [selectedUser, setSelectedUser] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // all, today, week, month
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Fetch activity logs
  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      setError("")

      let query = supabase
        .from("activity_logs")
        .select(`
          id,
          user_name,
          user_role,
          action,
          resource_type,
          resource_id,
          resource_name,
          description,
          metadata,
          success,
          error_message,
          created_at
        `)
        .order("created_at", { ascending: false })

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date()
        let startDate
        
        switch (dateFilter) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = null
        }
        
        if (startDate) {
          query = query.gte("created_at", startDate.toISOString())
        }
      }

      const { data, error: fetchError } = await query.limit(1000) // Reasonable limit

      if (fetchError) throw fetchError

      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      setError(`Failed to load activity logs: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [dateFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedAction, selectedResourceType, selectedUser, dateFilter])

  // Get action icon
  const getActionIcon = (action, resourceType) => {
    switch (action) {
      case "create":
        return resourceType === "user" ? UserPlus : Plus
      case "update":
      case "edit":
        return Edit
      case "delete":
        return Trash2
      case "assign":
        return ArrowUpRight
      case "unassign":
        return ArrowDownLeft
      case "login":
        return LogIn
      case "logout":
        return LogOut
      case "activate":
        return CheckCircle2
      case "deactivate":
        return UserX
      default:
        return ActivityIcon
    }
  }

  // Get resource type icon
  const getResourceTypeIcon = (resourceType) => {
    switch (resourceType) {
      case "asset":
        return Package
      case "user":
        return User
      case "repair":
        return Wrench
      case "assignment":
        return Monitor
      case "system":
        return Shield
      default:
        return FileText
    }
  }

  // Get action color
  const getActionColor = (action, success) => {
    if (!success) {
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
    }

    switch (action) {
      case "create":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
      case "update":
      case "edit":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
      case "delete":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
      case "assign":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
      case "unassign":
        return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30"
      case "login":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
      case "logout":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30"
      default:
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
    }
  }

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case "itsd":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      case "inventory_staff":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "end_user":
        return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource_name && log.resource_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = selectedAction === "all" || log.action === selectedAction
    const matchesResourceType = selectedResourceType === "all" || log.resource_type === selectedResourceType
    const matchesUser = selectedUser === "all" || log.user_role === selectedUser

    return matchesSearch && matchesAction && matchesResourceType && matchesUser
  })

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Get unique values for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))].sort()
  const uniqueResourceTypes = [...new Set(logs.map(log => log.resource_type))].sort()
  const uniqueUserRoles = [...new Set(logs.map(log => log.user_role))].sort()

  return (
    <ITSDLayout activeTab="activity-logs">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="size-6" />
              Activity Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track all admin and staff activities across the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchLogs}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="size-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Filters */}
        <Card className="rounded-[5px]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Search */}
              <div className="xl:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-[5px]"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="rounded-[5px]">
                  <Calendar className="size-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Action Filter */}
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="rounded-[5px]">
                  <Settings className="size-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Resource Type Filter */}
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger className="rounded-[5px]">
                  <Filter className="size-4 mr-2" />
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResourceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* User Role Filter */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="rounded-[5px]">
                  <User className="size-4 mr-2" />
                  <SelectValue placeholder="User Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueUserRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role === 'itsd' ? 'ITSD Admin' : 
                       role === 'inventory_staff' ? 'Inventory Staff' : 
                       role === 'end_user' ? 'End User' : role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{filteredLogs.length}</p>
                </div>
                <ActivityIcon className="size-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredLogs.filter(log => log.success).length}
                  </p>
                </div>
                <CheckCircle2 className="size-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreforeground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredLogs.filter(log => !log.success).length}
                  </p>
                </div>
                <XCircle className="size-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {logs.filter(log => {
                      const today = new Date()
                      const logDate = new Date(log.created_at)
                      return logDate.toDateString() === today.toDateString()
                    }).length}
                  </p>
                </div>
                <Clock className="size-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs Table */}
        <Card className="rounded-[5px]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading activity logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No activity logs found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        User & Action
                      </th>
                      <th className="p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Description
                      </th>
                      <th className="p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {paginatedLogs.map((log) => {
                      const ActionIcon = getActionIcon(log.action, log.resource_type)
                      const ResourceIcon = getResourceTypeIcon(log.resource_type)
                      
                      return (
                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <td className="p-4">
                            <div className="flex items-center">
                              {log.success ? (
                                <CheckCircle2 className="size-4 text-green-500" />
                              ) : (
                                <XCircle className="size-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{log.user_name}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getRoleColor(log.user_role)}`}>
                                  {log.user_role === 'itsd' ? 'ADMIN' : 
                                   log.user_role === 'inventory_staff' ? 'STAFF' : 
                                   log.user_role === 'end_user' ? 'USER' : log.user_role.toUpperCase()}
                                </span>
                              </div>
                              <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action, log.success)}`}>
                                <ActionIcon className="size-3" />
                                {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <ResourceIcon className="size-4 text-muted-foreground" />
                              <div className="space-y-0.5">
                                <div className="text-xs font-medium">
                                  {log.resource_type.charAt(0).toUpperCase() + log.resource_type.slice(1)}
                                </div>
                                {log.resource_name && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.resource_name}>
                                    {log.resource_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="text-sm">
                              {log.description}
                              {!log.success && log.error_message && (
                                <div className="text-xs text-red-600 mt-1">
                                  Error: {log.error_message}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-4">
                            <div className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredLogs.length > 0 && !isLoading && (
              <DataTablePagination
                currentPage={currentPage}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ITSDLayout>
  )
}

export default ActivityLogsPage