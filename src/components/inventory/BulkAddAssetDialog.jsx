import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  Laptop,
  Monitor,
  Server,
  Printer,
  Network,
  Camera,
  Smartphone,
  Tablet,
  Projector,
  HardDrive,
  Package,
  Loader2,
  AlertCircle,
  QrCode,
  Plus,
  Minus,
  Copy,
  Trash2
} from "lucide-react"
import { generateUniqueTrackingId } from "@/utils/qrCodeGenerator"

const categoryOptions = [
  { value: "computer", label: "Desktop Computer", icon: Monitor },
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "server", label: "Server", icon: Server },
  { value: "monitor", label: "Monitor/Display", icon: Monitor },
  { value: "printer", label: "Printer", icon: Printer },
  { value: "scanner", label: "Scanner", icon: Printer },
  { value: "networking", label: "Network Equipment", icon: Network },
  { value: "cctv", label: "CCTV Camera", icon: Camera },
  { value: "phone", label: "Phone/VoIP", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "projector", label: "Projector", icon: Projector },
  { value: "ups", label: "UPS/Power", icon: HardDrive },
  { value: "storage", label: "Storage Device", icon: HardDrive },
  { value: "accessory", label: "Accessory", icon: Package },
  { value: "software", label: "Software License", icon: Package },
  { value: "other", label: "Other", icon: Package }
]

const statusOptions = [
  { value: "in_stock", label: "In Stock" },
  { value: "allocated", label: "Allocated" },
  { value: "deployed", label: "Deployed" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
  { value: "disposed", label: "Disposed" },
  { value: "lost", label: "Lost" },
  { value: "stolen", label: "Stolen" }
]

const conditionOptions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" }
]

