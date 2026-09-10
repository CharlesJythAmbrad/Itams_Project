import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { restoreAssetStatus } from "@/utils/assetStatusHelper"
import {
  X,
  Loader2,
  AlertCircle,
  Wrench,
  Package,
  User,
  AlertTriangle,
  Save,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function EditRepairDialog({ isOpen, onClose, repair, onRepairUpdated }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    issue_description: "",
    priority: "medium",
    status: "pending",
    reported_by_name: "",
    reported_by_email: "",
    reported_by_department: "",
    assigned_technician: "",
    technician_contact: "",
    estimated_cost: "",
    actual_cost: "",
    estimated_completion_date: "",
    actual_completion_date: "",
    repair_location: "",
    notes: ""
  })

  useEffect(() => {
    if (repair && isOpen) {
      setFormData({
        issue_description: repair.issue_description || "",
        priority: repair.priority || "medium",
        status: repair.status || "pending",
        reported_by_name: repair.reported_by_name || "",
        reported_by_email: repair.reported_by_email || "",
        reported_by_department: repair.reported_by_department || "",
        assigned_technician: repair.assigned_technician || "",
        technician_contact: repair.technician_contact || "",
        estimated_cost: repair.estimated_cost !== null && repair.estimated_cost !== undefined ? repair.estimated_cost : "",
        actual_cost: repair.actual_cost !== null && repair.actual_cost !== undefined ? repair.actual_cost : "",
        estimated_completion_date: repair.estimated_completion_date ? repair.estimated_completion_date.split("T")[0] : "",
        actual_completion_date: (repair.actual_completion_date || repair.completion_date) ? (repair.actual_completion_date || repair.completion_date).split("T")[0] : "",
        repair_location: repair.repair_location || "",
        notes: repair.notes || ""
      })
      setError("")
    }
  }, [repair, isOpen])

  if (!isOpen || !repair) return null

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      // Auto set actual_completion_date if status changed to completed and no actual_completion_date is set
      if (field === "status" && value === "completed" && !prev.actual_completion_date) {
        updated.actual_completion_date = new Date().toISOString().split("T")[0]
      }
      return updated
    })
    setError("")
  }

  const validateForm = () => {
    if (!formData.issue_description.trim()) return "Issue description is required"
    if (!formData.reported_by_name.trim()) return "Reporter name is required"
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
      const updatePayload = {
        issue_description: formData.issue_description.trim(),
        priority: formData.priority,
        status: formData.status,
        reported_by_name: formData.reported_by_name.trim(),
        reported_by_email: formData.reported_by_email.trim() || null,
        reported_by_department: formData.reported_by_department.trim() || null,
        assigned_technician: formData.assigned_technician.trim() || null,
        technician_contact: formData.technician_contact.trim() || null,
        estimated_cost: formData.estimated_cost !== "" ? parseFloat(formData.estimated_cost) : null,
        actual_cost: formData.actual_cost !== "" ? parseFloat(formData.actual_cost) : null,
        estimated_completion_date: formData.estimated_completion_date || null,
        actual_completion_date: formData.actual_completion_date || null,
        repair_location: formData.repair_location.trim() || null,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString()
      }

      console.log("Updating repair ticket:", repair.id, updatePayload)

      const { data, error: updateError } = await supabase
        .from("asset_repairs")
        .update(updatePayload)
        .eq("id", repair.id)
        .select(`
          *,
          assets (
            name,
            asset_tag,
            category,
            brand,
            model
          )
        `)
        .single()

      if (updateError) throw updateError

      // Update asset status appropriately
      if (repair.asset_id) {
        if (formData.status === "completed" || formData.status === "cancelled") {
          // Restore asset to its normal status (allocated if borrowed, deployed if assigned, else in_stock)
          await restoreAssetStatus(repair.asset_id)
        } else if (formData.status === "in_progress" || formData.status === "pending" || formData.status === "quote_pending") {
          await supabase
            .from("assets")
            .update({ status: "maintenance" })
            .eq("id", repair.asset_id)
        }
      }

      onRepairUpdated?.(data)
      onClose()
    } catch (err) {
      console.error("Error updating repair request:", err)
      setError(err.message || "Failed to update repair request.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md shrink-0 mt-0.5">
              <Wrench className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-foreground">Edit Repair Request</h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                  {repair.repair_ticket}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Update status, technician assignments, costs, or completion dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Asset Info Display */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
              <Package className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {repair.assets?.name || "Asset"}
              </p>
              <p className="text-xs text-muted-foreground">
                Tag: <span className="font-mono text-red-700 dark:text-red-400 font-medium">{repair.assets?.asset_tag || "No Tag"}</span> • Brand: {repair.assets?.brand || "N/A"} {repair.assets?.model || ""}
              </p>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-foreground">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="quote_pending">Quote Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-foreground">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Issue Details */}
          <div>
            <label className="block font-medium mb-1 text-foreground">Issue Description *</label>
            <textarea
              required
              rows={3}
              value={formData.issue_description}
              onChange={(e) => handleInputChange("issue_description", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
            />
          </div>

          {/* Financials & Dates */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Financials & Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium mb-1 text-foreground">Est. Cost (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => handleInputChange("estimated_cost", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Actual Cost (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_cost}
                  onChange={(e) => handleInputChange("actual_cost", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Est. Completion</label>
                <input
                  type="date"
                  value={formData.estimated_completion_date}
                  onChange={(e) => handleInputChange("estimated_completion_date", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Completion Date</label>
                <input
                  type="date"
                  value={formData.actual_completion_date}
                  onChange={(e) => handleInputChange("actual_completion_date", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Technician & Location */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Technician & Workshop</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-foreground">Assigned Technician</label>
                <input
                  type="text"
                  value={formData.assigned_technician}
                  onChange={(e) => handleInputChange("assigned_technician", e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Technician Contact</label>
                <input
                  type="text"
                  value={formData.technician_contact}
                  onChange={(e) => handleInputChange("technician_contact", e.target.value)}
                  placeholder="Phone or email"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Repair Location</label>
                <input
                  type="text"
                  value={formData.repair_location}
                  onChange={(e) => handleInputChange("repair_location", e.target.value)}
                  placeholder="e.g., IT Workshop"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Reporter Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-foreground">Reporter Name *</label>
                <input
                  type="text"
                  required
                  value={formData.reported_by_name}
                  onChange={(e) => handleInputChange("reported_by_name", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Reporter Email</label>
                <input
                  type="email"
                  value={formData.reported_by_email}
                  onChange={(e) => handleInputChange("reported_by_email", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-foreground">Department</label>
                <input
                  type="text"
                  value={formData.reported_by_department}
                  onChange={(e) => handleInputChange("reported_by_department", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium mb-1 text-foreground">Additional Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add work notes, parts replaced, or diagnostic logs..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-foreground"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-[5px] text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="rounded-[5px] text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRepairDialog
