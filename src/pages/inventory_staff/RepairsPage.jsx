import React, { useState, useEffect } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { AddRepairDialog } from "@/components/inventory/AddRepairDialog"
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Search,
  Filter,
  Eye,
  Plus,
  FileText,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Phone,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function RepairsPage() {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [repairs, setRepairs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Fetch repairs from database
  const fetchRepairs = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log("Fetching repairs from database...")
      
      const { data, error } = await supabase
        .from("asset_repairs")
        .select(`
          *,
          assets (
            name,
            asset_tag,
            category,
            brand,
            model
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("Repairs fetched successfully:", data)
      setRepairs(data || [])
    } catch (error) {
      console.error("Error fetching repairs:", error)
      setError(`Failed to load repairs: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load repairs on component mount
  useEffect(() => {
    fetchRepairs()
  }, [])

  const handleRepairAdded = (newRepair) => {
    setRepairs(prev => [newRepair, ...prev])
    setSuccessMessage(`Repair request ${newRepair.repair_ticket} created successfully!`)
    setTimeout(() => setSuccessMessage(""), 5000)
  }

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      (repair.assets?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repair.assets?.asset_tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.repair_ticket.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repair.reported_by_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === "all" || repair.status === selectedStatus
    const matchesPriority = selectedPriority === "all" || repair.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Calculate statistics
  const pendingRepairs = repairs.filter(r => r.status === "pending").length
  const inProgressRepairs = repairs.filter(r => r.status === "in_progress").length
  const completedRepairs = repairs.filter(r => r.status === "completed").length
  const totalCost = repairs
    .filter(r => r.actual_cost)
    .reduce((sum, r) => sum + parseFloat(r.actual_cost), 0)

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "quote_pending", label: "Quote Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ]

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
  ]

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "in_progress":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      case "quote_pending":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return Clock
      case "in_progress":
        return Wrench
      case "quote_pending":
        return DollarSign
      case "completed":
        return CheckCircle
      case "cancelled":
        return XCircle
      default:
        return Package
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Pending"
      case "in_progress": return "In Progress"
      case "quote_pending": return "Quote Pending"
      case "completed": return "Completed"
      case "cancelled": return "Cancelled"
      default: return status
    }
  }

  return (
    <InventoryStaffLayout activeTab="repairs">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Repairs & Maintenance</h1>
            <p className="text-sm text-muted-foreground">
              Track repair requests, maintenance schedules, and service provider activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchRepairs}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2">
              <FileText className="size-4" />
              Export Report
            </Button>
            <Button 
              className="rounded-[5px] gap-2 bg-red-700 hover:bg-red-800"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="size-4" />
              New Repair Request
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
            <div className="size-4 bg-emerald-600 rounded-full flex items-center justify-center">
              <svg className="size-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-emerald-600">{successMessage}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending Repairs</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingRepairs}</p>
                </div>
                <Clock className="size-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-red-600">{inProgressRepairs}</p>
                </div>
                <Wrench className="size-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600">{completedRepairs}</p>
                </div>
                <CheckCircle className="size-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Repair Cost</p>
                  <p className="text-2xl font-bold text-foreground">${totalCost.toLocaleString()}</p>
                </div>
                <DollarSign className="size-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-[5px]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by asset, repair ID, or issue description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[5px]"
                />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px] rounded-[5px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[130px] rounded-[5px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="rounded-[5px]">
                <Filter className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Repairs Table */}
        <Card className="rounded-[5px]">
          {isLoading ? (
            <CardContent className="p-8 text-center">
              <Loader2 className="size-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading repairs...</p>
            </CardContent>
          ) : error ? (
            <CardContent className="p-8 text-center">
              <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Repairs</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchRepairs} className="bg-blue-700 hover:bg-blue-800">
                <RefreshCw className="size-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Repair Request</th>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Issue & Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Timeline & Cost</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {filteredRepairs.map((repair) => {
                    const StatusIcon = getStatusIcon(repair.status)
                    
                    return (
                      <tr key={repair.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-[5px]">
                              <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{repair.repair_ticket}</p>
                              <p className="text-xs text-muted-foreground">WO: {repair.work_order_number || 'N/A'}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="size-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{repair.reported_by_name}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {repair.assets?.name || 'Unknown Asset'}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {repair.assets?.asset_tag || 'No Tag'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {repair.repair_location || 'Not specified'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <p className="text-sm text-foreground">{repair.issue_description}</p>
                            <span className={`px-2 py-1 rounded-[5px] text-xs font-medium uppercase ${getPriorityColor(repair.priority)}`}>
                              {repair.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="size-4" />
                            <span className={`px-2 py-1 rounded-[5px] text-xs font-medium ${getStatusColor(repair.status)}`}>
                              {getStatusLabel(repair.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {repair.assigned_technician || 'Not assigned'}
                            </p>
                            {repair.technician_contact && (
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="size-3 text-muted-foreground" />
                                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                                  {repair.technician_contact}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Reported:</span>
                              <span className="text-xs font-medium">{formatDate(repair.reported_date)}</span>
                            </div>
                            {repair.estimated_completion_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="size-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Est. Complete:</span>
                                <span className="text-xs font-medium">
                                  {formatDate(repair.estimated_completion_date)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <DollarSign className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Cost:</span>
                              <span className="text-xs font-medium text-green-600">
                                ${repair.actual_cost || repair.estimated_cost || 'TBD'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FileText className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ExternalLink className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {filteredRepairs.length === 0 && !isLoading && !error && (
          <Card className="rounded-[5px]">
            <CardContent className="p-8 text-center">
              <Wrench className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No repairs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or create a new repair request.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Repair Dialog */}
        <AddRepairDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onRepairAdded={handleRepairAdded}
        />
      </div>
    </InventoryStaffLayout>
  )
}

export default RepairsPage