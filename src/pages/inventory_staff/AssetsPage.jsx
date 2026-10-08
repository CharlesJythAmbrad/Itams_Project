import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { logAssetActivity } from "@/utils/activityLogger"
import { SimpleAddAssetDialog } from "@/components/inventory/SimpleAddAssetDialog"
import { BulkAddAssetDialog } from "@/components/inventory/BulkAddAssetDialog"
import { AssetAssignmentDialog } from "@/components/inventory/AssetAssignmentDialog"
import { EditAssetDialog } from "@/components/inventory/EditAssetDialog"
import { DeleteAssetDialog } from "@/components/inventory/DeleteAssetDialog"
import { AssetDetailsDialog } from "@/components/inventory/AssetDetailsDialog"
import { ScanAssetDialog } from "@/components/inventory/ScanAssetDialog"
import { AssetRepairTrackingDialog } from "@/components/inventory/AssetRepairTrackingDialog"
import { AddRepairDialog } from "@/components/inventory/AddRepairDialog"
import { MarkForDisposalDialog } from "@/components/inventory/MarkForDisposalDialog"
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
  Archive,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AssetsPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  
  // Initialize filters from URL params
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all")
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all")
  const fromBorrowRequest = searchParams.get("fromBorrowRequest") // Check if coming from borrow request
  const [borrowRequestData, setBorrowRequestData] = useState(null) // Store borrow request data
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [activeFilter, setActiveFilter] = useState("in_stock") // "all", "in_stock", "deployed", "allocated"
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [selectedAssetForAssignment, setSelectedAssetForAssignment] = useState(null)
  const [assignmentType, setAssignmentType] = useState("assign")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssetForDelete, setSelectedAssetForDelete] = useState(null)
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)
  const [isRepairTrackingOpen, setIsRepairTrackingOpen] = useState(false)
  const [selectedAssetForRepair, setSelectedAssetForRepair] = useState(null)
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false)
  const [isDisposalDialogOpen, setIsDisposalDialogOpen] = useState(false)
  const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Update filters when URL params change
  useEffect(() => {
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    
    if (search !== null) setSearchTerm(search)
    if (category !== null) setSelectedCategory(category)
    if (status !== null) setSelectedStatus(status)
  }, [searchParams])

  // Fetch borrow request data when coming from borrow request
  useEffect(() => {
    const fetchBorrowRequestData = async () => {
      if (fromBorrowRequest) {
        try {
          const { data, error } = await supabase
            .from("asset_requests")
            .select("*")
            .eq("id", fromBorrowRequest)
            .eq("request_type", "borrow_request")
            .single()
          
          if (!error && data) {
            setBorrowRequestData(data)
          }
        } catch (err) {
          console.error("Error fetching borrow request:", err)
        }
      } else {
        setBorrowRequestData(null)
      }
    }

    fetchBorrowRequestData()
  }, [fromBorrowRequest])

  // Handle scanned QR code result with comprehensive asset information
  const handleScanSuccess = async (scannedTag, rawValue) => {
    if (!scannedTag) return

    // Set search term so the table immediately filters to this asset
    setSearchTerm(scannedTag)

    try {
      // Fetch comprehensive asset information including assignments, borrowing, and repairs
      const { data: assetData, error: assetError } = await supabase
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
          processor,
          ram_gb,
          storage_gb,
          operating_system,
          computer_name,
          mac_address,
          ip_address,
          camera_resolution,
          camera_type,
          port_count,
          management_ip,
          firmware_version,
          power_consumption_watts,
          weight_kg,
          dimensions,
          notes,
          qr_code,
          created_at,
          updated_at,
          assigned_to
        `)
        .or(`asset_tag.eq.${scannedTag},id.eq.${scannedTag},serial_number.eq.${scannedTag}`)
        .maybeSingle()

      if (assetError) throw assetError

      if (assetData) {
        // Fetch additional context based on asset status
        let assignmentInfo = null
        let borrowingInfo = null
        let repairInfo = null

        // If asset is deployed, get assignment details
        if (assetData.status === 'deployed') {
          const { data: assignment } = await supabase
            .from("asset_assignments")
            .select(`
              id,
              assignee_name,
              assignee_email,
              assignee_department,
              assignee_employee_id,
              assignee_phone,
              assignment_location,
              purpose,
              assigned_date,
              special_instructions,
              status
            `)
            .eq("asset_id", assetData.id)
            .eq("status", "active")
            .maybeSingle()
          
          assignmentInfo = assignment
        }

        // If asset is allocated (borrowed), get borrowing details
        if (assetData.status === 'allocated') {
          const { data: borrowing } = await supabase
            .from("asset_borrowing")
            .select(`
              id,
              borrower_name,
              borrower_email,
              borrower_department,
              borrower_employee_id,
              borrower_phone,
              borrow_location,
              purpose,
              borrowed_date,
              expected_return_date,
              project_name,
              supervisor_name,
              supervisor_email,
              special_instructions,
              status
            `)
            .eq("asset_id", assetData.id)
            .eq("status", "active")
            .maybeSingle()
          
          borrowingInfo = borrowing
        }

        // Check for active repairs regardless of status
        const { data: activeRepairs } = await supabase
          .from("asset_repairs")
          .select(`
            id,
            repair_ticket,
            issue_description,
            status,
            priority,
            estimated_completion_date,
            actual_completion_date,
            assigned_technician,
            technician_contact,
            repair_location,
            created_at,
            updated_at,
            completion_date,
            reported_by_name,
            reported_by_email,
            reported_by_department,
            notes,
            work_order_number
          `)
          .eq("asset_id", assetData.id)
          .in("status", ["pending", "in_progress", "quote_pending"])
          .order("created_at", { ascending: false })
        
        if (activeRepairs && activeRepairs.length > 0) {
          repairInfo = activeRepairs[0] // Most recent active repair
        }

        // Create enhanced success message with comprehensive status details
        let statusMessage = `📦 Asset Found: "${assetData.name}" (${assetData.asset_tag})`
        let detailedInfo = []

        // Add basic asset information
        if (assetData.brand) {
          detailedInfo.push(`Brand: ${assetData.brand}`)
        }
        if (assetData.model) {
          detailedInfo.push(`Model: ${assetData.model}`)
        }
        if (assetData.serial_number) {
          detailedInfo.push(`Serial: ${assetData.serial_number}`)
        }
        if (assetData.category) {
          detailedInfo.push(`Category: ${assetData.category.replace('_', ' ').toUpperCase()}`)
        }

        // Add warranty information
        if (assetData.warranty_end_date) {
          const warrantyEnd = new Date(assetData.warranty_end_date)
          const today = new Date()
          const isWarrantyActive = warrantyEnd > today
          detailedInfo.push(`Warranty: ${isWarrantyActive ? '✅ Active' : '⚠️ Expired'} (Ends: ${warrantyEnd.toLocaleDateString()})`)
        }

        if (assignmentInfo) {
          statusMessage += ` - 🎯 ASSIGNED`
          detailedInfo.push(`👤 Assigned to: ${assignmentInfo.assignee_name}`)
          detailedInfo.push(`🏢 Department: ${assignmentInfo.assignee_department}`)
          detailedInfo.push(`📧 Email: ${assignmentInfo.assignee_email}`)
          if (assignmentInfo.assignee_phone) {
            detailedInfo.push(`📞 Phone: ${assignmentInfo.assignee_phone}`)
          }
          detailedInfo.push(`📍 Location: ${assignmentInfo.assignment_location}`)
          detailedInfo.push(`📅 Assigned: ${new Date(assignmentInfo.assigned_date).toLocaleDateString()}`)
          if (assignmentInfo.purpose) {
            detailedInfo.push(`🎯 Purpose: ${assignmentInfo.purpose}`)
          }
        } else if (borrowingInfo) {
          statusMessage += ` - 📤 BORROWED`
          detailedInfo.push(`👤 Borrowed by: ${borrowingInfo.borrower_name}`)
          detailedInfo.push(`🏢 Department: ${borrowingInfo.borrower_department}`)
          detailedInfo.push(`📧 Email: ${borrowingInfo.borrower_email}`)
          if (borrowingInfo.borrower_phone) {
            detailedInfo.push(`📞 Phone: ${borrowingInfo.borrower_phone}`)
          }
          detailedInfo.push(`📍 Location: ${borrowingInfo.borrow_location}`)
          detailedInfo.push(`📅 Borrowed: ${new Date(borrowingInfo.borrowed_date).toLocaleDateString()}`)
          detailedInfo.push(`⏰ Due: ${new Date(borrowingInfo.expected_return_date).toLocaleDateString()}`)
          if (borrowingInfo.project_name) {
            detailedInfo.push(`📋 Project: ${borrowingInfo.project_name}`)
          }
        } else {
          statusMessage += ` - 📊 ${assetData.status.toUpperCase().replace('_', ' ')}`
          detailedInfo.push(`📍 Current Location: ${assetData.location || 'Not specified'}`)
          if (assetData.purchase_date) {
            detailedInfo.push(`🛒 Purchased: ${new Date(assetData.purchase_date).toLocaleDateString()}`)
          }
          if (assetData.purchase_cost) {
            detailedInfo.push(`💰 Cost: ₱${assetData.purchase_cost.toLocaleString()}`)
          }
        }

        if (repairInfo) {
          statusMessage += ` - IN REPAIR`
          detailedInfo.push(`🔧 Repair: ${repairInfo.repair_ticket} (${repairInfo.work_order_number || 'No WO'})`)
          detailedInfo.push(`Status: ${repairInfo.status.replace('_', ' ').toUpperCase()}`)
          detailedInfo.push(`Issue: ${repairInfo.issue_description}`)
          detailedInfo.push(`Priority: ${repairInfo.priority.toUpperCase()}`)
          if (repairInfo.assigned_technician) {
            detailedInfo.push(`Technician: ${repairInfo.assigned_technician}`)
          }
          if (repairInfo.repair_location) {
            detailedInfo.push(`Repair Location: ${repairInfo.repair_location}`)
          }
          if (repairInfo.estimated_completion_date) {
            detailedInfo.push(`Est. Completion: ${new Date(repairInfo.estimated_completion_date).toLocaleDateString()}`)
          }
        }

        // Store the enhanced asset data for the details dialog
        const enhancedAsset = {
          ...assetData,
          __assignment_info: assignmentInfo,
          __borrowing_info: borrowingInfo,
          __repair_info: repairInfo
        }

        // Close scan dialog first, then open details modal after a brief delay
        setIsScanDialogOpen(false)
        
        console.log('Opening asset details modal for asset:', enhancedAsset.asset_tag)
        
        // Open the details modal with enhanced asset data
        setTimeout(() => {
          setSelectedAssetForDetails(enhancedAsset)
          setIsDetailsDialogOpen(true)
          console.log('Modal state set - isDetailsDialogOpen should be true')
        }, 100) // Small delay to ensure scan dialog closes first
        
        // Show comprehensive status message
        const fullMessage = `${statusMessage}\n${detailedInfo.join(' • ')}`
        setSuccessMessage(fullMessage)
        setTimeout(() => setSuccessMessage(""), 12000) // Longer timeout for detailed message with all asset info
      } else {
        // Asset not found - close scan dialog and show search message
        setIsScanDialogOpen(false)
        setSuccessMessage(`Scanned tag "${scannedTag}". Filter applied - asset may not be in system.`)
        setTimeout(() => setSuccessMessage(""), 4000)
      }
    } catch (err) {
      console.error("Error looking up scanned asset:", err)
      setIsScanDialogOpen(false) // Close scan dialog on error
      setError(`Error retrieving asset details: ${err.message}`)
      setTimeout(() => setError(""), 5000)
    }
  }

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
          qr_code,
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

  const handleBulkAssetsAdded = async (newAssets) => {
    // Add the new assets to the beginning of the list
    setAssets(prev => [...newAssets, ...prev])
    
    // Show success message for bulk assets
    const assetCount = newAssets.length
    const assetTags = newAssets.map(asset => asset.asset_tag).join(', ')
    setSuccessMessage(`${assetCount} assets added successfully! Asset tags: ${assetTags}`)
    setTimeout(() => setSuccessMessage(""), 8000) // Longer timeout for bulk message
    
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
      // Get asset details before deletion for logging
      const assetToDelete = assets.find(asset => asset.id === assetId)
      
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", assetId)

      if (error) throw error

      // Log the activity
      if (assetToDelete) {
        await logAssetActivity.deleted(assetToDelete)
      }

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

  const handleDisposalClick = (asset) => {
    setSelectedAssetForDisposal(asset)
    setIsDisposalDialogOpen(true)
  }

  const handleDisposalStatusUpdated = (updatedAsset) => {
    // Update the asset in the list
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ))
    
    // Show success message
    setSuccessMessage(`Asset "${updatedAsset.name}" marked for disposal successfully!`)
    setTimeout(() => setSuccessMessage(""), 5000)
    
    // Refresh data
    setTimeout(() => {
      fetchAssets()
    }, 500)
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
    { value: "broken", label: "Broken" },
    { value: "to_be_disposed", label: "To Be Disposed" },
    { value: "for_disposal", label: "For Disposal" },
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
        return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
      case "allocated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "deployed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      case "maintenance":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "retired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
      case "broken":
        return "bg-red-200 text-red-900 dark:bg-red-950/80 dark:text-red-200"
      case "to_be_disposed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
      case "for_disposal":
        return "bg-red-200 text-red-900 dark:bg-red-950/80 dark:text-red-200"
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
      case "broken": return "Broken"
      case "to_be_disposed": return "To Be Disposed"
      case "for_disposal": return "For Disposal"
      case "disposed": return "Disposed"
      case "lost": return "Lost"
      case "stolen": return "Stolen"
      default: return status
    }
  }

  const getConditionBadge = (condition) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "fair":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "poor":
      case "damaged":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/60 dark:text-gray-300"
    }
  }

  return (
    <InventoryStaffLayout activeTab="assets">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Assets Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage and track all inventory assets across warehouse locations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[5px] gap-2" onClick={fetchAssets}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-[5px] gap-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => setIsScanDialogOpen(true)}
            >
              <QrCode className="size-4" />
              Scan Asset
            </Button>
            <Button 
              size="sm"
              className="rounded-[5px] gap-2 bg-red-700 hover:bg-red-800"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="size-4" />
              Add Asset
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="rounded-[5px] gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
              onClick={() => setIsBulkAddDialogOpen(true)}
            >
              <Package className="size-4" />
              Bulk Add (10x)
            </Button>
          </div>
        </div>

        {/* Borrow Request Banner */}
        {fromBorrowRequest && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-[5px]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-[5px]">
                <Package className="size-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  📋 Selecting Assets for Borrow Request
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Choose available assets from the filtered category below to assign for borrowing. 
                  {selectedCategory !== "all" && ` Showing ${selectedCategory.replace('_', ' ').toUpperCase()} assets only.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
            <div className="size-4 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="size-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {successMessage.split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'text-xs mt-1' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20 ${
              activeFilter === "all" ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
            }`}
            onClick={() => handleFilterClick("all")}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Total Assets
                  </p>
                  <p className="text-lg font-bold text-blue-600">{assets.length}</p>
                </div>
                <Package className="size-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-950/20 ${
              activeFilter === "in_stock" ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''
            }`}
            onClick={() => handleFilterClick("in_stock")}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    In Stock
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {assets.filter(a => a.status === "in_stock").length}
                  </p>
                </div>
                <Package className="size-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/20 ${
              activeFilter === "deployed" ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' : ''
            }`}
            onClick={() => handleFilterClick("deployed")}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Deployed
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {assets.filter(a => a.status === "deployed").length}
                  </p>
                </div>
                <Tag className="size-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`rounded-[5px] cursor-pointer transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20 ${
              activeFilter === "allocated" ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : ''
            }`}
            onClick={() => handleFilterClick("allocated")}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Allocated
                  </p>
                  <p className="text-lg font-bold text-amber-600">
                    {assets.filter(a => a.status === "allocated").length}
                  </p>
                </div>
                <HardDrive className="size-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          {/* Disposal Summary Cards */}
          <Card className="rounded-[5px] cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/20">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    For Disposal
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {assets.filter(a => a.status === "for_disposal" || a.status === "broken" || a.status === "retired").length}
                  </p>
                </div>
                <AlertTriangle className="size-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-[5px]">
          <CardContent className="p-3">
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
                    <th className="px-3.5 py-2.5">Asset Info</th>
                    <th className="px-3.5 py-2.5">Brand & Status</th>
                    <th className="px-3.5 py-2.5">Location</th>
                    <th className="px-3.5 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {paginatedAssets.map((asset) => {
                    const IconComponent = getCategoryIcon(asset.category)
                    
                    return (
                      <tr key={asset.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Asset Info */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[5px]">
                              <IconComponent className="size-4 text-red-700 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{asset.name}</p>
                              <p className="text-xs font-mono text-red-700">{asset.asset_tag}</p>
                              <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-medium capitalize mt-0.5">
                                {asset.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Brand & Status */}
                        <td className="px-3.5 py-2.5">
                          <div className="space-y-1">
                            {asset.brand && (
                              <p className="font-medium text-foreground">{asset.brand}</p>
                            )}
                            {asset.model && (
                              <p className="text-xs text-muted-foreground">{asset.model}</p>
                            )}
                            <span className={`px-2 py-0.5 rounded-[5px] text-[11px] font-medium ${getStatusColor(asset.status)}`}>
                              {getStatusLabel(asset.status)}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{asset.location || 'Not specified'}</span>
                          </div>
                          {asset.condition && (
                            <span className={`inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium mt-1 ${getConditionBadge(asset.condition)}`}>
                              {asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5">
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
                            
                            {/* Show disposal button for maintenance, retired, broken, or poor condition assets */}
                            {(asset.status === 'maintenance' || asset.status === 'retired' || asset.status === 'broken' ||
                              asset.condition === 'poor' || asset.condition === 'damaged') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-xs text-orange-600 hover:text-orange-700" 
                                onClick={() => handleDisposalClick(asset)}
                                title="Complete Asset Disposal"
                              >
                                <Trash2 className="size-4 mr-1" />
                                Dispose Asset
                              </Button>
                            )}
                              
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30" 
                              title="Track / View Repairs"
                              onClick={() => {
                                setSelectedAssetForRepair(asset)
                                setIsRepairTrackingOpen(true)
                              }}
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

        {/* Bulk Add Asset Dialog */}
        <BulkAddAssetDialog
          isOpen={isBulkAddDialogOpen}
          onClose={() => setIsBulkAddDialogOpen(false)}
          onAssetsAdded={handleBulkAssetsAdded}
        />

        {/* Asset Assignment Dialog */}
        <AssetAssignmentDialog
          isOpen={isAssignmentDialogOpen}
          onClose={() => setIsAssignmentDialogOpen(false)}
          asset={selectedAssetForAssignment}
          assignmentType={assignmentType}
          onAssignmentComplete={handleAssignmentComplete}
          borrowRequestData={borrowRequestData}
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
          onDelete={handleDeleteClick}
          onRepair={(asset) => {
            setSelectedAssetForRepair(asset)
            setIsRepairTrackingOpen(true)
          }}
        />

        {/* Scan Asset Camera Dialog */}
        <ScanAssetDialog
          isOpen={isScanDialogOpen}
          onClose={() => setIsScanDialogOpen(false)}
          onScanSuccess={handleScanSuccess}
        />

        {/* Repair & Maintenance Tracking Dialog */}
        <AssetRepairTrackingDialog
          isOpen={isRepairTrackingOpen}
          onClose={() => setIsRepairTrackingOpen(false)}
          asset={selectedAssetForRepair}
          onOpenNewRepair={(assetToRepair) => {
            setSelectedAssetForRepair(assetToRepair)
            setIsNewRepairOpen(true)
          }}
        />

        {/* Add New Repair Dialog */}
        <AddRepairDialog
          isOpen={isNewRepairOpen}
          onClose={() => setIsNewRepairOpen(false)}
          preSelectedAsset={selectedAssetForRepair}
          onRepairAdded={(newRepair) => {
            setSuccessMessage(`Repair request ${newRepair.repair_ticket} submitted successfully!`)
            setTimeout(() => setSuccessMessage(""), 5000)
            setIsNewRepairOpen(false)
            fetchAssets()
            // Refresh repair tracking if opened
            setIsRepairTrackingOpen(true)
          }}
        />

        {/* Mark for Disposal Dialog */}
        <MarkForDisposalDialog
          isOpen={isDisposalDialogOpen}
          onClose={() => {
            setIsDisposalDialogOpen(false)
            setSelectedAssetForDisposal(null)
          }}
          asset={selectedAssetForDisposal}
          onStatusUpdated={handleDisposalStatusUpdated}
        />
      </div>
    </InventoryStaffLayout>
  )
}

export default AssetsPage