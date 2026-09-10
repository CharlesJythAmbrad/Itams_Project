import React from "react"
import {
  X,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  HardDrive,
  Cpu,
  Monitor,
  Laptop,
  Server,
  Printer,
  Network,
  Camera,
  Smartphone,
  Tablet,
  Projector,
  Package,
  User,
  Clock,
  Building,
  Edit,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AssetDetailsDialog({ 
  isOpen, 
  onClose, 
  asset, 
  onAssign, 
  onBorrow, 
  onEdit 
}) {
  if (!isOpen || !asset) return null

  const getCategoryIcon = (category) => {
    const iconMap = {
      computer: Monitor,
      laptop: Laptop,
      server: Server,
      monitor: Monitor,
      printer: Printer,
      scanner: Printer,
      networking: Network,
      cctv: Camera,
      phone: Smartphone,
      tablet: Tablet,
      projector: Projector,
      ups: HardDrive,
      storage: HardDrive,
      accessory: Package,
      software: Package,
      other: Package
    }
    return iconMap[category] || Package
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "in_stock":
        return {
          label: "In Stock",
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        }
      case "allocated":
        return {
          label: "Allocated (Borrowed)",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        }
      case "deployed":
        return {
          label: "Deployed (Assigned)",
          className: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
        }
      case "maintenance":
        return {
          label: "Maintenance",
          className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
        }
      case "retired":
      case "disposed":
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
        }
      case "lost":
      case "stolen":
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
        }
      default:
        return {
          label: status || "Unknown",
          className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
        }
    }
  }

  const getConditionBadge = (condition) => {
    switch (condition) {
      case "excellent":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
      case "good":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "fair":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      case "poor":
      case "damaged":
        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800"
      default:
        return "bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
    }
  }

  const isWarrantyExpiring = asset.warranty_end_date && 
    new Date(asset.warranty_end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isWarrantyExpired = asset.warranty_end_date && 
    new Date(asset.warranty_end_date) < new Date()

  const IconComponent = getCategoryIcon(asset.category)
  const statusBadge = getStatusBadge(asset.status)

  // Check if asset has any tech specs
  const hasTechSpecs = asset.processor || asset.ram_gb || asset.storage_gb || 
    asset.operating_system || asset.computer_name || asset.mac_address || 
    asset.ip_address || asset.camera_resolution || asset.camera_type || 
    asset.port_count || asset.management_ip || asset.firmware_version ||
    asset.power_consumption_watts || asset.weight_kg || asset.dimensions

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-lg text-red-700 dark:text-red-400 mt-0.5">
              <IconComponent className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{asset.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                {asset.condition && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getConditionBadge(asset.condition)}`}>
                    {asset.condition}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-mono text-red-700 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                  {asset.asset_tag}
                </span>
                <span>•</span>
                <span className="capitalize">{asset.category?.replace('_', ' ')}</span>
                {asset.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {asset.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* General Information */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Tag className="size-3.5" />
              General Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="font-medium text-foreground">{asset.brand || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium text-foreground">{asset.model || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serial Number</p>
                <p className="font-mono text-xs font-medium text-foreground">{asset.serial_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium text-foreground capitalize">{asset.category?.replace('_', ' ') || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{asset.location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Condition</p>
                <p className="font-medium text-foreground capitalize">{asset.condition || "—"}</p>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          {hasTechSpecs && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Cpu className="size-3.5" />
                Technical Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                {asset.processor && (
                  <div>
                    <p className="text-xs text-muted-foreground">Processor / CPU</p>
                    <p className="font-medium text-foreground">{asset.processor}</p>
                  </div>
                )}
                {asset.ram_gb && (
                  <div>
                    <p className="text-xs text-muted-foreground">RAM</p>
                    <p className="font-medium text-foreground">{asset.ram_gb} GB</p>
                  </div>
                )}
                {asset.storage_gb && (
                  <div>
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="font-medium text-foreground">{asset.storage_gb} GB</p>
                  </div>
                )}
                {asset.operating_system && (
                  <div>
                    <p className="text-xs text-muted-foreground">Operating System</p>
                    <p className="font-medium text-foreground">{asset.operating_system}</p>
                  </div>
                )}
                {asset.computer_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Device Name</p>
                    <p className="font-medium text-foreground">{asset.computer_name}</p>
                  </div>
                )}
                {asset.ip_address && (
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs font-medium text-foreground">{asset.ip_address}</p>
                  </div>
                )}
                {asset.mac_address && (
                  <div>
                    <p className="text-xs text-muted-foreground">MAC Address</p>
                    <p className="font-mono text-xs font-medium text-foreground">{asset.mac_address}</p>
                  </div>
                )}
                {asset.camera_resolution && (
                  <div>
                    <p className="text-xs text-muted-foreground">Camera Resolution</p>
                    <p className="font-medium text-foreground">{asset.camera_resolution}</p>
                  </div>
                )}
                {asset.camera_type && (
                  <div>
                    <p className="text-xs text-muted-foreground">Camera Type</p>
                    <p className="font-medium text-foreground">{asset.camera_type}</p>
                  </div>
                )}
                {asset.port_count && (
                  <div>
                    <p className="text-xs text-muted-foreground">Port Count</p>
                    <p className="font-medium text-foreground">{asset.port_count} Ports</p>
                  </div>
                )}
                {asset.management_ip && (
                  <div>
                    <p className="text-xs text-muted-foreground">Management IP</p>
                    <p className="font-mono text-xs font-medium text-foreground">{asset.management_ip}</p>
                  </div>
                )}
                {asset.firmware_version && (
                  <div>
                    <p className="text-xs text-muted-foreground">Firmware</p>
                    <p className="font-medium text-foreground">{asset.firmware_version}</p>
                  </div>
                )}
                {asset.power_consumption_watts && (
                  <div>
                    <p className="text-xs text-muted-foreground">Power Consumption</p>
                    <p className="font-medium text-foreground">{asset.power_consumption_watts} W</p>
                  </div>
                )}
                {asset.weight_kg && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-medium text-foreground">{asset.weight_kg} kg</p>
                  </div>
                )}
                {asset.dimensions && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dimensions</p>
                    <p className="font-medium text-foreground">{asset.dimensions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial & Warranty Information */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <DollarSign className="size-3.5" />
              Financial & Warranty
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
              <div>
                <p className="text-xs text-muted-foreground">Purchase Cost</p>
                <p className="font-semibold text-foreground">
                  {asset.purchase_cost ? `₱${Number(asset.purchase_cost).toLocaleString()}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Purchase Date</p>
                <p className="font-medium text-foreground">
                  {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="font-medium text-foreground">{asset.vendor || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warranty Status</p>
                {asset.warranty_end_date ? (
                  <span className={`font-medium ${
                    isWarrantyExpired ? 'text-red-600 dark:text-red-400' :
                    isWarrantyExpiring ? 'text-amber-600 dark:text-amber-400' :
                    'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isWarrantyExpired ? 'Expired' : isWarrantyExpiring ? 'Expiring Soon' : 'Active'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warranty Until</p>
                <p className="font-medium text-foreground">
                  {asset.warranty_end_date ? new Date(asset.warranty_end_date).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warranty Provider</p>
                <p className="font-medium text-foreground">{asset.warranty_provider || "—"}</p>
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          {(asset.description || asset.notes) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Notes & Description
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60 space-y-2">
                {asset.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <p className="text-foreground text-xs mt-0.5">{asset.description}</p>
                  </div>
                )}
                {asset.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Internal Notes</p>
                    <p className="text-foreground text-xs mt-0.5">{asset.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {asset.created_at && (
              <span>Added: {new Date(asset.created_at).toLocaleDateString()}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {asset.status === "in_stock" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs gap-1.5"
                  onClick={() => {
                    onClose()
                    onAssign?.(asset)
                  }}
                >
                  <User className="size-3.5" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs gap-1.5"
                  onClick={() => {
                    onClose()
                    onBorrow?.(asset)
                  }}
                >
                  <Calendar className="size-3.5" />
                  Borrow
                </Button>
              </>
            )}
            
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs gap-1.5"
                onClick={() => {
                  onClose()
                  onEdit(asset)
                }}
              >
                <Edit className="size-3.5" />
                Edit
              </Button>
            )}

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
    </div>
  )
}
