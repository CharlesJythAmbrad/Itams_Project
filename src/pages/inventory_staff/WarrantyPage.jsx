import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { DataTablePagination } from "@/components/common/DataTablePagination"
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Package,
  Search,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WarrantyPage() {
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
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Fetch assets from Supabase
  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log("Fetching assets for warranty page...")
      
      const { data, error } = await supabase
        .from("assets")
        .select(`
          id,
          name,
          purchase_date,
          warranty_end_date,
          brand,
          asset_tag,
          category
        `)
        .order("name", { ascending: true })

      if (error) throw error

      console.log("Assets fetched successfully:", data?.length || 0, "assets")
      setAssets(data || [])
    } catch (error) {
      console.error("Error fetching assets:", error)
      setError(`Failed to load assets: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [])

  // Calculate warranty status based on warranty_end_date
  const getWarrantyStatus = (warrantyEndDate) => {
    if (!warrantyEndDate) return "no_warranty"
    
    const today = new Date()
    const endDate = new Date(warrantyEndDate)
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return "expired"
    if (diffDays <= 30) return "expiring_soon"
    return "active"
  }

  // Add warranty status to assets
  const assetsWithWarrantyStatus = assets.map(asset => ({
    ...asset,
    warranty_status: getWarrantyStatus(asset.warranty_end_date)
  }))

  const statusOptions = [
    { value: "all", label: "All Assets" },
    { value: "active", label: "Active Warranty" },
    { value: "expiring_soon", label: "Expiring Soon (30 days)" },
    { value: "expired", label: "Expired Warranty" },
    { value: "no_warranty", label: "No Warranty" }
  ]

  const filteredAssets = assetsWithWarrantyStatus.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === "all" || asset.warranty_status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      case "expiring_soon":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      case "no_warranty":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return CheckCircle
      case "expiring_soon":
        return Clock
      case "expired":
        return AlertTriangle
      case "no_warranty":
        return Package
      default:
        return Package
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "active": return "Active Warranty"
      case "expiring_soon": return "Expiring Soon"
      case "expired": return "Warranty Expired"
      case "no_warranty": return "No Warranty"
      default: return status
    }
  }

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate statistics
  const activeWarranties = assetsWithWarrantyStatus.filter(a => a.warranty_status === "active").length
  const expiringSoon = assetsWithWarrantyStatus.filter(a => a.warranty_status === "expiring_soon").length
  const expiredWarranties = assetsWithWarrantyStatus.filter(a => a.warranty_status === "expired").length
  const noWarranty = assetsWithWarrantyStatus.filter(a => a.warranty_status === "no_warranty").length

  return (
    <InventoryStaffLayout activeTab="warranty">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Warranty Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track warranties, service contracts, and support coverage for all assets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchAssets}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Warranties</p>
                  <p className="text-xl font-bold text-emerald-600">{activeWarranties}</p>
                </div>
                <CheckCircle className="size-7 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Expiring Soon</p>
                  <p className="text-xl font-bold text-amber-600">{expiringSoon}</p>
                </div>
                <Clock className="size-7 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Expired</p>
                  <p className="text-xl font-bold text-red-600">{expiredWarranties}</p>
                </div>
                <AlertTriangle className="size-7 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">No Warranty</p>
                  <p className="text-xl font-bold text-gray-600">{noWarranty}</p>
                </div>
                <Package className="size-7 text-gray-600" />
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
                  placeholder="Search by asset name, tag, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[5px]"
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[200px] rounded-[5px]">
                  <SelectValue placeholder="Warranty Status" />
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

        {/* Assets Warranty Table */}
        <Card className="rounded-[5px]">
          {isLoading ? (
            <CardContent className="p-8 text-center">
              <Loader2 className="size-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            </CardContent>
          ) : error ? (
            <CardContent className="p-8 text-center">
              <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Assets</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchAssets} className="bg-red-700 hover:bg-red-800">
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
                      <th className="px-3.5 py-2.5">Asset Name</th>
                      <th className="px-3.5 py-2.5">Purchase Date</th>
                      <th className="px-3.5 py-2.5">Warranty Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                    {paginatedAssets.map((asset) => {
                      const StatusIcon = getStatusIcon(asset.warranty_status)
                      const daysUntilExpiry = getDaysUntilExpiry(asset.warranty_end_date)
                      
                      return (
                        <tr key={asset.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                          {/* Asset Name */}
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[5px]">
                                <Package className="size-4 text-red-700 dark:text-red-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{asset.name}</p>
                                <p className="text-xs font-mono text-muted-foreground">{asset.asset_tag}</p>
                                {asset.brand && (
                                 <p className="text-xs text-muted-foreground">{asset.brand}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Purchase Date */}
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(asset.purchase_date)}
                              </span>
                            </div>
                          </td>

                          {/* Warranty Coverage */}
                          <td className="px-3.5 py-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="size-4" />
                                <span className={`px-2 py-1 rounded-[5px] text-xs font-medium ${getStatusColor(asset.warranty_status)}`}>
                                  {getStatusLabel(asset.warranty_status)}
                                </span>
                              </div>
                              
                              {asset.warranty_end_date ? (
                                <div className="text-xs text-muted-foreground">
                                  <div>Expires: {formatDate(asset.warranty_end_date)}</div>
                                  {asset.warranty_status === "active" && daysUntilExpiry > 0 && (
                                    <div className="text-emerald-600">
                                      {daysUntilExpiry} days remaining
                                    </div>
                                  )}
                                  {asset.warranty_status === "expiring_soon" && daysUntilExpiry > 0 && (
                                    <div className="text-amber-600 font-medium">
                                      Expires in {daysUntilExpiry} days!
                                    </div>
                                  )}
                                  {asset.warranty_status === "expired" && daysUntilExpiry < 0 && (
                                    <div className="text-red-600 font-medium">
                                      Expired {Math.abs(daysUntilExpiry)} days ago
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  No warranty information
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalItems={filteredAssets.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>

        {filteredAssets.length === 0 && !isLoading && !error && (
          <Card className="rounded-[5px]">
            <CardContent className="p-8 text-center">
              <Package className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No assets found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or check if assets have been added to the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </InventoryStaffLayout>
  )
}

export default WarrantyPage