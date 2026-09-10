import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { PesoSign } from "@/components/common/PesoSign"
import {
  X,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Plus,
  ArrowRight,
  ShieldAlert,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AssetRepairTrackingDialog({
  isOpen,
  onClose,
  asset,
  onOpenNewRepair
}) {
  const [repairs, setRepairs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen || !asset?.id) {
      setRepairs([])
      setIsLoading(false)
      setError("")
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError("")

    const fetchAssetRepairs = async () => {
      try {
        const { data, error: err } = await supabase
          .from("asset_repairs")
          .select("*")
          .eq("asset_id", asset.id)
          .order("created_at", { ascending: false })

        if (err) throw err

        if (isMounted) {
          setRepairs(data || [])
        }
      } catch (err) {
        console.error("Error fetching asset repairs:", err)
        if (isMounted) {
          setError(err.message || "Failed to load repair records.")
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchAssetRepairs()

    return () => {
      isMounted = false
    }
  }, [isOpen, asset?.id])

  if (!isOpen || !asset) return null

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending Assessment",
          bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
          icon: Clock
        }
      case "in_progress":
        return {
          label: "In Repair / Progress",
          bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
          icon: Wrench
        }
      case "quote_pending":
        return {
          label: "Quote / Approval Pending",
          bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300",
          icon: Clock
        }
      case "completed":
        return {
          label: "Completed & Verified",
          bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
          icon: CheckCircle2
        }
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300",
          icon: AlertTriangle
        }
      default:
        return {
          label: status || "Unknown",
          bg: "bg-zinc-100 text-zinc-700",
          icon: Clock
        }
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
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
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative z-50 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[8px] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 rounded-[6px]">
              <Wrench className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Repair & Maintenance Tracking
                </h2>
                <span className="font-mono text-xs text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                  {asset.asset_tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {asset.name} • {asset.brand} {asset.model}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-orange-600" />
              <p className="text-xs">Loading repair tickets and maintenance history...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-[6px] text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : repairs.length === 0 ? (
            /* Empty State: No Repair Requests Found */
            <div className="py-10 px-4 text-center space-y-3 bg-zinc-50/60 dark:bg-zinc-800/20 rounded-[8px] border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="size-12 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 mx-auto flex items-center justify-center">
                <Wrench className="size-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No Repair Requests Recorded</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  This asset currently has no active work orders, diagnostics, or historical maintenance tickets logged.
                </p>
              </div>

              {onOpenNewRepair && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose()
                    onOpenNewRepair(asset)
                  }}
                  className="rounded-[5px] text-xs gap-1.5 bg-red-700 hover:bg-red-800 text-white"
                >
                  <Plus className="size-3.5" />
                  Create New Repair Request
                </Button>
              )}
            </div>
          ) : (
            /* List of Repair Tickets */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                <span>
                  Found <strong>{repairs.length}</strong> repair request{repairs.length > 1 ? "s" : ""}
                </span>
                <span className="text-[11px] italic">Sorted by newest request</span>
              </div>

              {repairs.map((repair) => {
                const statusBadge = getStatusBadge(repair.status)
                const StatusIcon = statusBadge.icon

                return (
                  <div
                    key={repair.id}
                    className="p-3.5 bg-white dark:bg-zinc-800/80 rounded-[6px] border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                  >
                    {/* Ticket Header & Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-700/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {repair.repair_ticket}
                        </span>
                        {repair.work_order_number && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            WO: {repair.work_order_number}
                          </span>
                        )}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(repair.priority)}`}>
                          {repair.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${statusBadge.bg}`}>
                          <StatusIcon className="size-3" />
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div>
                      <p className="text-xs font-medium text-foreground leading-relaxed">
                        {repair.issue_description}
                      </p>
                      {repair.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                          <strong>Notes: </strong>{repair.notes}
                        </p>
                      )}
                    </div>

                    {/* Meta Grid (Technician, Dates, Cost, Location) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 bg-zinc-50/50 dark:bg-zinc-900/30 p-2.5 rounded-[5px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="size-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">
                          Reported by: <strong className="text-foreground">{repair.reported_by_name || "Staff"}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="size-3.5 shrink-0 text-zinc-400" />
                        <span>
                          Reported: <strong className="text-foreground">{formatDate(repair.reported_date || repair.created_at)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Wrench className="size-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">
                          Technician: <strong className="text-foreground">{repair.assigned_technician || "Unassigned"}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <PesoSign className="size-3.5 shrink-0 text-zinc-400" />
                        <span>
                          Cost: <strong className="text-emerald-600 dark:text-emerald-400">₱{repair.actual_cost || repair.estimated_cost || "TBD"}</strong>
                        </span>
                      </div>

                      {repair.repair_location && (
                        <div className="flex items-center gap-1.5 sm:col-span-2 truncate">
                          <MapPin className="size-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">
                            Location: <strong className="text-foreground">{repair.repair_location}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              navigate(`/dashboard/inventory/repairs?search=${encodeURIComponent(asset.asset_tag || asset.name)}`)
            }}
            className="text-xs rounded-[5px] gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            View in Repairs Ledger
          </Button>

          <div className="flex items-center gap-2">
            {onOpenNewRepair && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenNewRepair(asset)
                }}
                className="text-xs rounded-[5px] gap-1.5 bg-red-700 hover:bg-red-800 text-white"
              >
                <Plus className="size-3.5" />
                New Repair
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-[5px]"
            >
              Close
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AssetRepairTrackingDialog
