import React, { useState, useEffect, useRef } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "@/routes/RouterContext"
import { supabase } from "@/lib/supabaseClient"
import { logActivity } from "@/utils/activityLogger"
import { motion, AnimatePresence } from "framer-motion"
import {
  QrCode,
  Boxes,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  Mail,
  MapPin,
  User,
  Phone,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Package,
  Building,
  Hash,
  Clock,
  CalendarDays,
  Search,
  Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import QRCode from "qrcode"

/* ─── Constants ─────────────────────────────────────────── */
const ASSET_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "computer", label: "Desktop Computer" },
  { value: "monitor", label: "Monitor" },
  { value: "printer", label: "Printer" },
  { value: "scanner", label: "Scanner" },
  { value: "projector", label: "Projector" },
  { value: "cctv", label: "Camera/CCTV" },
  { value: "networking", label: "Network Equipment" },
  { value: "phone", label: "Phone" },
  { value: "tablet", label: "Tablet" },
  { value: "server", label: "Server" },
  { value: "ups", label: "UPS/Power Equipment" },
  { value: "storage", label: "Storage Device" },
  { value: "accessory", label: "Accessory" },
  { value: "other", label: "Other" },
]

const STATUS_COLORS = {
  pending:    { bg: "bg-yellow-100 dark:bg-yellow-950/40",  text: "text-yellow-800 dark:text-yellow-300",  border: "border-yellow-200 dark:border-yellow-800" },
  approved:   { bg: "bg-green-100 dark:bg-green-950/40",   text: "text-green-800 dark:text-green-300",    border: "border-green-200 dark:border-green-800" },
  in_progress:{ bg: "bg-blue-100 dark:bg-blue-950/40",     text: "text-blue-800 dark:text-blue-300",      border: "border-blue-200 dark:border-blue-800" },
  completed:  { bg: "bg-emerald-100 dark:bg-emerald-950/40",text: "text-emerald-800 dark:text-emerald-300",border: "border-emerald-200 dark:border-emerald-800" },
  rejected:   { bg: "bg-red-100 dark:bg-red-950/40",       text: "text-red-800 dark:text-red-300",        border: "border-red-200 dark:border-red-800" },
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"
const getAssetTypeLabel = (type) => ASSET_TYPES.find(t => t.value === type)?.label || type
/* ═══════════════════════════════════════════════════════════
   QR MODAL – shows the scannable QR code for borrow requests  
═══════════════════════════════════════════════════════════ */
function QRModal({ isOpen, onClose }) {
  const canvasRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState("")

  const formUrl = `${window.location.origin}/borrow-request-form`

  useEffect(() => {
    if (!isOpen) return
    QRCode.toDataURL(formUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(console.error)
  }, [isOpen, formUrl])

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = "itams-borrow-request-qr.png"
    a.click()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm"
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <QrCode className="size-5 text-red-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Scan to Submit Borrow Request</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>

          {/* QR */}
          <div className="p-6 flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-[5px] border-2 border-zinc-200 dark:border-zinc-700 shadow-inner">
                <img src={qrDataUrl} alt="Borrow Request QR Code" className="size-64" />
              </div>
            ) : (
              <div className="size-64 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-zinc-400" />
              </div>
            )}

            <div className="text-center space-y-1">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Point your phone camera at the QR code
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 break-all font-mono">{formUrl}</p>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-[5px] text-xs h-9"
                onClick={handleDownload}
                disabled={!qrDataUrl}
              >
                <Download className="size-3.5 mr-1.5" />
                Download QR
              </Button>
              <Button
                variant="brand"
                className="flex-1 rounded-[5px] text-xs h-9"
                onClick={() => window.open(formUrl, "_blank")}
              >
                <Eye className="size-3.5 mr-1.5" />
                Open Form
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
/* ═══════════════════════════════════════════════════════════
   BORROW REQUEST DETAIL MODAL
═══════════════════════════════════════════════════════════ */
function BorrowRequestDetailModal({ request, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const { navigate } = useRouter()

  if (!request) return null

  const sc = STATUS_COLORS[request.status] ?? STATUS_COLORS.pending

  const handleStatus = async (newStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from("asset_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", request.id)
      
      if (!error) {
        // Log the activity
        try {
          await logActivity({
            action: 'update',
            resourceType: 'borrow_request',
            resourceId: request.id,
            resourceName: `Borrow Request - ${request.full_name}`,
            description: `Updated borrow request status from ${request.status} to ${newStatus}`,
            metadata: {
              previous_status: request.status,
              new_status: newStatus,
              asset_type: request.asset_type,
              quantity: request.quantity,
              requester: request.full_name
            }
          })
        } catch (logError) {
          console.warn("Failed to log borrow request status change:", logError)
        }
        
        onStatusChange(request.id, newStatus)
        
        // If status is approved, redirect to assets page with category filter
        if (newStatus === "approved" && request.asset_type) {
          onClose() // Close the modal first
          // Navigate to assets page with category filter
          navigate(`/dashboard/inventory/assets?category=${request.asset_type}&fromBorrowRequest=${request.id}`)
        }
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <Boxes className="size-5 text-red-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Borrow Request Details</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Status Badge */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wide bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                Borrow Request
              </span>
              <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wide ${sc.bg} ${sc.text}`}>
                {request.status?.replace("_", " ")}
              </span>
            </div>

            {/* Status Update Actions */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-[5px] border border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {["pending","approved","rejected"].map(s => (
                  <button
                    key={s}
                    disabled={updating || request.status === s}
                    onClick={() => handleStatus(s)}
                    className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wide border transition-opacity disabled:opacity-40 cursor-pointer
                      ${STATUS_COLORS[s]?.bg} ${STATUS_COLORS[s]?.text} ${STATUS_COLORS[s]?.border}`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Details Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Requester Information</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-zinc-200 dark:border-zinc-700 rounded-[5px] overflow-hidden">
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 w-1/3 border-r border-zinc-100 dark:border-zinc-800">
                        <User className="size-3.5 inline mr-2" />
                        Full Name
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.full_name || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Mail className="size-3.5 inline mr-2" />
                        Email Address
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.email || "—"}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Building className="size-3.5 inline mr-2" />
                        Department/Office
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.department || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Phone className="size-3.5 inline mr-2" />
                        Contact Number
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.contact_number || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Borrowing Details Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Borrowing Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-zinc-200 dark:border-zinc-700 rounded-[5px] overflow-hidden">
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 w-1/3 border-r border-zinc-100 dark:border-zinc-800">
                        <Package className="size-3.5 inline mr-2" />
                        Asset Type Needed
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{getAssetTypeLabel(request.asset_type) || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <FileText className="size-3.5 inline mr-2" />
                        Preferred Brand/Model
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.preferred_brand || "Any available"}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Hash className="size-3.5 inline mr-2" />
                        Quantity
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.quantity || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Package className="size-3.5 inline mr-2" />
                        Asset Availability
                      </td>
                      <td className="px-3 py-2.5">
                        {(() => {
                          // Check if availability columns exist
                          const hasAvailabilityData = request.hasOwnProperty('availability_status')
                          
                          if (!hasAvailabilityData) {
                            return (
                              <div>
                                <div className="text-gray-600 dark:text-gray-400 mb-1">
                                  📋 Availability not checked yet
                                </div>
                                <div className="text-xs text-gray-500">
                                  Click "Check Availability" button to verify asset availability
                                </div>
                              </div>
                            )
                          }
                          
                          const status = request.availability_status
                          const count = request.available_count || 0
                          const requested = request.quantity || 0
                          const details = request.availability_details
                          
                          if (!status || status === 'pending_check') {
                            return (
                              <div className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Checking availability...</span>
                              </div>
                            )
                          }
                          
                          let statusDisplay, color
                          if (status === 'available') {
                            statusDisplay = `✅ Fully Available (${count} assets in stock)`
                            color = "text-green-600 dark:text-green-400"
                          } else if (status === 'partially_available') {
                            statusDisplay = `⚠️ Partially Available (${count} of ${requested} requested)`
                            color = "text-yellow-600 dark:text-yellow-400"
                          } else {
                            statusDisplay = "❌ Not Available (no assets in stock)"
                            color = "text-red-600 dark:text-red-400"
                          }
                          
                          return (
                            <div>
                              <div className={`font-medium ${color} mb-1`}>{statusDisplay}</div>
                              {details?.summary && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">{details.summary}</div>
                              )}
                              {details?.brand_specific_available !== undefined && request.preferred_brand && (
                                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                  {request.preferred_brand}: {details.brand_specific_available} available
                                  {details.brand_match ? " ✅" : " ⚠️"}
                                </div>
                              )}
                              {request.last_availability_check && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Last checked: {fmt(request.last_availability_check)}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <FileText className="size-3.5 inline mr-2" />
                        Purpose / Reason
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.purpose || "—"}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <MapPin className="size-3.5 inline mr-2" />
                        Usage Location
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.usage_location || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <CalendarDays className="size-3.5 inline mr-2" />
                        Borrowing Date
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{fmt(request.borrowing_date)}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Clock className="size-3.5 inline mr-2" />
                        Expected Return Date
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{fmt(request.return_date)}</td>
                    </tr>
                    {request.additional_instructions && (
                      <tr>
                        <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                          <FileText className="size-3.5 inline mr-2" />
                          Additional Instructions
                        </td>
                        <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.additional_instructions}</td>
                      </tr>
                    )}
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Calendar className="size-3.5 inline mr-2" />
                        Submitted Date
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{fmt(request.created_at)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const PAGE_SIZE = 5

export function BorrowRequestPage() {
  const { profile } = useAuth()
  const { navigate } = useRouter()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [assetTypeFilter, setAssetTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  /* ── Fetch borrow requests ──────────────────────────────────── */
  const fetchRequests = async () => {
    setIsLoading(true)
    setError("")
    try {
      // Try with availability columns first, fall back to basic query if they don't exist
      let data, err
      
      try {
        // Try to select with availability columns
        const result = await supabase
          .from("asset_requests")
          .select(`
            *,
            availability_status,
            availability_details,
            available_count,
            last_availability_check
          `)
          .eq("request_type", "borrow_request")
          .order("created_at", { ascending: false })
        
        data = result.data
        err = result.error
      } catch (availabilityError) {
        console.warn('Availability columns not found, falling back to basic query')
        // Fall back to basic query without availability columns
        const result = await supabase
          .from("asset_requests")
          .select("*")
          .eq("request_type", "borrow_request")
          .order("created_at", { ascending: false })
        
        data = result.data
        err = result.error
      }

      if (err) throw err
      setRequests(data ?? [])
      
      // Check for requests that need availability updates (only if columns exist)
      const hasAvailabilityColumns = data && data.length > 0 && data[0].hasOwnProperty('availability_status')
      if (hasAvailabilityColumns) {
        const needsCheck = data?.filter(r => 
          !r.availability_status || 
          r.availability_status === 'pending_check' ||
          !r.last_availability_check ||
          new Date(r.last_availability_check) < new Date(Date.now() - 60 * 60 * 1000) // 1 hour old
        ) ?? []
        
        if (needsCheck.length > 0) {
          // Update availability for requests that need it
          setTimeout(() => updateAvailability(), 1000)
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  /* ── Availability Check ──────────────────────────────── */
  const updateAvailability = async () => {
    try {
      // Use a simpler approach - check each request individually
      const requestsToCheck = requests.filter(r => 
        r.request_type === 'borrow_request' && 
        (!r.availability_status || r.availability_status === 'pending_check')
      )
      
      if (requestsToCheck.length === 0) {
        console.log('No requests need availability checking')
        return
      }
      
      console.log('Checking availability for', requestsToCheck.length, 'requests')
      
      // Check availability for each request
      for (const request of requestsToCheck) {
        try {
          const { data, error } = await supabase.rpc('simple_check_asset_availability', {
            request_id: request.id
          })
          
          if (error) {
            console.warn('Failed to check availability for request', request.id, ':', error)
          } else {
            console.log('Updated availability for request', request.id, ':', data)
          }
        } catch (err) {
          console.warn('Error checking availability for request', request.id, ':', err)
        }
      }
      
      // Refresh the data after checking
      setTimeout(() => fetchRequests(), 2000)
    } catch (err) {
      console.warn('Availability update error:', err)
    }
  }

  /* ── Filter ──────────────────────────────────────────── */
  const filtered = requests.filter(r => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q)
    const matchAssetType = assetTypeFilter === "all" || r.asset_type === assetTypeFilter
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchAssetType && matchStatus
  })

  // Reset to page 1 whenever filters/search change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, assetTypeFilter, statusFilter])

  /* ── Pagination ──────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  /* ── Stats ───────────────────────────────────────────── */
  const stats = {
    total:       requests.length,
    pending:     requests.filter(r => r.status === "pending").length,
    approved:    requests.filter(r => r.status === "approved").length,
    rejected:    requests.filter(r => r.status === "rejected").length,
  }

  /* ── Stat card click: toggle status filter ───────────── */
  const handleStatClick = (key) => {
    const newFilter = key === "total" ? "all" : key
    setStatusFilter(prev => prev === newFilter ? "all" : newFilter)
  }

  const handleStatusChange = (id, newStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    if (selectedRequest?.id === id) setSelectedRequest(prev => ({ ...prev, status: newStatus }))
  }

  return (
    <InventoryStaffLayout activeTab="borrow-request">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Page Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Borrow Requests
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage equipment borrow requests submitted via QR form
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-[5px] text-xs h-9 gap-1.5"
              onClick={fetchRequests}
              disabled={isLoading}
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="rounded-[5px] text-xs h-9 gap-1.5"
              onClick={updateAvailability}
              disabled={isLoading}
            >
              <Package className="size-3.5" />
              Check Availability
            </Button>
            <Button
              variant="brand"
              className="rounded-[5px] text-xs h-9 gap-1.5"
              onClick={() => setShowQRModal(true)}
            >
              <QrCode className="size-3.5" />
              Show QR Code
            </Button>
          </div>
        </div>
        {/* ── Stats Cards (clickable filters) ───────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "total",       label: "Total",       value: stats.total,       color: "text-zinc-900 dark:text-zinc-100",          ring: "ring-zinc-400" },
            { key: "pending",     label: "Pending",     value: stats.pending,     color: "text-yellow-600 dark:text-yellow-400",      ring: "ring-yellow-400" },
            { key: "approved",    label: "Approved",    value: stats.approved,    color: "text-green-600 dark:text-green-400",        ring: "ring-green-400" },
            { key: "rejected",    label: "Rejected",    value: stats.rejected,    color: "text-red-600 dark:text-red-400",            ring: "ring-red-400" },
          ].map(({ key, label, value, color, ring }) => {
            const isActive = key === "total" ? statusFilter === "all" : statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStatClick(key)}
                className={`rounded-[5px] border bg-white dark:bg-zinc-900 p-3 text-center w-full transition-all cursor-pointer
                  hover:shadow-md active:scale-95
                  ${ isActive
                    ? `ring-2 ${ring} shadow-sm border-transparent`
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
              >
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className={`text-xs mt-0.5 font-medium ${ isActive ? "text-foreground" : "text-muted-foreground" }`}>{label}</p>
              </button>
            )
          })}
        </div>
        {/* ── QR Code Showcase Card ─────────────────────── */}
        <Card className="rounded-[5px] border-2 border-dashed border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <button
                onClick={() => setShowQRModal(true)}
                className="flex-shrink-0 p-3 bg-white dark:bg-zinc-900 rounded-[5px] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <QrCode className="size-16 text-zinc-800 dark:text-zinc-200 group-hover:text-red-600 transition-colors" />
              </button>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">Borrow Request via QR Code</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                  Display or print this QR code so faculty and staff can scan it to submit equipment borrow requests with borrowing periods and asset selection — no app needed.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {ASSET_TYPES.slice(0, 4).map(({ label }) => (
                    <span key={label} className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-[5px]">
                      <Package className="size-3" />
                      {label}
                    </span>
                  ))}
                  <span className="text-[11px] text-zinc-400">+{ASSET_TYPES.length - 4} more</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-[5px] text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Filters ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <Input
              placeholder="Search by name, email, department, purpose…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs rounded-[5px]"
            />
          </div>
          <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
            <SelectTrigger className="h-9 text-xs rounded-[5px] w-full sm:w-44">
              <SelectValue placeholder="All Asset Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Asset Types</SelectItem>
              {ASSET_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-[5px] w-full sm:w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["pending","approved","rejected"].map(s => (
                <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* ── Table ─────────────────────────────────────── */}
        <Card className="rounded-[5px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  {["Submitted","Requester","Asset Type","Quantity","Availability","Borrow Period","Status",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="size-6 animate-spin mx-auto text-zinc-400" />
                      <p className="text-zinc-400 mt-2">Loading borrow requests…</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Boxes className="size-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-zinc-400 text-sm">No borrow requests found</p>
                      <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">
                        Share the QR code for faculty to submit equipment borrow requests
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(r => {
                    const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending
                    const borrowPeriod = r.borrowing_date && r.return_date 
                      ? `${fmt(r.borrowing_date)} - ${fmt(r.return_date)}`
                      : "—"
                    return (
                      <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmt(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200">{r.full_name || "—"}</p>
                            <p className="text-[11px] text-zinc-400">{r.email || "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                            {getAssetTypeLabel(r.asset_type) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.quantity || "—"}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            // Check if availability columns exist
                            const hasAvailabilityData = r.hasOwnProperty('availability_status')
                            
                            if (!hasAvailabilityData) {
                              return (
                                <div className="flex items-center gap-1.5">
                                  <div className="size-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                  <span className="text-xs text-gray-500">Not checked</span>
                                </div>
                              )
                            }
                            
                            const status = r.availability_status
                            const count = r.available_count || 0
                            const requested = r.quantity || 0
                            
                            if (!status || status === 'pending_check') {
                              return (
                                <div className="flex items-center gap-1.5">
                                  <Loader2 className="size-3 animate-spin text-gray-400" />
                                  <span className="text-xs text-gray-500">Checking...</span>
                                </div>
                              )
                            }
                            
                            let color, icon, text
                            if (status === 'available') {
                              color = "text-green-600 dark:text-green-400"
                              icon = <CheckCircle2 className="size-3" />
                              text = `✅ Available (${count})`
                            } else if (status === 'partially_available') {
                              color = "text-yellow-600 dark:text-yellow-400"  
                              icon = <AlertCircle className="size-3" />
                              text = `⚠️ Partial (${count}/${requested})`
                            } else {
                              color = "text-red-600 dark:text-red-400"
                              icon = <X className="size-3" />
                              text = "❌ Not Available"
                            }
                            
                            return (
                              <div className={`flex items-center gap-1.5 ${color}`}>
                                {icon}
                                <span className="text-xs font-medium">{text}</span>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{borrowPeriod}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {r.status?.replace("_"," ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-[5px] text-xs h-7 px-2.5"
                            onClick={() => setSelectedRequest(r)}
                          >
                            <Eye className="size-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* ── Pagination ──────────────────────────────── */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-[5px]"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, idx) => (
                  <Button
                    key={idx}
                    variant={currentPage === idx + 1 ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-[5px] text-xs"
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-[5px]"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Modals ──────────────────────────────────── */}
        <QRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
        <BorrowRequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </InventoryStaffLayout>
  )
}