export function BulkAddAssetDialog({ isOpen, onClose, onAssetsAdded }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Common fields applied to all assets
  const [commonFields, setCommonFields] = useState({
    category: "",
    brand: "",
    model: "",
    purchase_date: "",
    purchase_cost: "",
    vendor: "",
    warranty_start_date: "",
    warranty_end_date: "",
    warranty_provider: "",
    warranty_type: "",
    location: "",
    status: "in_stock",
    condition: "excellent",
    description: ""
  })

  // Individual asset entries
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: "",
      serial_number: "",
      invoice_number: "",
      notes: "",
      // IT-specific fields
      computer_name: "",
      mac_address: "",
      ip_address: ""
    }
  ])

  const handleCommonFieldChange = (field, value) => {
    setCommonFields(prev => ({
      ...prev,
      [field]: value
    }))
    setError("")
  }

  const handleAssetChange = (index, field, value) => {
    setAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, [field]: value } : asset
    ))
    setError("")
  }

  const addAssetRow = () => {
    if (assets.length < 10) {
      setAssets(prev => [...prev, {
        id: Date.now(),
        name: "",
        serial_number: "",
        invoice_number: "",
        notes: "",
        computer_name: "",
        mac_address: "",
        ip_address: ""
      }])
    }
  }

  const removeAssetRow = (index) => {
    if (assets.length > 1) {
      setAssets(prev => prev.filter((_, i) => i !== index))
    }
  }

  const duplicateAssetRow = (index) => {
    if (assets.length < 10) {
      const assetToDuplicate = { ...assets[index] }
      assetToDuplicate.id = Date.now()
      assetToDuplicate.serial_number = "" // Clear unique fields
      assetToDuplicate.invoice_number = ""
      assetToDuplicate.mac_address = ""
      assetToDuplicate.ip_address = ""
      
      setAssets(prev => {
        const newAssets = [...prev]
        newAssets.splice(index + 1, 0, assetToDuplicate)
        return newAssets
      })
    }
  }

  const validateForm = () => {
    // Validate common fields
    if (!commonFields.category) return "Category is required for all assets"
    if (!commonFields.brand.trim()) return "Brand is required for all assets"
    if (!commonFields.model.trim()) return "Model is required for all assets"
    if (!commonFields.purchase_date) return "Purchase date is required for all assets"
    if (!commonFields.purchase_cost || !commonFields.purchase_cost.toString().trim()) return "Purchase cost is required for all assets"
    if (!commonFields.vendor.trim()) return "Vendor is required for all assets"
    if (!commonFields.location.trim()) return "Location is required for all assets"
    if (!commonFields.warranty_start_date) return "Warranty start date is required for all assets"
    if (!commonFields.warranty_end_date) return "Warranty end date is required for all assets"
    if (!commonFields.warranty_provider.trim()) return "Warranty provider is required for all assets"
    if (!commonFields.description.trim()) return "Description is required for all assets"

    // Validate individual asset fields
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const num = i + 1
      
      if (!asset.name.trim()) return `Asset ${num}: Name is required`
      if (!asset.serial_number.trim()) return `Asset ${num}: Serial number is required`
      if (!asset.invoice_number.trim()) return `Asset ${num}: Invoice number is required`
      
      // Check for duplicate serial numbers
      const duplicateSerial = assets.find((a, idx) => 
        idx !== i && a.serial_number.trim() && a.serial_number.trim() === asset.serial_number.trim()
      )
      if (duplicateSerial) return `Asset ${num}: Serial number must be unique`

      // Category-specific validation
      if (commonFields.category === "computer" || commonFields.category === "laptop") {
        if (!asset.computer_name.trim()) return `Asset ${num}: Computer name is required`
        if (!asset.mac_address.trim()) return `Asset ${num}: MAC address is required`
        if (!asset.ip_address.trim()) return `Asset ${num}: IP address is required`
        
        // Validate MAC address format
        if (asset.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(asset.mac_address)) {
          return `Asset ${num}: MAC address must be in format XX:XX:XX:XX:XX:XX`
        }
        
        // Validate IP address format
        if (asset.ip_address && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(asset.ip_address)) {
          return `Asset ${num}: IP address must be in format X.X.X.X`
        }

        // Check for duplicate MAC/IP addresses
        const duplicateMAC = assets.find((a, idx) => 
          idx !== i && a.mac_address.trim() && a.mac_address.trim() === asset.mac_address.trim()
        )
        if (duplicateMAC) return `Asset ${num}: MAC address must be unique`

        const duplicateIP = assets.find((a, idx) => 
          idx !== i && a.ip_address.trim() && a.ip_address.trim() === asset.ip_address.trim()
        )
        if (duplicateIP) return `Asset ${num}: IP address must be unique`
      }
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const assetsToInsert = assets.map(asset => ({
        // Common fields
        category: commonFields.category,
        brand: commonFields.brand.trim(),
        model: commonFields.model.trim(),
        purchase_date: commonFields.purchase_date,
        purchase_cost: parseFloat(commonFields.purchase_cost),
        vendor: commonFields.vendor.trim(),
        warranty_start_date: commonFields.warranty_start_date,
        warranty_end_date: commonFields.warranty_end_date,
        warranty_provider: commonFields.warranty_provider.trim(),
        warranty_type: commonFields.warranty_type.trim() || null,
        location: commonFields.location.trim(),
        status: commonFields.status,
        condition: commonFields.condition,
        description: commonFields.description.trim(),
        
        // Individual fields
        name: asset.name.trim(),
        serial_number: asset.serial_number.trim(),
        invoice_number: asset.invoice_number.trim(),
        notes: asset.notes.trim() || null,
        
        // IT-specific fields (only if category matches)
        computer_name: (commonFields.category === "computer" || commonFields.category === "laptop") ? asset.computer_name.trim() : null,
        mac_address: (commonFields.category === "computer" || commonFields.category === "laptop" || commonFields.category === "networking") ? asset.mac_address.trim() : null,
        ip_address: (commonFields.category === "computer" || commonFields.category === "laptop" || commonFields.category === "cctv" || commonFields.category === "networking") ? asset.ip_address.trim() : null,
        
        // System fields
        qr_code: `${window.location.origin}/dashboard/inventory/assets?search=${generateUniqueTrackingId("ITAMS")}`,
        created_by: user?.id,
        updated_by: user?.id
      }))

      const { data, error } = await supabase
        .from("assets")
        .insert(assetsToInsert)
        .select()

      if (error) throw error

      // Update QR codes with actual asset tags if generated
      if (data && data.length > 0) {
        const qrCodeUpdates = data.map(asset => ({
          id: asset.id,
          qr_code: `${window.location.origin}/dashboard/inventory/assets?search=${encodeURIComponent(asset.asset_tag || asset.id)}`
        }))

        // Update QR codes in batch
        for (const update of qrCodeUpdates) {
          await supabase
            .from("assets")
            .update({ qr_code: update.qr_code })
            .eq("id", update.id)
        }
      }

      // Reset form
      setCommonFields({
        category: "",
        brand: "",
        model: "",
        purchase_date: "",
        purchase_cost: "",
        vendor: "",
        warranty_start_date: "",
        warranty_end_date: "",
        warranty_provider: "",
        warranty_type: "",
        location: "",
        status: "in_stock",
        condition: "excellent",
        description: ""
      })
      
      setAssets([{
        id: 1,
        name: "",
        serial_number: "",
        invoice_number: "",
        notes: "",
        computer_name: "",
        mac_address: "",
        ip_address: ""
      }])

      onAssetsAdded?.(data)
      onClose()
      
    } catch (error) {
      console.error("Error adding assets:", error)
      setError(error.message || "Failed to add assets. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderComputerFields = (asset, index) => {
    if (commonFields.category !== "computer" && commonFields.category !== "laptop") {
      return null
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 p-3 bg-blue-50/30 dark:bg-blue-950/20 rounded-[5px] border border-blue-200/50 dark:border-blue-800/50">
        <div>
          <Label className="text-xs font-medium">Computer Name <span className="text-red-600">*</span></Label>
          <Input
            placeholder="PC-001"
            value={asset.computer_name}
            onChange={(e) => handleAssetChange(index, "computer_name", e.target.value)}
            className="rounded-[5px] text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">MAC Address <span className="text-red-600">*</span></Label>
          <Input
            placeholder="XX:XX:XX:XX:XX:XX"
            value={asset.mac_address}
            onChange={(e) => handleAssetChange(index, "mac_address", e.target.value)}
            className="rounded-[5px] text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">IP Address <span className="text-red-600">*</span></Label>
          <Input
            placeholder="192.168.1.100"
            value={asset.ip_address}
            onChange={(e) => handleAssetChange(index, "ip_address", e.target.value)}
            className="rounded-[5px] text-xs h-8"
          />
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto"
        onClose={onClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-blue-600" />
            Bulk Add Assets (Up to 10)
          </DialogTitle>
          <DialogDescription>
            Add multiple assets at once. Set common fields that apply to all assets, then specify individual details for each asset.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-[5px]">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* QR Code Notice */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-[5px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-zinc-800 rounded-[5px] border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 shrink-0">
                <QrCode className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Unique QR Codes Auto-Generated</p>
                <p className="text-[11px] text-muted-foreground">Each asset will receive a unique QR code for tracking and identification</p>
              </div>
            </div>
          </div>

          {/* Common Fields */}
          <Card className="rounded-[5px] border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Copy className="size-4" />
                Common Fields (Applied to All Assets)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium">Category <span className="text-red-600">*</span></Label>
                  <Select value={commonFields.category} onValueChange={(value) => handleCommonFieldChange("category", value)}>
                    <SelectTrigger className="rounded-[5px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="size-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Brand <span className="text-red-600">*</span></Label>
                  <Input
                    placeholder="e.g., Dell, HP, Apple"
                    value={commonFields.brand}
                    onChange={(e) => handleCommonFieldChange("brand", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Model <span className="text-red-600">*</span></Label>
                  <Input
                    placeholder="e.g., OptiPlex 7090"
                    value={commonFields.model}
                    onChange={(e) => handleCommonFieldChange("model", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Location <span className="text-red-600">*</span></Label>
                  <Input
                    placeholder="e.g., Building A - Floor 2"
                    value={commonFields.location}
                    onChange={(e) => handleCommonFieldChange("location", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Purchase Date <span className="text-red-600">*</span></Label>
                  <Input
                    type="date"
                    value={commonFields.purchase_date}
                    onChange={(e) => handleCommonFieldChange("purchase_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Purchase Cost (₱) <span className="text-red-600">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25000.00"
                    value={commonFields.purchase_cost}
                    onChange={(e) => handleCommonFieldChange("purchase_cost", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Vendor <span className="text-red-600">*</span></Label>
                  <Input
                    placeholder="e.g., Tech Solutions Inc."
                    value={commonFields.vendor}
                    onChange={(e) => handleCommonFieldChange("vendor", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Status</Label>
                  <Select value={commonFields.status} onValueChange={(value) => handleCommonFieldChange("status", value)}>
                    <SelectTrigger className="rounded-[5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Warranty Start <span className="text-red-600">*</span></Label>
                  <Input
                    type="date"
                    value={commonFields.warranty_start_date}
                    onChange={(e) => handleCommonFieldChange("warranty_start_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Warranty End <span className="text-red-600">*</span></Label>
                  <Input
                    type="date"
                    value={commonFields.warranty_end_date}
                    onChange={(e) => handleCommonFieldChange("warranty_end_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Warranty Provider <span className="text-red-600">*</span></Label>
                  <Input
                    placeholder="e.g., Dell Support"
                    value={commonFields.warranty_provider}
                    onChange={(e) => handleCommonFieldChange("warranty_provider", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Condition</Label>
                  <Select value={commonFields.condition} onValueChange={(value) => handleCommonFieldChange("condition", value)}>
                    <SelectTrigger className="rounded-[5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4">
                  <Label className="text-xs font-medium">Description <span className="text-red-600">*</span></Label>
                  <Textarea
                    placeholder="Common description for all assets..."
                    value={commonFields.description}
                    onChange={(e) => handleCommonFieldChange("description", e.target.value)}
                    className="rounded-[5px]"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Assets */}
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">Individual Asset Details</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{assets.length}/10 assets</span>
                  <Button
                    type="button"
                    onClick={addAssetRow}
                    disabled={assets.length >= 10}
                    size="sm"
                    className="h-8 px-3 text-xs gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="size-3.5" />
                    Add Asset
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {assets.map((asset, index) => (
                  <div key={asset.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-[5px] bg-zinc-50/30 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium">Asset {index + 1}</h5>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          onClick={() => duplicateAssetRow(index)}
                          disabled={assets.length >= 10}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Copy className="size-3" />
                          Duplicate
                        </Button>
                        {assets.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeAssetRow(index)}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-3" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs font-medium">Asset Name <span className="text-red-600">*</span></Label>
                        <Input
                          placeholder="e.g., Desktop Computer 001"
                          value={asset.name}
                          onChange={(e) => handleAssetChange(index, "name", e.target.value)}
                          className="rounded-[5px] text-xs h-8"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Serial Number <span className="text-red-600">*</span></Label>
                        <Input
                          placeholder="e.g., SN123456789"
                          value={asset.serial_number}
                          onChange={(e) => handleAssetChange(index, "serial_number", e.target.value)}
                          className="rounded-[5px] text-xs h-8"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Invoice Number <span className="text-red-600">*</span></Label>
                        <Input
                          placeholder="e.g., INV-2024-001"
                          value={asset.invoice_number}
                          onChange={(e) => handleAssetChange(index, "invoice_number", e.target.value)}
                          className="rounded-[5px] text-xs h-8"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Notes</Label>
                        <Input
                          placeholder="Optional notes..."
                          value={asset.notes}
                          onChange={(e) => handleAssetChange(index, "notes", e.target.value)}
                          className="rounded-[5px] text-xs h-8"
                        />
                      </div>
                    </div>

                    {renderComputerFields(asset, index)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Adding {assets.length} Assets...
                </>
              ) : (
                <>
                  <Package className="size-4 mr-2" />
                  Add {assets.length} Asset{assets.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BulkAddAssetDialog