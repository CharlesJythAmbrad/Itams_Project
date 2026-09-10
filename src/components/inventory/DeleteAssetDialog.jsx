import React, { useState, useEffect } from "react"
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Building,
  ShieldAlert,
  Clock
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function DeleteAssetDialog({ isOpen, onClose, asset, onConfirmDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCheckingCustody, setIsCheckingCustody] = useState(true)
  const [custodyInfo, setCustodyInfo] = useState({
    activeAssignment: null,
    activeBorrowing: null,
  })
  const [confirmText, setConfirmText] = useState("")
  const [custodyAcknowledged, setCustodyAcknowledged] = useState(false)
  const [error, setError] = useState("")

  // Reset states and check custody when asset or isOpen changes
  useEffect(() => {
    if (!isOpen || !asset?.id) {
      setConfirmText("")
      setCustodyAcknowledged(false)
      setIsDeleting(false)
      setError("")
      setCustodyInfo({ activeAssignment: null, activeBorrowing: null })
      return
    }

    let isMounted = true
    setConfirmText("")
    setCustodyAcknowledged(false)
    setIsCheckingCustody(true)
    setError("")

    const checkCustody = async () => {
      try {
        // Query active assignments
        const { data: assignmentData, error: assignmentErr } = await supabase
          .from("asset_assignments")
          .select("id, assignee_name, assignee_email, assignee_department, assigned_date, expected_end_date, purpose")
          .eq("asset_id", asset.id)
          .eq("status", "active")
          .order("assigned_date", { ascending: false })
          .limit(1)

        // Query active borrowings
        const { data: borrowingData, error: borrowingErr } = await supabase
          .from("asset_borrowing")
          .select("id, borrower_name, borrower_email, borrower_department, borrowed_date, expected_return_date, purpose")
          .eq("asset_id", asset.id)
          .eq("status", "active")
          .order("borrowed_date", { ascending: false })
          .limit(1)

        if (!isMounted) return

        if (assignmentErr) console.warn("Notice checking assignment custody:", assignmentErr.message)
        if (borrowingErr) console.warn("Notice checking borrowing custody:", borrowingErr.message)

        setCustodyInfo({
          activeAssignment: assignmentData && assignmentData.length > 0 ? assignmentData[0] : null,
          activeBorrowing: borrowingData && borrowingData.length > 0 ? borrowingData[0] : null,
        })
      } catch (err) {
        console.error("Error checking asset custody:", err)
      } finally {
        if (isMounted) setIsCheckingCustody(false)
      }
    }

    checkCustody()

    return () => {
      isMounted = false
    }
  }, [isOpen, asset?.id])

  const hasCustody = Boolean(
    custodyInfo.activeAssignment || 
    custodyInfo.activeBorrowing || 
    asset?.status === "deployed" || 
    asset?.status === "allocated"
  )

  const isConfirmed = confirmText.trim() === "DELETE" && (!hasCustody || custodyAcknowledged)

  const handleDelete = async () => {
    if (!asset || !isConfirmed) return
    
    setIsDeleting(true)
    setError("")
    try {
      await onConfirmDelete(asset.id)
      onClose()
    } catch (err) {
      console.error("Delete failed:", err)
      setError(err?.message || "Failed to delete asset. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !asset) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={!isDeleting ? onClose : undefined}
      />
      
      {/* Dialog Content */}
      <div className="relative z-50 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[8px] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-red-50/70 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-[6px]">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-950 dark:text-red-200">
                  Delete Asset Confirmation
                </h2>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Permanent removal from inventory
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable if large */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Asset Info Summary Card */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-[6px] border border-zinc-200 dark:border-zinc-700/80">
            <h4 className="font-medium text-xs text-zinc-500 uppercase tracking-wider mb-2">Asset To Be Deleted</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Name:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{asset.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Asset Tag:</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{asset.asset_tag}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Category:</span>
                <span className="capitalize">{asset.category?.replace(/_/g, " ")}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Current Status:</span>
                <span className="capitalize font-medium">{asset.status?.replace(/_/g, " ")}</span>
              </div>
              {asset.brand && (
                <div>
                  <span className="text-muted-foreground block">Brand:</span>
                  <span>{asset.brand}</span>
                </div>
              )}
              {asset.serial_number && (
                <div>
                  <span className="text-muted-foreground block">Serial Number:</span>
                  <span className="font-mono text-xs">{asset.serial_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE CUSTODY REMINDER / WARNING */}
          {isCheckingCustody ? (
            <div className="p-3.5 bg-zinc-100 dark:bg-zinc-800/40 rounded-[6px] flex items-center gap-2.5 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-zinc-500" />
              <span>Verifying active borrowing and assignment records...</span>
            </div>
          ) : hasCustody ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-[6px] text-amber-950 dark:text-amber-200 space-y-3 animate-in fade-in-50">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                    Reminder: Asset is Currently in Active Custody!
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    This asset is recorded as currently <strong>{custodyInfo.activeBorrowing ? "BORROWED" : custodyInfo.activeAssignment ? "ASSIGNED" : asset.status?.toUpperCase()}</strong>.
                    Deleting it will cascade delete tracking records, which may cause discrepancies in active custody logs.
                  </p>
                </div>
              </div>

              {/* Custody Holder Details */}
              {(custodyInfo.activeAssignment || custodyInfo.activeBorrowing) && (
                <div className="bg-white/80 dark:bg-zinc-900/70 p-3 rounded-[5px] border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                    <User className="size-3.5" />
                    <span>Current Custodian:</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {custodyInfo.activeAssignment?.assignee_name || custodyInfo.activeBorrowing?.borrower_name || "Assigned User"}
                    </span>
                  </div>

                  {(custodyInfo.activeAssignment?.assignee_department || custodyInfo.activeBorrowing?.borrower_department) && (
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Building className="size-3.5" />
                      <span>Department:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {custodyInfo.activeAssignment?.assignee_department || custodyInfo.activeBorrowing?.borrower_department}
                      </span>
                    </div>
                  )}

                  {(custodyInfo.activeAssignment?.expected_end_date || custodyInfo.activeBorrowing?.expected_return_date) && (
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Calendar className="size-3.5" />
                      <span>Expected Return:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {custodyInfo.activeAssignment?.expected_end_date || custodyInfo.activeBorrowing?.expected_return_date}
                      </span>
                    </div>
                  )}

                  {(custodyInfo.activeAssignment?.purpose || custodyInfo.activeBorrowing?.purpose) && (
                    <div className="text-zinc-600 dark:text-zinc-400 pt-0.5">
                      <span className="text-muted-foreground">Purpose: </span>
                      <span>{custodyInfo.activeAssignment?.purpose || custodyInfo.activeBorrowing?.purpose}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Custody Acknowledgment Checkbox */}
              <div 
                onClick={() => setCustodyAcknowledged(prev => !prev)}
                className={`p-3 rounded-[6px] border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  custodyAcknowledged 
                    ? "bg-amber-100/90 dark:bg-amber-900/40 border-amber-500" 
                    : "bg-white/90 dark:bg-zinc-900/90 border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
                }`}
              >
                <input
                  type="checkbox"
                  id="custody-acknowledgment-checkbox"
                  checked={custodyAcknowledged}
                  onChange={(e) => setCustodyAcknowledged(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                />
                <label 
                  htmlFor="custody-acknowledgment-checkbox"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-amber-950 dark:text-amber-200 leading-snug cursor-pointer"
                >
                  Required: Check this box to confirm you want to delete an active asset and terminate its current custody records.
                </label>
              </div>
            </div>
          ) : null}

          {/* Standard Warning Notice */}
          <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-[6px]">
            <div className="flex gap-2.5">
              <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-300">
                <p className="font-semibold mb-0.5">This action cannot be undone.</p>
                <p>
                  Deleting will erase maintenance logs, assignment records, and QR code tracking entries associated with this asset.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              To proceed, type <span className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1 py-0.5 rounded">DELETE</span> below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-[5px] text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {confirmText.trim() === "DELETE" && hasCustody && !custodyAcknowledged && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-in fade-in flex items-center gap-1.5 mt-1">
                <span>⚠️</span>
                <span>Almost done! Please check the reminder box above to confirm deletion of this active asset.</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-2.5 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-[5px] text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {hasCustody && !custodyAcknowledged && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Custody acknowledgment required
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAssetDialog