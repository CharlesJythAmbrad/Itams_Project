import React from "react"
import {
  X,
  User,
  Mail,
  Building,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AssignmentDetailsDialog({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null

  const isBorrow = record.assignment_type === "borrow"
  const isOverdue = record.expected_return_date && 
    record.status === 'active' && 
    new Date(record.expected_return_date) < new Date()

  const getStatusBadge = () => {
    if (record.status === "returned") {
      return {
        label: "Returned",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
      }
    }
    if (isOverdue) {
      return {
        label: "Overdue",
        className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200"
      }
    }
    return {
      label: "Active",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200"
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-lg mt-0.5 ${
              isBorrow 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" 
                : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
            }`}>
              {isBorrow ? <ArrowDownLeft className="size-6" /> : <ArrowUpRight className="size-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {record.assets?.name || "Asset Details"}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isBorrow 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30" 
                    : "bg-purple-50 text-purple-700 dark:bg-purple-950/30"
                }`}>
                  {isBorrow ? "Borrowed" : "Assigned"}
                </span>
              </div>
              <p className="font-mono text-xs text-red-700 dark:text-red-400 font-semibold mt-1">
                {record.assets?.asset_tag || "No Tag"}
                {record.assets?.category && ` • ${record.assets.category}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Person Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <User className="size-3.5" />
              {isBorrow ? "Borrower Information" : "Assignee Information"}
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-foreground">{record.borrower_name || record.assignee_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{record.borrower_email || record.assignee_email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">{record.borrower_department || record.assignee_department || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employee / ID Number</p>
                <p className="font-medium text-foreground">{record.borrower_employee_id || record.assignee_employee_id || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-medium text-foreground">{record.borrower_phone || record.assignee_phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Allocation & Purpose */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Allocation Details
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60 space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{record.assignment_location || record.borrow_location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Purpose / Reason</p>
                <p className="text-foreground">{record.purpose || "—"}</p>
              </div>
              {record.project_name && (
                <div>
                  <p className="text-xs text-muted-foreground">Project Name</p>
                  <p className="font-medium text-foreground">{record.project_name}</p>
                </div>
              )}
              {record.special_instructions && (
                <div>
                  <p className="text-xs text-muted-foreground">Special Instructions</p>
                  <p className="text-foreground text-xs">{record.special_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Dates */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Timeline & Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <p className="text-xs text-muted-foreground">
                  {isBorrow ? "Borrowed Date" : "Assigned Date"}
                </p>
                <p className="font-medium text-foreground">
                  {record.assigned_date ? new Date(record.assigned_date).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Return Date</p>
                <p className={`font-medium ${isOverdue ? "text-red-600 font-semibold" : "text-foreground"}`}>
                  {record.expected_return_date ? new Date(record.expected_return_date).toLocaleDateString() : "Permanent / None"}
                  {isOverdue && " (Overdue)"}
                </p>
              </div>
              {record.actual_return_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Actual Return Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(record.actual_return_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supervisor Information */}
          {(record.supervisor_name || record.supervisor_email) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <UserCheck className="size-3.5" />
                Supervisor Details
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs text-muted-foreground">Supervisor Name</p>
                  <p className="font-medium text-foreground">{record.supervisor_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Supervisor Email</p>
                  <p className="font-medium text-foreground">{record.supervisor_email || "—"}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-end">
          <Button
            variant="default"
            size="sm"
            className="rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  )
}
