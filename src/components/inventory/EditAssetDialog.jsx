import React, { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  X,
  Loader2,
  AlertCircle,
  Save,
  Package
} from "lucide-react"

export function EditAssetDialog({ isOpen, onClose, asset, onAssetUpdated }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    vendor: "",
    warranty_end_date: "",
    location: "",
    status: "in_stock",
    condition: "excellent",
    // Computer/Laptop fields
    computer_name: "",
    mac_address: "",
    ip_address: "",
    operating_system: "",
    processor: "",
    ram_gb: "",
    storage_gb: "",
    // CCTV fields
    camera_resolution: "",
    camera_type: "",
    // Network fields
    port_count: "",
    management_ip: "",
    firmware_version: "",
    // General specs
    power_consumption_watts: "",
    dimensions: "",
    weight_kg: "",
    notes: ""
  })

  // Populate form when asset changes
  useEffect(() => {
    if (asset && isOpen) {
      setFormData({
        name: asset.name || "",
        description: asset.description || "",
        category: asset.category || "",
        brand: asset.brand || "",
        model: asset.model || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        purchase_cost: asset.purchase_cost || "",
        vendor: asset.vendor || "",
        warranty_end_date: asset.warranty_end_date || "",
        location: asset.location || "",
        status: asset.status || "in_stock",
        condition: asset.condition || "excellent",
        computer_name: asset.computer_name || "",
        mac_address: asset.mac_address || "",
        ip_address: asset.ip_address || "",
        operating_system: asset.operating_system || "",
        processor: asset.processor || "",
        ram_gb: asset.ram_gb || "",
        storage_gb: asset.storage_gb || "",
        camera_resolution: asset.camera_resolution || "",
        camera_type: asset.camera_type || "",
        port_count: asset.port_count || "",
        management_ip: asset.management_ip || "",
        firmware_version: asset.firmware_version || "",
        power_consumption_watts: asset.power_consumption_watts || "",
        dimensions: asset.dimensions || "",
        weight_kg: asset.weight_kg || "",
        notes: asset.notes || ""
      })
    }
  }, [asset, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Asset name is required"
    if (!formData.category) return "Category is required"
    if (!formData.location.trim()) return "Location is required"
    
    if (formData.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.mac_address)) {
      return "MAC address must be in format XX:XX:XX:XX:XX:XX"
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
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        vendor: formData.vendor.trim() || null,
        warranty_end_date: formData.warranty_end_date || null,
        location: formData.location.trim(),
        status: formData.status,
        condition: formData.condition,
        // Computer/Laptop fields
        computer_name: formData.computer_name.trim() || null,
        mac_address: formData.mac_address.trim() || null,
        ip_address: formData.ip_address.trim() || null,
        operating_system: formData.operating_system.trim() || null,
        processor: formData.processor.trim() || null,
        ram_gb: formData.ram_gb ? parseInt(formData.ram_gb) : null,
        storage_gb: formData.storage_gb ? parseInt(formData.storage_gb) : null,
        // CCTV fields
        camera_resolution: formData.camera_resolution.trim() || null,
        camera_type: formData.camera_type.trim() || null,
        // Network fields
        port_count: formData.port_count ? parseInt(formData.port_count) : null,
        management_ip: formData.management_ip.trim() || null,
        firmware_version: formData.firmware_version.trim() || null,
        // General specs
        power_consumption_watts: formData.power_consumption_watts ? parseInt(formData.power_consumption_watts) : null,
        dimensions: formData.dimensions.trim() || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        notes: formData.notes.trim() || null,
        updated_by: user?.id
      }

      const { data, error } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", asset.id)
        .select()
        .single()

      if (error) throw error

      console.log("Asset updated successfully:", data)
      
      // Notify parent component and close dialog
      onAssetUpdated?.(data)
      onClose()
      
    } catch (error) {
      console.error("Error updating asset:", error)
      setError(error.message || "Failed to update asset. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !asset) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-6xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-lg border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Edit Asset</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update asset information and specifications
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Asset Information */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Package className="size-4" />
              Current Asset: {asset.asset_tag}
            </h4>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                >
                  <option value="">Select category</option>
                  <option value="computer">Desktop Computer</option>
                  <option value="laptop">Laptop</option>
                  <option value="server">Server</option>
                  <option value="monitor">Monitor/Display</option>
                  <option value="printer">Printer</option>
                  <option value="networking">Network Equipment</option>
                  <option value="cctv">CCTV Camera</option>
                  <option value="phone">Phone</option>
                  <option value="tablet">Tablet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="allocated">Allocated</option>
                  <option value="deployed">Deployed</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange("serial_number", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Purchase Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_cost}
                  onChange={(e) => handleInputChange("purchase_cost", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Computer/Laptop Specifications */}
          {(formData.category === "computer" || formData.category === "laptop") && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Computer Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Computer Name</label>
                  <input
                    type="text"
                    value={formData.computer_name}
                    onChange={(e) => handleInputChange("computer_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={formData.mac_address}
                    onChange={(e) => handleInputChange("mac_address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Operating System</label>
                  <input
                    type="text"
                    value={formData.operating_system}
                    onChange={(e) => handleInputChange("operating_system", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Processor</label>
                  <input
                    type="text"
                    value={formData.processor}
                    onChange={(e) => handleInputChange("processor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    value={formData.ram_gb}
                    onChange={(e) => handleInputChange("ram_gb", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={formData.storage_gb}
                    onChange={(e) => handleInputChange("storage_gb", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditAssetDialog