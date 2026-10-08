import React, { useState, useEffect } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { DataTablePagination } from "@/components/common/DataTablePagination"
import {
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Tag,
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
  Package,
  Loader2,
  RefreshCw,
  FileText,
  User
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Category icons mapping
const categoryIcons = {
  laptop: Laptop,
  monitor: Monitor,
  printer: Printer,
  mouse: Mouse,
  networking: Network,
  camera: Camera,
  server: Server,
  smartphone: Smartphone,
  tablet: Tablet,
  projector: Projector,
  other: Package
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "laptop", label: "Laptops" },
  { value: "monitor", label: "Monitors" },
  { value: "printer", label: "Printers" },
  { value: "mouse", label: "Mouse & Keyboards" },
  { value: "networking", label: "Networking" },
  { value: "camera", label: "Cameras" },
  { value: "server", label: "Servers" },
  { value: "smartphone", label: "Smartphones" },
  { value: "tablet", label: "Tablets" },
  { value: "projector", label: "Projectors" },
  { value: "other", label: "Other" }
]

export function DisposeAssetsPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const fetchDisposedAssets = async () => {
    setLoading(true)
    setError("")

    try {
      const { data, error: fetchError, count } = await supabase
        .from("assets")
        .select("*", { count: "exact" })
        .eq("status", "disposed")
        .order("updated_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (fetchError) throw fetchError

      setAssets(data || [])
      setTotalPages(Math.ceil(count / itemsPerPage))
    } catch (error) {
      console.error("Error fetching disposed assets:", error)
      setError("Failed to load disposed assets. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisposedAssets()
  }, [currentPage])

  const getIconComponent = (category) => {
    return categoryIcons[category?.toLowerCase()] || Package
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || asset.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getConditionBadge = (condition) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "fair":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"
      case "poor":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
      case "damaged":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <InventoryStaffLayout activeTab="dispose">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </InventoryStaffLayout>
    )
  }

  return (
    <InventoryStaffLayout activeTab="dispose">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Disposed Assets
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete record of all disposed assets with disposal information
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchDisposedAssets}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}

        {/* Summary Card */}
        <Card className="rounded-[5px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-[5px]">
                <Trash2 className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                  {assets.length} Disposed Assets
                </h3>
                <p className="text-sm text-muted-foreground">
                  Assets that have been completely disposed and removed from active inventory
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="rounded-[5px]">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search disposed assets by name, tag, serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[5px] w-full"
                />
              </div>
              
              {/* Category Filter */}
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

              {/* Reset Button */}
              {(selectedCategory !== "all" || searchTerm) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-[5px] text-xs h-9 px-3 w-full sm:w-auto"
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchTerm("")
                  }}
                  title="Reset Filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card className="rounded-[5px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Asset</th>
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Category</th>
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Condition</th>
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Location</th>
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Disposal Date</th>
                    <th className="text-left p-4 font-medium text-sm text-zinc-700 dark:text-zinc-300">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted-foreground">
                        <Trash2 className="size-12 mx-auto mb-4 opacity-20" />
                        {searchTerm || selectedCategory !== "all" 
                          ? "No disposed assets match your search criteria."
                          : "No disposed assets found."}
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const IconComponent = getIconComponent(asset.category)
                      return (
                        <tr key={asset.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[5px]">
                                <IconComponent className="size-4 text-red-700 dark:text-red-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {asset.asset_tag} • {asset.brand} {asset.model}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm capitalize text-muted-foreground">
                              {asset.category?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            {asset.condition && (
                              <span className={`inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium ${getConditionBadge(asset.condition)}`}>
                                {asset.condition}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">{asset.location || 'Not specified'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="size-3.5 shrink-0" />
                              <span>{formatDate(asset.updated_at)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="max-w-xs">
                              {asset.notes ? (
                                <p className="text-sm text-muted-foreground truncate" title={asset.notes}>
                                  {asset.notes}
                                </p>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No notes</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={assets.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InventoryStaffLayout>
  )
}