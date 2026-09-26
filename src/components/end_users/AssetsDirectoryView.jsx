import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Search,
  Package,
  Monitor,
  Laptop,
  Server,
  Printer,
  Smartphone,
  Network,
  Camera,
  HardDrive,
  Filter,
  Eye,
  MapPin,
  Calendar,
  Tag,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export function AssetsDirectoryView() {
  const [assets, setAssets] = useState([])
  const [filteredAssets, setFilteredAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch all assets (read-only for end users)
  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      
      const { data: assetsData, error } = await supabase
        .from("assets")
        .select(`
          *,
          current_assignment:asset_assignments!inner(
            id,
            assignee_name,
            assigned_date,
            status
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching assets:", error)
        // Fallback to basic asset query if join fails
        const { data: basicAssets } = await supabase
          .from("assets")
          .select("*")
          .order("created_at", { ascending: false })
        
        setAssets(basicAssets || [])
      } else {
        setAssets(assetsData || [])
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error)
      setAssets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  // Filter assets based on search and filters
  useEffect(() => {
    let filtered = assets

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(term) ||
        asset.asset_tag.toLowerCase().includes(term) ||
        asset.brand.toLowerCase().includes(term) ||
        asset.model.toLowerCase().includes(term) ||
        asset.serial_number.toLowerCase().includes(term) ||
        asset.category.toLowerCase().includes(term)
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(asset => asset.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(asset => asset.status === selectedStatus)
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm, selectedCategory, selectedStatus])

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return Package
      case 'deployed': 
      case 'allocated': return CheckCircle2
      case 'maintenance': return Wrench
      case 'retired': return XCircle
      default: return AlertCircle
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800'
      case 'deployed': 
      case 'allocated': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800'
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800'
      case 'retired': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-800'
    }
  }

  const formatStatus = (status) => {
    const statusMap = {
      'in_stock': 'Available',
      'deployed': 'Assigned',
      'allocated': 'Borrowed',
      'maintenance': 'In Repair',
      'retired': 'Retired'
    }
    return statusMap[status] || status
  }

  const getUniqueCategories = () => {
    return [...new Set(assets.map(asset => asset.category))].sort()
  }

  const getUniqueStatuses = () => {
    return [...new Set(assets.map(asset => asset.status))].sort()
  }

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Search assets by name, tag, brand, model, serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-[5px]"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 rounded-[5px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    <span className="capitalize">{category.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 rounded-[5px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {getUniqueStatuses().map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Assets Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-foreground">{filteredAssets.length}</div>
            <div className="text-xs text-muted-foreground">Assets Found</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">
              {filteredAssets.filter(a => a.status === 'in_stock').length}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-blue-600">
              {filteredAssets.filter(a => ['deployed', 'allocated'].includes(a.status)).length}
            </div>
            <div className="text-xs text-muted-foreground">In Use</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-amber-600">
              {filteredAssets.filter(a => a.status === 'maintenance').length}
            </div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Package className="size-4 text-red-600" />
              Assets Directory
            </h3>
            <p className="text-xs text-muted-foreground">
              Browse and search all assets in the inventory
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                ? "No assets match your search criteria" 
                : "No assets found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand & Model</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Purchase Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {filteredAssets.map((asset) => {
                  const CategoryIcon = getCategoryIcon(asset.category)
                  const StatusIcon = getStatusIcon(asset.status)
                  
                  return (
                    <tr key={asset.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-red-50 dark:bg-red-950/20">
                            <CategoryIcon className="size-3 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground text-sm">{asset.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{asset.asset_tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-muted-foreground">
                          {asset.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-foreground">{asset.brand}</div>
                          <div className="text-muted-foreground text-xs">{asset.model}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] text-[10px] font-medium border ${getStatusColor(asset.status)}`}>
                          <StatusIcon className="size-3" />
                          {formatStatus(asset.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.location || "Not specified"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(asset)}
                          className="rounded-[5px] text-xs h-7 px-2"
                        >
                          <Eye className="size-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-red-600" />
              Asset Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Asset Name</label>
                  <p className="text-sm text-muted-foreground">{selectedAsset.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Asset Tag</label>
                  <p className="text-sm font-mono text-muted-foreground">{selectedAsset.asset_tag}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedAsset.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] text-xs font-medium border ${getStatusColor(selectedAsset.status)}`}>
                    {React.createElement(getStatusIcon(selectedAsset.status), { className: "size-3" })}
                    {formatStatus(selectedAsset.status)}
                  </div>
                </div>
              </div>

              {/* Technical Specs */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Technical Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Brand</label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.brand || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Model</label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.model || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Serial Number</label>
                    <p className="text-sm font-mono text-muted-foreground">{selectedAsset.serial_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Location</label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.location || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Purchase Date</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Purchase Cost</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.purchase_cost ? `₱${parseFloat(selectedAsset.purchase_cost).toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Supplier</label>
                    <p className="text-sm text-muted-foreground">{selectedAsset.supplier || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Warranty Until</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedAsset.description && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedAsset.description}</p>
                </div>
              )}

              {/* Assignment Info */}
              {selectedAsset.current_assignment && selectedAsset.current_assignment.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Current Assignment</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-[5px]">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="size-4 text-blue-600" />
                      <span className="text-sm font-medium text-foreground">
                        {selectedAsset.current_assignment[0].assignee_name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigned on: {new Date(selectedAsset.current_assignment[0].assigned_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AssetsDirectoryView