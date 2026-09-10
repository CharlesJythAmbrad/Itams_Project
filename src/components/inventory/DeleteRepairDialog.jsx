import React, { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { restoreAssetStatus } from "@/utils/assetStatusHelper"
import {
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  Wrench,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteRepairDialog({ isOpen, onClose, repair, onRepairDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen || !repair) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError("")

    try {
      const { error: deleteError } = await supabase
        .from("asset_repairs")
        .delete()
        .eq("id", repair.id)

      if (deleteError) throw deleteError

      // Check if there are any remaining active repairs for this asset
      if (repair.asset_id) {
        const { data: otherRepairs, error: otherRepairsErr } = await supabase
          .from("asset_repairs")
          .select("id")
          .eq("asset_id", repair.asset_id)
          .in("status", ["pending", "in_progress", "quote_pending"])

        if (!otherRepairsErr && (!otherRepairs || otherRepairs.length === 0)) {
          // No more active repairs -> restore to allocated (if borrowed), deployed (if assigned), or in_stock
          await restoreAssetStatus(repair.asset_id)
        }
      }

      onRepairDeleted?.(repair.id)
      onClose()
    } catch (err) {
      console.error("Error deleting repair request:", err)
      setError(err.message || "Failed to delete repair request.")
    } finally {
      setIsDeleting(false)
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
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Delete Repair Request</h2>
              <p className="text-xs text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-red-600">
              {error}
            </div>
          )}

          <p className="text-muted-foreground">
            Are you sure you want to delete repair ticket{" "}
            <span className="font-mono font-bold text-foreground">{repair.repair_ticket}</span>?
          </p>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <div className="flex items-center gap-2">
              <Package className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{repair.assets?.name || "Asset"}</span>
              <span className="font-mono text-red-700 dark:text-red-400">({repair.assets?.asset_tag || "No Tag"})</span>
            </div>
            <p className="text-muted-foreground line-clamp-2">
              <span className="font-medium text-foreground">Issue:</span> {repair.issue_description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-800/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-[5px] text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-[5px] text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                Delete Repair
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteRepairDialog
