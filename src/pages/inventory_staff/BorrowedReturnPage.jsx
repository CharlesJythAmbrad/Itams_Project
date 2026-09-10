import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { AssignmentDetailsDialog } from "@/components/inventory/AssignmentDetailsDialog"
import { DataTablePagination } from "@/components/common/DataTablePagination"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building,
  Package,
  Calendar,
  Mail,
  Search,
  Filter,
  Eye,
  RotateCcw,
  FileText,
  MapPin,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BorrowedReturnPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

  useEffect(() => {
    const q = searchParams.get("search")
    if (q !== null) {
      setSearchTerm(q)
    }
  }, [searchParams])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus, selectedType])

  // Fetch assignments and borrowing records from both tables
  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log("Fetching assignments and borrowing records...")
      
      // Fetch assignments from asset_assignments table
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("asset_assignments")
        .select(`
          id,
          asset_id,
          assignee_name,
          assignee_email,
          assignee_department,
          assignee_employee_id,
          assignee_phone,
          assignment_location,
          purpose,
          assigned_date,
          expected_end_date,
          status,
          special_instructions,
          supervisor_name,
          supervisor_email,
          assets (
            asset_tag,
            name,
            category,
            brand,
            model
          )
        `)
        .eq("status", "active")
        .order("assigned_date", { ascending: false })

      // Fetch borrowing from asset_borrowing table  
      const { data: borrowingData, error: borrowingError } = await supabase
        .from("asset_borrowing")
        .select(`
          id,
          asset_id,
          borrower_name,
          borrower_email,
          borrower_department,
          borrower_employee_id,
          borrower_phone,
          borrow_location,
          purpose,
          borrowed_date,
          expected_return_date,
          status,
          special_instructions,
          supervisor_name,
          supervisor_email,
          project_name,
          assets (
            asset_tag,
            name,
            category,
            brand,
            model
          )
        `)
        .eq("status", "active")
        .order("borrowed_date", { ascending: false })

      // Handle errors more gracefully
      if (assignmentsError && borrowingError) {
        console.error("Assignments Error:", assignmentsError)
        console.error("Borrowing Error:", borrowingError)
        setError(`Failed to fetch records: ${assignmentsError?.message || borrowingError?.message}`)
        setAssignments([])
        return
      }

      // Format and normalize the results
      const formattedAssignments = (assignmentsData || []).map(item => ({
        ...item,
        borrower_name: item.assignee_name,
        borrower_email: item.assignee_email,
        borrower_department: item.assignee_department,
        borrower_employee_id: item.assignee_employee_id,
        borrower_phone: item.assignee_phone,
        expected_return_date: item.expected_end_date,
        assignment_type: 'assign'
      }))

      const formattedBorrowing = (borrowingData || []).map(item => ({
        ...item,
        assignment_location: item.borrow_location,
        assigned_date: item.borrowed_date,
        assignment_type: 'borrow'
      }))

      const combinedData = [...formattedAssignments, ...formattedBorrowing]

      // Sort by assigned_date (most recent first)
      combinedData.sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))

      console.log("Combined assignments and borrowing fetched:", combinedData)
      setAssignments(combinedData)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setError(`Failed to load assignments: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load assignments on component mount and set up auto-refresh
  useEffect(() => {
    fetchAssignments()
    
    // Set up auto-refresh every 30 seconds to catch new assignments
    const interval = setInterval(fetchAssignments, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate if assignment is overdue
  const isOverdue = (assignment) => {
    if (!assignment.expected_return_date || assignment.status !== 'active') return false
    return new Date(assignment.expected_return_date) < new Date()
  }

  // Get status color
  const getStatusColor = (assignment) => {
    if (assignment.status === 'returned') {
      return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
    } else if (isOverdue(assignment)) {
      return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
    }
  }

  // Get status label
  const getStatusLabel = (assignment) => {
    if (assignment.status === 'returned') return 'Returned'
    if (isOverdue(assignment)) return 'Overdue'
    return 'Active'
  }

  // Get type icon
  const getTypeIcon = (type) => {
    if (type === "borrow") return ArrowDownLeft
    if (type === "assign") return ArrowUpRight
    return ArrowUpRight
  }

  // Get status icon
  const getStatusIcon = (assignment) => {
    if (isOverdue(assignment)) return AlertTriangle
    if (assignment.status === "returned") return CheckCircle
    return Clock
  }

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.borrower_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.borrower_department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.assets?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.assets?.asset_tag || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && assignment.status === "active" && !isOverdue(assignment)) ||
      (selectedStatus === "overdue" && isOverdue(assignment)) ||
      (selectedStatus === "returned" && assignment.status === "returned")
    
    const matchesType = selectedType === "all" || assignment.assignment_type === selectedType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const typeOptions = [
    { value: "all", label: "All Transactions" },
    { value: "assign", label: "Assigned Items" },
    { value: "borrow", label: "Borrowed Items" }
  ]

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "overdue", label: "Overdue" },
    { value: "returned", label: "Returned" }
  ]

  const activeBorrows = filteredAssignments.filter(a => a.assignment_type === "borrow" && a.status === "active" && !isOverdue(a)).length
  const overdueBorrows = filteredAssignments.filter(a => isOverdue(a)).length
  const returnsThisMonth = filteredAssignments.filter(a => a.status === "returned").length

  return (
    <InventoryStaffLayout activeTab="borrowed-return">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Borrowed and Assigned Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track asset assignments and borrowing processes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchAssignments}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2">
              <FileText className="size-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Borrowed</p>
                  <p className="text-xl font-bold text-blue-600">{activeBorrows}</p>
                </div>
                <ArrowDownLeft className="size-7 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Assigned</p>
                  <p className="text-xl font-bold text-purple-600">
                    {filteredAssignments.filter(a => a.assignment_type === "assign" && a.status === "active" && !isOverdue(a)).length}
                  </p>
                </div>
                <ArrowUpRight className="size-7 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overdue Items</p>
                  <p className="text-xl font-bold text-red-600">{overdueBorrows}</p>
                </div>
                <AlertTriangle className="size-7 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-[5px]">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by borrower, asset, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[5px]"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px] rounded-[5px]">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              <Button variant="outline" size="icon" className="rounded-[5px]">
                <Filter className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card className="rounded-[5px]">
          {isLoading ? (
            <CardContent className="p-8 text-center">
              <Loader2 className="size-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading assignments...</p>
            </CardContent>
          ) : error ? (
            <CardContent className="p-8 text-center">
              <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Assignments</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchAssignments} className="bg-red-700 hover:bg-red-800">
                <RefreshCw className="size-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-3.5 py-2.5">Asset & Borrower</th>
                    <th className="px-3.5 py-2.5">Assignment Details</th>
                    <th className="px-3.5 py-2.5">Dates & Status</th>
                    <th className="px-3.5 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {paginatedAssignments.map((assignment) => {
                    const TypeIcon = getTypeIcon(assignment.assignment_type)
                    const StatusIcon = getStatusIcon(assignment)
                    const overdue = isOverdue(assignment)
                    
                    return (
                      <tr key={assignment.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Asset & Borrower */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[5px]">
                              <TypeIcon className="size-4 text-red-700 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{assignment.assets?.name || 'Unknown Asset'}</p>
                              <p className="text-xs font-mono text-red-700">{assignment.assets?.asset_tag}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">To:</span>
                                <span className="text-xs font-medium text-foreground">{assignment.borrower_name}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assignment Details */}
                        <td className="px-3.5 py-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building className="size-3" />
                              <span>{assignment.borrower_department}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              <span>{assignment.borrower_email}</span>
                            </div>
                            {assignment.assignment_location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" />
                                <span>{assignment.assignment_location}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Dates & Status */}
                        <td className="px-3.5 py-2.5">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-muted-foreground">Assigned: </span>
                              <span className="font-medium">{formatDate(assignment.assigned_date)}</span>
                            </div>
                            {assignment.expected_return_date && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Expected Return: </span>
                                <span className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                                  {formatDate(assignment.expected_return_date)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`size-3 ${getStatusColor(assignment)}`} />
                              <span className={`text-xs font-medium ${getStatusColor(assignment)}`}>
                                {getStatusLabel(assignment)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              title="View Details"
                              onClick={() => {
                                setSelectedRecordForDetails(assignment)
                                setIsDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {assignment.status === 'active' && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700" title="Process Return">
                                <RotateCcw className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <DataTablePagination
              currentPage={currentPage}
              totalItems={filteredAssignments.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
        </Card>

        {filteredAssignments.length === 0 && !isLoading && !error && (
          <Card className="rounded-[5px]">
            <CardContent className="p-8 text-center">
              <Package className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No assignments found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or create new assignments from the Assets page.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assignment / Borrowing Details Modal */}
        <AssignmentDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          record={selectedRecordForDetails}
        />
      </div>
    </InventoryStaffLayout>
  )
}

export default BorrowedReturnPage