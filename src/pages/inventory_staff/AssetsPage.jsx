import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { SimpleAddAssetDialog } from "@/components/inventory/SimpleAddAssetDialog"
import { AssetAssignmentDialog } from "@/components/inventory/AssetAssignmentDialog"
import { EditAssetDialog } from "@/components/inventory/EditAssetDialog"
import { DeleteAssetDialog } from "@/components/inventory/DeleteAssetDialog"
import { AssetDetailsDialog } from "@/components/inventory/AssetDetailsDialog"
import { DataTablePagination } from "@/components/common/DataTablePagination"
import {
  Package,
  QrCode,
  HardDrive,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Tag,
  Calendar,
  MapPin,
  Laptop,
  Monitor,
  Printer,
  Mouse,
  Network,
  Camera,
  Server,
  Smartphone,
  Tablet,
  Projector,
  Loader2,
  RefreshCw,
  User,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AssetsPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

  useEffect(() => {
    const q = searchParams.get("search")
    if (q !== null) {
      setSearchTerm(q)
    }
  }, [searchParams])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all") // "all", "in_stock", "deployed", "allocated"
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [selectedAssetForAssignment, setSelectedAssetForAssignment] = useState(null)
  const [assignmentType, setAssignmentType] = useState("assign")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssetForDelete, setSelectedAssetForDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedStatus, activeFilter])

  // Fetch assets from Supabase
  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log("Fetching assets from Supabase...")
      
      const { data, error } = await supabase
        .from("assets")
        .select(`
          id,
          asset_tag,
          name,
          description,
          category,
          brand,
          model,
          serial_number,
          purchase_date,
          purchase_cost,
          vendor,
          warranty_end_date,
          location,
          status,
          condition,
          computer_name,
          mac_address,
          ip_address,
          operating_system,
          processor,
          ram_gb,
          storage_gb,
          camera_resolution,
          camera_type,
          port_count,
          power_consumption_watts,
          dimensions,
          weight_kg,
          notes,
          created_at,
          updated_at,
          assigned_to
        `)
        .order("created_at", { ascending: false })

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

  const handleAssetAdded = async (newAsset) => {
    // Add the new asset to the beginning of the list
    setAssets(prev => [newAsset, ...prev])
    
    // Show success message
    setSuccessMessage(`Asset "${newAsset.name}" added successfully! Asset tag: ${newAsset.asset_tag}`)
    setTimeout(() => setSuccessMessage(""), 5000)
    
    // Also refresh the data to make sure we have the latest from database
    setTimeout(() => {
      fetchAssets()
    }, 500)
  }

  const handleAssignAsset = (asset, type) => {
    setSelectedAssetForAssignment(asset)
    setAssignmentType(type)
    setIsAssignmentDialogOpen(true)
  }

  const handleAssignmentComplete = (updatedAsset) => {
    // Update the asset in the list
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ))
    
    // Show success message
    const actionText = assignmentType === "assign" ? "assigned" : "borrowed"
    setSuccessMessage(`Asset "${updatedAsset.name}" ${actionText} successfully!`)
    setTimeout(() => setSuccessMessage(""), 5000)
    
    // Refresh data
    setTimeout(() => {
      fetchAssets()
    }, 500)
  }

  const handleEditAsset = (asset) => {
    setSelectedAssetForEdit(asset)
    setIsEditDialogOpen(true)
  }

  const handleAssetUpdated = (updatedAsset) => {
    // Update the asset in the list
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ))
    
    // Show success message
    setSuccessMessage(`Asset "${updatedAsset.name}" updated successfully!`)
    setTimeout(() => setSuccessMessage(""), 5000)
    
    // Refresh data
    setTimeout(() => {
      fetchAssets()
    }, 500)
  }

  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType)
    // Reset category filter when using status filters
    if (filterType !== "all") {
      setSelectedCategory("all")
    }
  }

  const handleDeleteAsset = async (assetId) => {
    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", assetId)

      if (error) throw error

      setAssets(prev => prev.filter(asset => asset.id !== assetId))
      setSuccessMessage("Asset deleted successfully!")
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (error) {
      console.error("Error deleting asset:", error)
      setError("Failed to delete asset. Please try again.")
      setTimeout(() => setError(""), 5000)
    }
  }

  const handleDeleteClick = (asset) => {
    setSelectedAssetForDelete(asset)
    setIsDeleteDialogOpen(true)
  }

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
      tablet: Tablet,
      projector: Projector,
      ups: HardDrive,
      storage: HardDrive,
      accessory: Mouse,
      software: Package,
      other: Package
    }
    return iconMap[category] || Package
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "computer", label: "Desktop Computers" },
    { value: "laptop", label: "Laptops" },
    { value: "server", label: "Servers" },
    { value: "monitor", label: "Monitors" },
    { value: "printer", label: "Printers" },
    { value: "scanner", label: "Scanners" },
    { value: "networking", label: "Network Equipment" },
    { value: "cctv", label: "CCTV Cameras" },
    { value: "phone", label: "Phones" },
    { value: "tablet", label: "Tablets" },
    { value: "projector", label: "Projectors" },
    { value: "ups", label: "UPS/Power" },
    { value: "storage", label: "Storage Devices" },
    { value: "accessory", label: "Accessories" },
    { value: "software", label: "Software" },
    { value: "other", label: "Other" }
  ]

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "in_stock", label: "In Stock" },
    { value: "allocated", label: "Allocated" },
    { value: "deployed", label: "Deployed" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
    { value: "disposed", label: "Disposed" },
    { value: "lost", label: "Lost" },
    { value: "stolen", label: "Stolen" }
  ]

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || asset.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus
    
    // Apply active filter from summary cards
    let matchesActiveFilter = true
    if (activeFilter === "in_stock") {
      matchesActiveFilter = asset.status === "in_stock"
    } else if (activeFilter === "deployed") {
      matchesActiveFilter = asset.status === "deployed"
    } else if (activeFilter === "allocated") {
      matchesActiveFilter = asset.status === "allocated"
    }
    // "all" shows everything (default)
    
    return matchesSearch && matchesCategory && matchesStatus && matchesActiveFilter
  })

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "in_stock":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      case "allocated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "deployed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      case "maintenance":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "retired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
      case "disposed":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      case "lost":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
      case "stolen":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "in_stock": return "In Stock"
      case "allocated": return "Allocated"
      case "deployed": return "Deployed"
      case "maintenance": return "Maintenance"
      case "retired": return "Retired"
      case "disposed": return "Disposed"
      case "lost": return "Lost"
      case "stolen": return "Stolen"
      default: return status
    }
  }

  return (
    <InventoryStaffLayout activeTab="assets">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assets Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track all inventory assets across warehouse locations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchAssets}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2">
              <QrCode className="size-4" />
              Scan Asset
            </Button>
            <Button 
              className="rounded-[5px] gap-2 bg-red-700 hover:bg-red-800"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="size-4" />
              Add Asset
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
          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20 ${
              activeFilter === "all" ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
            }`}
            onClick={() => handleFilterClick("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Assets {activeFilter === "all" ? '(All)' : ''}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{assets.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Click to show all</p>
                </div>
                <Package className="size-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20 ${
              activeFilter === "in_stock" ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : ''
            }`}
            onClick={() => handleFilterClick("in_stock")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    In Stock {activeFilter === "in_stock" ? '(Filtered)' : ''}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {assets.filter(a => a.status === "in_stock").length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Click to filter</p>
                </div>
                <Package className="size-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/20 ${
              activeFilter === "deployed" ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' : ''
            }`}
            onClick={() => handleFilterClick("deployed")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Deployed {activeFilter === "deployed" ? '(Filtered)' : ''}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {assets.filter(a => a.status === "deployed").length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Click to filter</p>
                </div>
                <Tag className="size-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20 ${
              activeFilter === "allocated" ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : ''
            }`}
            onClick={() => handleFilterClick("allocated")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Allocated/Borrowed {activeFilter === "allocated" ? '(Filtered)' : ''}
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {assets.filter(a => a.status === "allocated").length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Click to filter</p>
                </div>
                <HardDrive className="size-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-[5px]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets by name, ID, or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[5px] w-full"
                />
              </div>
              
              {/* Category Filter Dropdown */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[190px] rounded-[5px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter Dropdown */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[150px] rounded-[5px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter / Reset Icon Button */}
              {(selectedCategory !== "all" || selectedStatus !== "all" || searchTerm) ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-[5px] text-xs h-9 px-3 w-full sm:w-auto"
                  onClick={() => {
                    setSelectedCategory("all")
                    setSelectedStatus("all")
                    setSearchTerm("")
                    setActiveFilter("all")
                  }}
                  title="Reset Filters"
                >
                  Reset
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="rounded-[5px] h-9 w-9 shrink-0 hidden sm:flex">
                  <Filter className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card className="rounded-[5px]">
          {isLoading ? (
            <CardContent className="p-8 text-center">
              <Loader2 className="size-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            </CardContent>
          ) : error ? (
            <CardContent className="p-8 text-center">
              <Package className="size-12 text-red-500 mx-auto mb-4" />
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
                    <th className="px-4 py-3">Asset Info</th>
                    <th className="px-4 py-3">Brand & Status</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {paginatedAssets.map((asset) => {
                    const IconComponent = getCategoryIcon(asset.category)
                    
                    return (
                      <tr key={asset.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Asset Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[5px]">
                              <IconComponent className="size-4 text-red-700 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{asset.name}</p>
                              <p className="text-xs font-mono text-red-700">{asset.asset_tag}</p>
                              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium capitalize mt-1">
                                {asset.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Brand & Status */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {asset.brand && (
                              <p className="font-medium text-foreground">{asset.brand}</p>
                            )}
                            {asset.model && (
                              <p className="text-xs text-muted-foreground">{asset.model}</p>
                            )}
                            <span className={`px-2 py-1 rounded-[5px] text-xs font-medium ${getStatusColor(asset.status)}`}>
                              {getStatusLabel(asset.status)}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-1">
                            <MapPin className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="text-xs">
                              <div className="font-medium text-foreground">{asset.location}</div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-xs" 
                              onClick={() => {
                                setSelectedAssetForDetails(asset)
                                setIsDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="size-4 mr-1" />
                              Details
                            </Button>
                              
                            {/* Show Assign/Borrow buttons only for in_stock assets */}
                            {asset.status === 'in_stock' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700" 
                                  onClick={() => handleAssignAsset(asset, 'assign')}
                                  title="Assign Asset"
                                >
                                  <User className="size-4 mr-1" />
                                  Assign
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-xs text-purple-600 hover:text-purple-700" 
                                  onClick={() => handleAssignAsset(asset, 'borrow')}
                                  title="Borrow Asset"
                                >
                                  <Calendar className="size-4 mr-1" />
                                  Borrow
                                </Button>
                              </>
                            )}
                              
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700" 
                              title="Report Repair"
                              onClick={() => {/* TODO: Open repair dialog with this asset */}}
                            >
                              <Wrench className="size-4" />
                            </Button>
                              
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              title="Edit Asset"
                              onClick={() => handleEditAsset(asset)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(asset)}
                              title="Delete Asset"
                            >
                              <Trash2 className="size-4" />
                            </Button>
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
                Try adjusting your search criteria or add new assets to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Asset Dialog */}
        <SimpleAddAssetDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAssetAdded={handleAssetAdded}
        />

        {/* Asset Assignment Dialog */}
        <AssetAssignmentDialog
          isOpen={isAssignmentDialogOpen}
          onClose={() => setIsAssignmentDialogOpen(false)}
          asset={selectedAssetForAssignment}
          assignmentType={assignmentType}
          onAssignmentComplete={handleAssignmentComplete}
        />

        {/* Edit Asset Dialog */}
        <EditAssetDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          asset={selectedAssetForEdit}
          onAssetUpdated={handleAssetUpdated}
        />

        {/* Delete Asset Confirmation Dialog */}
        <DeleteAssetDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          asset={selectedAssetForDelete}
          onConfirmDelete={handleDeleteAsset}
        />

        {/* Asset Details Modal */}
        <AssetDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          asset={selectedAssetForDetails}
          onAssign={(asset) => handleAssignAsset(asset, 'assign')}
          onBorrow={(asset) => handleAssignAsset(asset, 'borrow')}
          onEdit={handleEditAsset}
        />
      </div>
    </InventoryStaffLayout>
  )
}

export default AssetsPage