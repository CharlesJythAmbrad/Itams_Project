import React, { useState } from "react"
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  Loader2 
} from "lucide-react"

export function DeleteAssetDialog({ isOpen, onClose, asset, onConfirmDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!asset) return
    
    setIsDeleting(true)
    try {
      await onConfirmDelete(asset.id)
      onClose()
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
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
      <div className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-md translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-lg border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-full">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Delete Asset
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Asset Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
              <h4 className="font-medium text-sm mb-2">Asset to be deleted:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset Tag:</span>
                  <span className="font-mono text-blue-600">{asset.asset_tag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="capitalize">{asset.category?.replace('_', ' ')}</span>
                </div>
                {asset.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span>{asset.brand}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex gap-3">
                <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Are you absolutely sure?
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    This will permanently delete the asset and all its associated data. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-foreground">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                onChange={(e) => {
                  const deleteButton = document.getElementById('delete-confirm-button')
                  if (deleteButton) {
                    deleteButton.disabled = e.target.value !== 'DELETE'
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              id="delete-confirm-button"
              onClick={handleDelete}
              disabled={true} // Initially disabled until user types DELETE
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete Asset
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