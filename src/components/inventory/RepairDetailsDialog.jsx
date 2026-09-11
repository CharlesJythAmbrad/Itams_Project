import React from "react"
import {
  X,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Edit,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PesoSign } from "@/components/common/PesoSign"

export function RepairDetailsDialog({ isOpen, onClose, repair, onEdit, onViewAsset }) {
  if (!isOpen || !repair) return null

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
        }
      case "in_progress":
        return {
          label: "In Progress",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
        }
      case "quote_pending":
        return {
          label: "Quote Pending",
          className: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300"
        }
      case "completed":
        return {
          label: "Completed",
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
        }
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300"
        }
      default:
        return {
          label: status || "Unknown",
          className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        }
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300"
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-300"
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const statusBadge = getStatusBadge(repair.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md shrink-0 mt-0.5">
              <Wrench className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-foreground font-mono">
                  {repair.repair_ticket}
                </h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityBadge(repair.priority)}`}>
                  {repair.priority} Priority
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Work Order: <span className="font-mono font-medium text-foreground">{repair.work_order_number || "N/A"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Asset Info Card */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                <Package className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {repair.assets?.name || "Unknown Asset"}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                  <span className="font-mono text-red-700 dark:text-red-400 font-medium">
                    {repair.assets?.asset_tag || "No Tag"}
                  </span>
                  {repair.assets?.brand && (
                    <span>• {repair.assets.brand} {repair.assets?.model || ""}</span>
                  )}
                  {repair.assets?.category && (
                    <span className="capitalize">• {repair.assets.category.replace(/_/g, " ")}</span>
                  )}
                </div>
              </div>
            </div>
            {onViewAsset && repair.assets?.asset_tag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onViewAsset(repair.assets.asset_tag)
                }}
                className="rounded-[5px] text-xs h-8 gap-1.5 shrink-0"
              >
                <ExternalLink className="size-3.5" />
                View Asset
              </Button>
            )}
          </div>

          {/* Issue Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-500" />
              Issue Description
            </h4>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/60">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {repair.issue_description || "No issue description provided."}
              </p>
            </div>
          </div>

          {/* Timeline & Costs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <PesoSign className="size-3.5" />
              Timeline & Financials
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <span className="text-muted-foreground block mb-0.5">Date Reported</span>
                <span className="font-medium text-foreground">{formatDate(repair.reported_date || repair.created_at)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Est. Completion</span>
                <span className="font-medium text-foreground">{formatDate(repair.estimated_completion_date)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Completed Date</span>
                <span className="font-medium text-foreground">{formatDate(repair.actual_completion_date || repair.completion_date)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Service Cost</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  FREE
                </span>
              </div>
            </div>
          </div>

          {/* Technician & Location */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Wrench className="size-3.5" />
              Service & Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <span className="text-muted-foreground block mb-0.5">Technician</span>
                <span className="font-medium text-foreground">{repair.assigned_technician || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Technician Contact</span>
                <span className="font-medium text-foreground">{repair.technician_contact || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Repair Location</span>
                <span className="font-medium text-foreground">{repair.repair_location || "—"}</span>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <User className="size-3.5" />
              Reporter Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <span className="text-muted-foreground block mb-0.5">Reporter Name</span>
                <span className="font-medium text-foreground">{repair.reported_by_name || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Reporter Email</span>
                <span className="font-medium text-foreground">{repair.reported_by_email || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Department</span>
                <span className="font-medium text-foreground">{repair.reported_by_department || "—"}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {repair.notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Additional Notes
              </h4>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/60">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {repair.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-[5px] text-xs"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit(repair)
                }}
                className="rounded-[5px] text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="size-3.5" />
                Edit Repair Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RepairDetailsDialog
