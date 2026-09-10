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
  AlertCircle
} from "lucide-react"

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

export function AddAssetDialog({ isOpen, onClose, onAssetAdded }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    serial_number: "",
    
    // Financial Information
    purchase_date: "",
    purchase_cost: "",
    vendor: "",
    invoice_number: "",
    
    // Warranty Information
    warranty_start_date: "",
    warranty_end_date: "",
    warranty_provider: "",
    warranty_type: "",
    
    // Location and Status
    location: "",
    status: "in_stock",
    condition: "excellent",
    
    // IT-Specific Fields
    computer_name: "",
    mac_address: "",
    ip_address: "",
    operating_system: "",
    processor: "",
    ram_gb: "",
    storage_gb: "",
    network_domain: "",
    
    // CCTV-Specific Fields
    camera_resolution: "",
    camera_type: "",
    recording_capacity_tb: "",
    
    // Network Equipment Fields
    port_count: "",
    management_ip: "",
    firmware_version: "",
    
    // General Technical Specifications
    power_consumption_watts: "",
    dimensions: "",
    weight_kg: "",
    
    // Notes
    notes: ""
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("") // Clear error when user types
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Asset name is required"
    if (!formData.category) return "Category is required"
    if (!formData.location.trim()) return "Location is required"
    
    // Validate MAC address format if provided
    if (formData.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.mac_address)) {
      return "MAC address must be in format XX:XX:XX:XX:XX:XX"
    }
    
    // Validate IP address format if provided
    if (formData.ip_address && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(formData.ip_address)) {
      return "IP address must be in format X.X.X.X"
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
      // Prepare the data for insertion
      const assetData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        vendor: formData.vendor.trim() || null,
        invoice_number: formData.invoice_number.trim() || null,
        
        warranty_start_date: formData.warranty_start_date || null,
        warranty_end_date: formData.warranty_end_date || null,
        warranty_provider: formData.warranty_provider.trim() || null,
        warranty_type: formData.warranty_type.trim() || null,
        
        location: formData.location.trim(),
        status: formData.status,
        condition: formData.condition,
        
        computer_name: formData.computer_name.trim() || null,
        mac_address: formData.mac_address.trim() || null,
        ip_address: formData.ip_address.trim() || null,
        operating_system: formData.operating_system.trim() || null,
        processor: formData.processor.trim() || null,
        ram_gb: formData.ram_gb ? parseInt(formData.ram_gb) : null,
        storage_gb: formData.storage_gb ? parseInt(formData.storage_gb) : null,
        network_domain: formData.network_domain.trim() || null,
        
        camera_resolution: formData.camera_resolution.trim() || null,
        camera_type: formData.camera_type.trim() || null,
        recording_capacity_tb: formData.recording_capacity_tb ? parseFloat(formData.recording_capacity_tb) : null,
        
        port_count: formData.port_count ? parseInt(formData.port_count) : null,
        management_ip: formData.management_ip.trim() || null,
        firmware_version: formData.firmware_version.trim() || null,
        
        power_consumption_watts: formData.power_consumption_watts ? parseInt(formData.power_consumption_watts) : null,
        dimensions: formData.dimensions.trim() || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        
        notes: formData.notes.trim() || null,
        created_by: user?.id,
        updated_by: user?.id
      }

      const { data, error } = await supabase
        .from("assets")
        .insert([assetData])
        .select()
        .single()

      if (error) throw error

      // Reset form and close dialog
      setFormData({
        name: "", description: "", category: "", brand: "", model: "", serial_number: "",
        purchase_date: "", purchase_cost: "", vendor: "", invoice_number: "",
        warranty_start_date: "", warranty_end_date: "", warranty_provider: "", warranty_type: "",
        location: "", status: "in_stock", condition: "excellent",
        computer_name: "", mac_address: "", ip_address: "", operating_system: "",
        processor: "", ram_gb: "", storage_gb: "", network_domain: "",
        camera_resolution: "", camera_type: "", recording_capacity_tb: "",
        port_count: "", management_ip: "", firmware_version: "",
        power_consumption_watts: "", dimensions: "", weight_kg: "", notes: ""
      })

      onAssetAdded?.(data)
      onClose()
      
    } catch (error) {
      console.error("Error adding asset:", error)
      setError(error.message || "Failed to add asset. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderCategorySpecificFields = () => {
    switch (formData.category) {
      case "computer":
      case "laptop":
        return (
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Computer/Laptop Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="computer_name" className="text-xs font-medium">Computer Name</Label>
                  <Input
                    id="computer_name"
                    placeholder="e.g., FACULTY-PC-001"
                    value={formData.computer_name}
                    onChange={(e) => handleInputChange("computer_name", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="mac_address" className="text-xs font-medium">MAC Address</Label>
                  <Input
                    id="mac_address"
                    placeholder="XX:XX:XX:XX:XX:XX"
                    value={formData.mac_address}
                    onChange={(e) => handleInputChange("mac_address", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="ip_address" className="text-xs font-medium">IP Address</Label>
                  <Input
                    id="ip_address"
                    placeholder="192.168.1.100"
                    value={formData.ip_address}
                    onChange={(e) => handleInputChange("ip_address", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="operating_system" className="text-xs font-medium">Operating System</Label>
                  <Input
                    id="operating_system"
                    placeholder="e.g., Windows 11 Pro"
                    value={formData.operating_system}
                    onChange={(e) => handleInputChange("operating_system", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="processor" className="text-xs font-medium">Processor</Label>
                  <Input
                    id="processor"
                    placeholder="e.g., Intel Core i7-12700"
                    value={formData.processor}
                    onChange={(e) => handleInputChange("processor", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="ram_gb" className="text-xs font-medium">RAM (GB)</Label>
                  <Input
                    id="ram_gb"
                    type="number"
                    placeholder="16"
                    value={formData.ram_gb}
                    onChange={(e) => handleInputChange("ram_gb", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="storage_gb" className="text-xs font-medium">Storage (GB)</Label>
                  <Input
                    id="storage_gb"
                    type="number"
                    placeholder="512"
                    value={formData.storage_gb}
                    onChange={(e) => handleInputChange("storage_gb", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="network_domain" className="text-xs font-medium">Network Domain</Label>
                  <Input
                    id="network_domain"
                    placeholder="e.g., itams.edu"
                    value={formData.network_domain}
                    onChange={(e) => handleInputChange("network_domain", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "cctv":
        return (
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">CCTV Camera Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="camera_resolution" className="text-xs font-medium">Resolution</Label>
                  <Input
                    id="camera_resolution"
                    placeholder="e.g., 4K, 1080p"
                    value={formData.camera_resolution}
                    onChange={(e) => handleInputChange("camera_resolution", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="camera_type" className="text-xs font-medium">Camera Type</Label>
                  <Input
                    id="camera_type"
                    placeholder="e.g., dome, bullet, PTZ"
                    value={formData.camera_type}
                    onChange={(e) => handleInputChange("camera_type", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="recording_capacity_tb" className="text-xs font-medium">Recording Capacity (TB)</Label>
                  <Input
                    id="recording_capacity_tb"
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={formData.recording_capacity_tb}
                    onChange={(e) => handleInputChange("recording_capacity_tb", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="ip_address" className="text-xs font-medium">IP Address</Label>
                  <Input
                    id="ip_address"
                    placeholder="192.168.100.10"
                    value={formData.ip_address}
                    onChange={(e) => handleInputChange("ip_address", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "networking":
        return (
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Network Equipment Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="port_count" className="text-xs font-medium">Port Count</Label>
                  <Input
                    id="port_count"
                    type="number"
                    placeholder="24"
                    value={formData.port_count}
                    onChange={(e) => handleInputChange("port_count", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="management_ip" className="text-xs font-medium">Management IP</Label>
                  <Input
                    id="management_ip"
                    placeholder="192.168.1.1"
                    value={formData.management_ip}
                    onChange={(e) => handleInputChange("management_ip", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="firmware_version" className="text-xs font-medium">Firmware Version</Label>
                  <Input
                    id="firmware_version"
                    placeholder="e.g., 16.12.05"
                    value={formData.firmware_version}
                    onChange={(e) => handleInputChange("firmware_version", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="mac_address" className="text-xs font-medium">MAC Address</Label>
                  <Input
                    id="mac_address"
                    placeholder="XX:XX:XX:XX:XX:XX"
                    value={formData.mac_address}
                    onChange={(e) => handleInputChange("mac_address", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto"
        onClose={onClose}
      >
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Add a new IT asset to the inventory system. Fill in the required fields and any relevant specifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-[5px]">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor="name" className="text-xs font-medium">Asset Name *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g., Dell OptiPlex 7090 Desktop"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-xs font-medium">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
                  <Label htmlFor="location" className="text-xs font-medium">Location *</Label>
                  <Input
                    id="location"
                    required
                    placeholder="e.g., Bay 4 - Rack A1"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
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
                  <Label htmlFor="brand" className="text-xs font-medium">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Dell, Apple, Cisco"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="model" className="text-xs font-medium">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., OptiPlex 7090"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="serial_number" className="text-xs font-medium">Serial Number</Label>
                  <Input
                    id="serial_number"
                    placeholder="e.g., SN-123456789"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange("serial_number", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the asset..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="rounded-[5px]"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Purchase & Financial Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="purchase_date" className="text-xs font-medium">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase_cost" className="text-xs font-medium">Purchase Cost ($)</Label>
                  <Input
                    id="purchase_cost"
                    type="number"
                    step="0.01"
                    placeholder="1299.00"
                    value={formData.purchase_cost}
                    onChange={(e) => handleInputChange("purchase_cost", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor" className="text-xs font-medium">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g., Dell Technologies Inc."
                    value={formData.vendor}
                    onChange={(e) => handleInputChange("vendor", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_number" className="text-xs font-medium">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    placeholder="e.g., INV-2024-001"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange("invoice_number", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warranty Information */}
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Warranty Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="warranty_start_date" className="text-xs font-medium">Warranty Start Date</Label>
                  <Input
                    id="warranty_start_date"
                    type="date"
                    value={formData.warranty_start_date}
                    onChange={(e) => handleInputChange("warranty_start_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty_end_date" className="text-xs font-medium">Warranty End Date</Label>
                  <Input
                    id="warranty_end_date"
                    type="date"
                    value={formData.warranty_end_date}
                    onChange={(e) => handleInputChange("warranty_end_date", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty_provider" className="text-xs font-medium">Warranty Provider</Label>
                  <Input
                    id="warranty_provider"
                    placeholder="e.g., Dell ProSupport"
                    value={formData.warranty_provider}
                    onChange={(e) => handleInputChange("warranty_provider", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty_type" className="text-xs font-medium">Warranty Type</Label>
                  <Input
                    id="warranty_type"
                    placeholder="e.g., manufacturer, extended"
                    value={formData.warranty_type}
                    onChange={(e) => handleInputChange("warranty_type", e.target.value)}
                    className="rounded-[5px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category-Specific Fields */}
          {renderCategorySpecificFields()}

          {/* Notes */}
          <Card className="rounded-[5px]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Additional Information</h4>
              <div>
                <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or special instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="rounded-[5px]"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-700 hover:bg-blue-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Adding Asset...
                </>
              ) : (
                "Add Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAssetDialog