import React, { useState, useEffect, useRef } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { logActivity } from "@/utils/activityLogger"
import { motion, AnimatePresence } from "framer-motion"
import {
  QrCode,
  ClipboardList,
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
  Wrench,
  Package,
  ArrowRightLeft,
  Truck,
  Search,
  Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import QRCode from "qrcode"

/* ─── Constants ─────────────────────────────────────────── */
const REQUEST_TYPES = [
  { value: "asset_request",  label: "Asset Request",  icon: Package,        color: "blue" },
  { value: "repair",         label: "Repair",          icon: Wrench,         color: "orange" },
  { value: "replacement",    label: "Replacement",     icon: ArrowRightLeft, color: "purple" },
  { value: "pullout",        label: "Pull-out",        icon: Truck,          color: "red" },
]

const LOCATIONS = [
  "CITE Faculty",
  "CITE Laboratory 1",
  "CITE Laboratory 2",
  "CITE Laboratory 3",
  "CITE Dean's Office",
  "Medical Faculty & Operations",
  "Nursing Department",
  "Library",
  "Registrar's Office",
  "Finance Office",
  "HR Department",
  "Guidance Office",
  "Student Affairs Office",
  "Maintenance Office",
  "Security Office",
  "Other",
]

const STATUS_COLORS = {
  pending:    { bg: "bg-yellow-100 dark:bg-yellow-950/40",  text: "text-yellow-800 dark:text-yellow-300",  border: "border-yellow-200 dark:border-yellow-800" },
  approved:   { bg: "bg-green-100 dark:bg-green-950/40",   text: "text-green-800 dark:text-green-300",    border: "border-green-200 dark:border-green-800" },
  in_progress:{ bg: "bg-blue-100 dark:bg-blue-950/40",     text: "text-blue-800 dark:text-blue-300",      border: "border-blue-200 dark:border-blue-800" },
  completed:  { bg: "bg-emerald-100 dark:bg-emerald-950/40",text: "text-emerald-800 dark:text-emerald-300",border: "border-emerald-200 dark:border-emerald-800" },
  rejected:   { bg: "bg-red-100 dark:bg-red-950/40",       text: "text-red-800 dark:text-red-300",        border: "border-red-200 dark:border-red-800" },
}

const TYPE_STYLE = {
  asset_request: { bg: "bg-blue-100 dark:bg-blue-950/40",    text: "text-blue-800 dark:text-blue-300" },
  repair:        { bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-800 dark:text-orange-300" },
  replacement:   { bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-800 dark:text-purple-300" },
  pullout:       { bg: "bg-red-100 dark:bg-red-950/40",       text: "text-red-800 dark:text-red-300" },
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"
const fmtType = (t) => REQUEST_TYPES.find(r => r.value === t)?.label ?? t

/* ═══════════════════════════════════════════════════════════
   QR MODAL – shows the scannable QR code
═══════════════════════════════════════════════════════════ */
function QRModal({ isOpen, onClose }) {
  const canvasRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState("")

  const formUrl = `${window.location.origin}/request-form`

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
    a.download = "itams-request-qr.png"
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
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Scan to Submit a Request</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>

          {/* QR */}
          <div className="p-6 flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-[5px] border-2 border-zinc-200 dark:border-zinc-700 shadow-inner">
                <img src={qrDataUrl} alt="Request Form QR Code" className="size-64" />
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
   REQUEST DETAIL MODAL
═══════════════════════════════════════════════════════════ */
function RequestDetailModal({ request, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  if (!request) return null

  const type = REQUEST_TYPES.find(r => r.value === request.request_type)
  const TypeIcon = type?.icon ?? FileText
  const sc = STATUS_COLORS[request.status] ?? STATUS_COLORS.pending
  const tc = TYPE_STYLE[request.request_type] ?? {}

  const handleStatus = async (newStatus) => {
    // If rejecting, show the rejection reason modal
    if (newStatus === 'rejected') {
      setShowRejectModal(true)
      return
    }
    
    await updateRequestStatus(newStatus)
  }
  
  const updateRequestStatus = async (newStatus, reason = null) => {
    setUpdating(true)
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Add rejection reason if provided
      if (newStatus === 'rejected' && reason) {
        updateData.rejection_reason = reason
      }
      
      const { error } = await supabase
        .from("asset_requests")
        .update(updateData)
        .eq("id", request.id)
      
      if (!error) {
        // Log the activity
        try {
          await logActivity({
            action: 'update',
            resourceType: 'service_request',
            resourceId: request.id,
            resourceName: `Service Request - ${request.full_name || 'Unknown'}`,
            description: `Updated service request status from ${request.status} to ${newStatus}${reason ? ` (Reason: ${reason})` : ''}`,
            metadata: {
              previous_status: request.status,
              new_status: newStatus,
              request_type: request.request_type,
              requester: request.full_name || request.contact_email,
              description: request.description,
              rejection_reason: reason
            }
          })
        } catch (logError) {
          console.warn("Failed to log service request status change:", logError)
        }
        
        onStatusChange(request.id, newStatus)
      }
    } finally {
      setUpdating(false)
    }
  }
  
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      return // Require a reason
    }
    
    await updateRequestStatus('rejected', rejectionReason.trim())
    setShowRejectModal(false)
    setRejectionReason("")
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
          className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <TypeIcon className="size-5 text-red-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Request Details</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wide ${tc.bg} ${tc.text}`}>
                {fmtType(request.request_type)}
              </span>
              <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wide ${sc.bg} ${sc.text}`}>
                {request.status?.replace("_", " ")}
              </span>
            </div>

            {/* Request Details Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Request Information</h4>
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
                        <Phone className="size-3.5 inline mr-2" />
                        Contact Number
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.contact_number || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <MapPin className="size-3.5 inline mr-2" />
                        Location / Department
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.location || "—"}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Calendar className="size-3.5 inline mr-2" />
                        Preferred Date
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{fmt(request.preferred_date)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <FileText className="size-3.5 inline mr-2" />
                        Description
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.description || "—"}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Package className="size-3.5 inline mr-2" />
                        Asset Details
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{request.asset_details || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                        <Calendar className="size-3.5 inline mr-2" />
                        Submitted Date
                      </td>
                      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{fmt(request.created_at)}</td>
                    </tr>
                    {/* Show rejection reason if rejected */}
                    {request.status === 'rejected' && request.rejection_reason && (
                      <tr className="bg-red-50/50 dark:bg-red-950/20">
                        <td className="px-3 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                          <AlertCircle className="size-3.5 inline mr-2" />
                          Rejection Reason
                        </td>
                        <td className="px-3 py-2.5 text-red-600 dark:text-red-400">
                          <div className="p-2 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-sm">
                            {request.rejection_reason}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Actions */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {["pending","approved","in_progress","completed","rejected"].map(s => (
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
          </div>
        </motion.div>
      </motion.div>
      
      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-red-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Reject Request</h3>
              </div>
              <button 
                onClick={() => setShowRejectModal(false)} 
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Please provide a reason for rejecting this service request:
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-transparent resize-none"
                rows={3}
                required
              />
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={updating}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={updating || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Request'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const PAGE_SIZE = 5

export function RequestsPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false)
  const [selectedRejectReason, setSelectedRejectReason] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  /* ── Fetch requests ──────────────────────────────────── */
  const fetchRequests = async () => {
    setIsLoading(true)
    setError("")
    try {
      const { data, error: err } = await supabase
        .from("asset_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (err) throw err
      setRequests(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  /* ── Filter ──────────────────────────────────────────── */
  const filtered = requests.filter(r => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    const matchType   = typeFilter === "all"   || r.request_type === typeFilter
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  // Reset to page 1 whenever filters/search change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, typeFilter, statusFilter])

  /* ── Pagination ──────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  /* ── Stats ───────────────────────────────────────────── */
  const stats = {
    total:       requests.length,
    pending:     requests.filter(r => r.status === "pending").length,
    approved:    requests.filter(r => r.status === "approved").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed:   requests.filter(r => r.status === "completed").length,
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
    <InventoryStaffLayout activeTab="requests">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Page Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Requests
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage asset requests submitted via QR form
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "total",       label: "Total",       value: stats.total,       color: "text-zinc-900 dark:text-zinc-100",          ring: "ring-zinc-400" },
            { key: "pending",     label: "Pending",     value: stats.pending,     color: "text-yellow-600 dark:text-yellow-400",      ring: "ring-yellow-400" },
            { key: "approved",    label: "Approved",    value: stats.approved,    color: "text-green-600 dark:text-green-400",        ring: "ring-green-400" },
            { key: "in_progress", label: "In Progress", value: stats.in_progress, color: "text-blue-600 dark:text-blue-400",          ring: "ring-blue-400" },
            { key: "completed",   label: "Completed",   value: stats.completed,   color: "text-emerald-600 dark:text-emerald-400",    ring: "ring-emerald-400" },
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
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">Request via QR Code</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                  Display or print this QR code so faculty and staff can scan it to submit asset requests, repairs, replacements, or pull-outs — no app needed.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {REQUEST_TYPES.map(({ label, icon: Icon }) => (
                    <span key={label} className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-[5px]">
                      <Icon className="size-3" />
                      {label}
                    </span>
                  ))}
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
              placeholder="Search by name, email, location…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs rounded-[5px]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs rounded-[5px] w-full sm:w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {REQUEST_TYPES.map(t => (
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
              {["pending","approved","in_progress","completed","rejected"].map(s => (
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
                  {(() => {
                    // Base headers
                    const headers = ["Submitted","Requester","Type","Location","Preferred Date","Status"]
                    // Add rejection reason header only if there are rejected requests
                    const hasRejected = filtered.some(r => r.status === 'rejected')
                    if (hasRejected) {
                      headers.push("Rejection Reason")
                    }
                    headers.push("") // Actions column
                    return headers.map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))
                  })()}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={filtered.some(r => r.status === 'rejected') ? 8 : 7} className="px-4 py-12 text-center">
                      <Loader2 className="size-6 animate-spin mx-auto text-zinc-400" />
                      <p className="text-zinc-400 mt-2">Loading requests…</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={filtered.some(r => r.status === 'rejected') ? 8 : 7} className="px-4 py-12 text-center">
                      <ClipboardList className="size-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-zinc-400 text-sm">No requests found</p>
                      <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">
                        Share the QR code for faculty to submit requests
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(r => {
                    const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending
                    const tc = TYPE_STYLE[r.request_type] ?? {}
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
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${tc.bg} ${tc.text}`}>
                            {fmtType(r.request_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.location || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmt(r.preferred_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {r.status?.replace("_"," ")}
                          </span>
                        </td>
                        {/* Show rejection reason column only if there are rejected requests */}
                        {filtered.some(req => req.status === 'rejected') && (
                          <td className="px-4 py-3">
                            {r.status === 'rejected' && r.rejection_reason ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-[5px] text-xs h-7 px-2.5"
                                onClick={() => {
                                  setSelectedRejectReason(r.rejection_reason)
                                  setShowRejectReasonModal(true)
                                }}
                              >
                                View Reason
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        )}
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
                    className={`h-7 w-7 p-0 rounded-[5px] text-xs ${
                      currentPage === idx + 1 ? "bg-red-700 hover:bg-red-800 text-white border-red-700" : ""
                    }`}
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

      </div>

      {/* ── Modals ────────────────────────────────────── */}
      <QRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Rejection Reason Modal */}
      {showRejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-[5px] shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-red-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Rejection Reason</h3>
              </div>
              <button 
                onClick={() => setShowRejectReasonModal(false)} 
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {selectedRejectReason}
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowRejectReasonModal(false)}
                  className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InventoryStaffLayout>
  )
}

export default RequestsPage
