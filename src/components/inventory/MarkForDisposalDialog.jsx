import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { logAssetActivity } from "@/utils/activityLogger"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DISPOSAL_REASONS = [
  { value: "end_of_life", label: "End of Life" },
  { value: "beyond_repair", label: "Beyond Economical Repair" },
  { value: "obsolete", label: "Obsolete Technology" },
  { value: "security_risk", label: "Security Risk" },
  { value: "cost_ineffective", label: "Cost Ineffective to Maintain" },
  { value: "replacement", label: "Replaced with New Asset" },
  { value: "compliance", label: "Compliance Requirement" },
  { value: "damage", label: "Physical Damage" },
  { value: "other", label: "Other" }
]

export function MarkForDisposalDialog({ isOpen, onClose, asset, onStatusUpdated }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })
  const [formData, setFormData] = useState({
    disposal_reason: "",
    notes: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.disposal_reason) {
      setStatus({ type: "error", message: "Please select a disposal reason." })
      return
    }

    setLoading(true)
    setStatus({ type: null, message: "" })

    try {
      // Update asset status to disposed (complete disposal)
      const { error: updateError } = await supabase
        .from("assets")
        .update({ 
          status: "disposed",
          notes: formData.notes ? `${asset.notes || ''}\n\n[DISPOSED] ${formData.notes}`.trim() : asset.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", asset.id)

      if (updateError) throw updateError

      // Log the activity
      await logAssetActivity.updated({
        ...asset,
        status: "disposed"
      }, {
        action: 'asset_disposed',
        disposal_reason: formData.disposal_reason,
        disposal_type: "disposed",
        notes: formData.notes
      })

      setStatus({ 
        type: "success", 
        message: `Asset "${asset.name}" has been disposed successfully!` 
      })

      // Call the callback to update the asset list
      if (onStatusUpdated) {
        onStatusUpdated({
          ...asset,
          status: "disposed"
        })
      }

      // Close dialog after short delay
      setTimeout(() => {
        onClose()
        setFormData({
          disposal_reason: "",
          notes: ""
        })
        setStatus({ type: null, message: "" })
      }, 2000)

    } catch (error) {
      console.error("Error marking asset for disposal:", error)
      setStatus({ 
        type: "error", 
        message: "Failed to mark asset for disposal. Please try again." 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (status.type) setStatus({ type: null, message: "" })
  }

  if (!isOpen || !asset) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-[5px]">
                  <Trash2 className="size-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                    Complete Disposal
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {asset.name} ({asset.asset_tag})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[5px] text-zinc-500"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Warning Banner */}
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-[5px] flex items-start gap-3">
                <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    Complete Disposal Warning
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    This action will permanently dispose of the asset. The asset will be removed from active inventory and moved to disposal records.
                  </p>
                </div>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {status.type && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-3 rounded-[5px] flex items-start gap-2 ${
                      status.type === "success" 
                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                    }`}>
                      {status.type === "success" ? (
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm font-medium ${
                        status.type === "success" 
                          ? "text-green-800 dark:text-green-300"
                          : "text-red-800 dark:text-red-300"
                      }`}>
                        {status.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Disposal Reason */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Reason for Disposal <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.disposal_reason} onValueChange={(value) => handleInputChange("disposal_reason", value)}>
                    <SelectTrigger className="rounded-[5px]">
                      <SelectValue placeholder="Select disposal reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPOSAL_REASONS.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Additional Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-zinc-400" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Additional details about the disposal decision..."
                      rows={3}
                      className="w-full pl-10 pt-3 pb-3 pr-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Asset Summary */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[5px] space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Asset Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Asset Tag:</span>
                      <span className="ml-2 font-medium">{asset.asset_tag}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Current Status:</span>
                      <span className="ml-2 font-medium capitalize">{asset.status?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Purchase Date:</span>
                      <span className="ml-2 font-medium">
                        {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Purchase Cost:</span>
                      <span className="ml-2 font-medium">
                        {asset.purchase_cost ? `₱${asset.purchase_cost.toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 rounded-[5px]"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-[5px] bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trash2 className="size-4" />
                        Dispose Asset
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}