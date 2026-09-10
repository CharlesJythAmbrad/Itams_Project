import React, { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  X,
  Loader2,
  AlertCircle,
  Wrench,
  Package,
  User,
  AlertTriangle
} from "lucide-react"

export function AddRepairDialog({ isOpen, onClose, onRepairAdded, preSelectedAsset = null }) {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  
  const [formData, setFormData] = useState({
    asset_id: "",
    issue_description: "",
    priority: "medium",
    reported_by_name: "",
    reported_by_email: "",
    reported_by_department: "",
    assigned_technician: "",
    technician_contact: "",
    estimated_cost: "",
    estimated_completion_date: "",
    repair_location: "",
    notes: ""
  })

  // Load assets when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAssets()
      
      // Pre-fill reporter information
      setFormData(prev => ({
        ...prev,
        reported_by_name: profile?.full_name || "",
        reported_by_email: user?.email || "",
        reported_by_department: "IT Department",
        asset_id: preSelectedAsset?.id || ""
      }))
    }
  }, [isOpen, profile, user, preSelectedAsset])

  const fetchAssets = async () => {
    try {
      setLoadingAssets(true)
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_tag, category, brand, model")
        .order("name")

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error("Error fetching assets:", error)
    } finally {
      setLoadingAssets(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.asset_id) return "Please select an asset"
    if (!formData.issue_description.trim()) return "Issue description is required"
    if (!formData.reported_by_name.trim()) return "Reporter name is required"
    if (!formData.reported_by_email.trim()) return "Reporter email is required"
    return null
  }

  const generateRepairTicket = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_repair_ticket')
      if (error) throw error
      return data
    } catch (error) {
      // Fallback: generate simple ticket number
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      return `RPR-${year}-${random}`
    }
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
      // Generate repair ticket number
      const repairTicket = await generateRepairTicket()

      const repairData = {
        asset_id: formData.asset_id,
        repair_ticket: repairTicket,
        issue_description: formData.issue_description.trim(),
        priority: formData.priority,
        status: 'pending',
        reported_by_name: formData.reported_by_name.trim(),
        reported_by_email: formData.reported_by_email.trim(),
        reported_by_department: formData.reported_by_department.trim() || null,
        assigned_technician: formData.assigned_technician.trim() || null,
        technician_contact: formData.technician_contact.trim() || null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        estimated_completion_date: formData.estimated_completion_date || null,
        repair_location: formData.repair_location.trim() || null,
        notes: formData.notes.trim() || null,
        work_order_number: `WO-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        created_by: user?.id
      }

      console.log("Creating repair request:", repairData)

      const { data, error } = await supabase
        .from("asset_repairs")
        .insert([repairData])
        .select(`
          *,
          assets (
            name,
            asset_tag,
            category,
            brand
          )
        `)
        .single()

      if (error) throw error

      console.log("Repair request created successfully:", data)

      // Update asset status to maintenance
      await supabase
        .from("assets")
        .update({ status: "maintenance" })
        .eq("id", formData.asset_id)

      // Reset form
      setFormData({
        asset_id: "",
        issue_description: "",
        priority: "medium",
        reported_by_name: profile?.full_name || "",
        reported_by_email: user?.email || "",
        reported_by_department: "IT Department",
        assigned_technician: "",
        technician_contact: "",
        estimated_cost: "",
        estimated_completion_date: "",
        repair_location: "",
        notes: ""
      })

      // Notify parent and close
      onRepairAdded?.(data)
      onClose()
      
    } catch (error) {
      console.error("Error creating repair request:", error)
      setError(error.message || "Failed to create repair request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-lg border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-full">
                <Wrench className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Create Repair Request</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submit a new repair or maintenance request for an asset
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2 disabled:opacity-50"
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

          {/* Asset Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Package className="size-4" />
              Asset Information
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Asset *</label>
                <select
                  required
                  value={formData.asset_id}
                  onChange={(e) => handleInputChange("asset_id", e.target.value)}
                  disabled={loadingAssets || !!preSelectedAsset}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                >
                  <option value="">
                    {loadingAssets ? "Loading assets..." : "Select an asset"}
                  </option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag}) - {asset.brand}
                    </option>
                  ))}
                </select>
                {preSelectedAsset && (
                  <p className="text-xs text-blue-600 mt-1">
                    Pre-selected: {preSelectedAsset.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Issue Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Issue Description *</label>
                <textarea
                  required
                  value={formData.issue_description}
                  onChange={(e) => handleInputChange("issue_description", e.target.value)}
                  rows={3}
                  placeholder="Describe the issue or maintenance needed..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Repair Location</label>
                <input
                  type="text"
                  value={formData.repair_location}
                  onChange={(e) => handleInputChange("repair_location", e.target.value)}
                  placeholder="e.g., IT Workshop, External Service"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <User className="size-4" />
              Reporter Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Reporter Name *</label>
                <input
                  type="text"
                  required
                  value={formData.reported_by_name}
                  onChange={(e) => handleInputChange("reported_by_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reporter Email *</label>
                <input
                  type="email"
                  required
                  value={formData.reported_by_email}
                  onChange={(e) => handleInputChange("reported_by_email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={formData.reported_by_department}
                  onChange={(e) => handleInputChange("reported_by_department", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Service Details (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={formData.assigned_technician}
                  onChange={(e) => handleInputChange("assigned_technician", e.target.value)}
                  placeholder="e.g., Internal IT, Service Provider"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Technician Contact</label>
                <input
                  type="text"
                  value={formData.technician_contact}
                  onChange={(e) => handleInputChange("technician_contact", e.target.value)}
                  placeholder="Phone or email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => handleInputChange("estimated_cost", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Expected Completion</label>
                <input
                  type="date"
                  value={formData.estimated_completion_date}
                  onChange={(e) => handleInputChange("estimated_completion_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Any additional information or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <Wrench className="size-4" />
                  Create Repair Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRepairDialog