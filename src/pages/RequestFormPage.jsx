import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Package,
  ChevronDown,
  Send,
  Search,
  Info,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const REQUEST_TYPES = [
  { value: "asset_request", label: "Asset Request",  desc: "Request a new device or equipment" },
  { value: "repair",        label: "Repair",          desc: "Report a broken or malfunctioning item" },
  { value: "replacement",   label: "Replacement",     desc: "Replace a damaged or end-of-life asset" },
  { value: "pullout",       label: "Pull-out",         desc: "Request removal of an asset from location" },
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

const EMPTY = {
  request_type:   "",
  full_name:      "",
  email:          "",
  contact_number: "",
  location:       "",
  preferred_date: "",
  asset_details:  "",
  description:    "",
}

/* ── Floating label input ─────────────────────────────── */
function Field({ id, label, required, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ id, type = "text", value, onChange, placeholder, required }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
    />
  )
}

function TextArea({ id, value, onChange, placeholder, rows = 3, required }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="w-full px-3 py-2 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors resize-none"
    />
  )
}

function SelectInput({ id, value, onChange, required, children }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-10 px-3 pr-8 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors appearance-none cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC REQUEST FORM PAGE
═══════════════════════════════════════════════════════════ */
export function RequestFormPage() {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })

  // Email lookup state
  const [emailLookupLoading, setEmailLookupLoading] = useState(false)
  const [foundAssets, setFoundAssets] = useState([]) // [{tag, name, category, brand, model, type, location}]
  const [lookupDone, setLookupDone] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  /* ── Lookup assets by email on blur ──────────────────── */
  const handleEmailLookup = useCallback(async (emailValue) => {
    const email = emailValue.trim().toLowerCase()
    if (!email || !email.includes("@")) return

    setEmailLookupLoading(true)
    setFoundAssets([])
    setLookupDone(false)

    try {
      // Query asset_assignments (permanent assignments)
      const { data: assigned } = await supabase
        .from("asset_assignments")
        .select(`
          assignee_name,
          assignee_department,
          assignment_location,
          assets ( asset_tag, name, category, brand, model )
        `)
        .eq("assignee_email", email)
        .eq("status", "active")

      // Query asset_borrowing (temporary borrows)
      const { data: borrowed } = await supabase
        .from("asset_borrowing")
        .select(`
          borrower_name,
          borrower_department,
          borrow_location,
          assets ( asset_tag, name, category, brand, model )
        `)
        .eq("borrower_email", email)
        .eq("status", "active")

      const allAssets = [
        ...(assigned || []).map(r => ({
          name:     r.assets?.name     || "Unknown Asset",
          tag:      r.assets?.asset_tag || "",
          category: r.assets?.category || "",
          brand:    r.assets?.brand    || "",
          model:    r.assets?.model    || "",
          type:     "Assigned",
          location: r.assignment_location || r.assignee_department || "",
          personName: r.assignee_name,
          department: r.assignee_department,
        })),
        ...(borrowed || []).map(r => ({
          name:     r.assets?.name     || "Unknown Asset",
          tag:      r.assets?.asset_tag || "",
          category: r.assets?.category || "",
          brand:    r.assets?.brand    || "",
          model:    r.assets?.model    || "",
          type:     "Borrowed",
          location: r.borrow_location  || r.borrower_department || "",
          personName: r.borrower_name,
          department: r.borrower_department,
        })),
      ]

      setFoundAssets(allAssets)
      setLookupDone(true)

      if (allAssets.length > 0) {
        const first = allAssets[0]
        // Auto-fill name if empty
        if (!form.full_name && first.personName)
          setForm(prev => ({ ...prev, full_name: first.personName }))

        // Auto-fill location from the first asset's location if empty
        if (!form.location && first.location)
          setForm(prev => ({ ...prev, location: first.location || first.department || "" }))

        // Auto-fill asset details summary
        const assetSummary = allAssets
          .map(a => `${a.name}${a.tag ? " (" + a.tag + ")" : ""}${a.brand ? " - " + a.brand : ""}${a.model ? " " + a.model : ""}`.trim())
          .join("; ")
        if (!form.asset_details)
          setForm(prev => ({ ...prev, asset_details: assetSummary }))
      }
    } catch (err) {
      console.error("Email lookup error:", err)
      setLookupDone(true)
    } finally {
      setEmailLookupLoading(false)
    }
  }, [form.full_name, form.location, form.asset_details])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.request_type) {
      setStatus({ type: "error", message: "Please select a request type." })
      return
    }

    setLoading(true)
    setStatus({ type: null, message: "" })

    try {
      const { error } = await supabase.from("asset_requests").insert([{
        request_type:   form.request_type,
        full_name:      form.full_name.trim(),
        email:          form.email.trim().toLowerCase(),
        contact_number: form.contact_number.trim(),
        location:       form.location,
        preferred_date: form.preferred_date,
        asset_details:  form.asset_details.trim(),
        description:    form.description.trim(),
        status:         "pending",
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }])

      if (error) throw error

      setStatus({
        type: "success",
        message: "Your request has been submitted! The IT team will review it and get back to you.",
      })
      setForm(EMPTY)
      setFoundAssets([])
      setLookupDone(false)
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Submission failed. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-6 text-center">
        <div className="inline-flex items-center justify-center size-14 rounded-[5px] bg-red-700 shadow-lg mb-3">
          <ClipboardList className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">ITAMS Request Form</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Submit asset requests, repairs, replacements, or pull-outs to the IT team
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="rounded-[5px] shadow-xl border border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-6 sm:p-8 space-y-5">

            {/* Status Banners */}
            <AnimatePresence mode="wait">
              {status.type === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-[5px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
                    <CheckCircle2 className="size-5 shrink-0 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-green-800 dark:text-green-300">Request Submitted!</p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{status.message}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {status.type === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-[5px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                    <p className="text-xs font-medium text-red-800 dark:text-red-300">{status.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Request Type */}
              <Field id="request_type" label="Request Type" required>
                <SelectInput id="request_type" value={form.request_type} onChange={set("request_type")} required>
                  {REQUEST_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                  ))}
                </SelectInput>
              </Field>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Personal Information</p>
                <div className="space-y-4">
                  <Field id="full_name" label="Full Name" required>
                    <TextInput id="full_name" value={form.full_name} onChange={set("full_name")} placeholder="Juan dela Cruz" required />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="email" label="Email Address" required>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={set("email")}
                          onBlur={(e) => handleEmailLookup(e.target.value)}
                          placeholder="juan@itams.edu"
                          required
                          className="w-full h-10 px-3 pr-8 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
                        />
                        {emailLookupLoading && (
                          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 animate-spin" />
                        )}
                        {!emailLookupLoading && lookupDone && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            {foundAssets.length > 0
                              ? <CheckCircle2 className="size-4 text-green-500" />
                              : <Info className="size-4 text-zinc-400" />}
                          </span>
                        )}
                      </div>
                    </Field>
                    <Field id="contact_number" label="Contact Number" required>
                      <TextInput id="contact_number" type="tel" value={form.contact_number} onChange={set("contact_number")} placeholder="09xx-xxx-xxxx" required />
                    </Field>
                  </div>

                  {/* Found assets panel */}
                  <AnimatePresence>
                    {lookupDone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {foundAssets.length > 0 ? (
                          <div className="rounded-[5px] bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                                {foundAssets.length} asset{foundAssets.length > 1 ? "s" : ""} found under this email — details auto-filled below
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              {foundAssets.map((a, i) => (
                                <div key={i} className="flex items-start gap-2 bg-white dark:bg-zinc-800 rounded border border-blue-100 dark:border-blue-900/50 px-2.5 py-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{a.name}</p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                      {[a.brand, a.model, a.tag ? `SN: ${a.tag}` : ""].filter(Boolean).join(" · ")}
                                    </p>
                                  </div>
                                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    a.type === "Assigned"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                      : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                                  }`}>{a.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[5px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 flex items-center gap-2">
                            <Info className="size-4 text-zinc-400 shrink-0" />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              No active assigned or borrowed assets found for this email. You can still fill in the details manually.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Request Details</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="location" label="Location / Department" required>
                      <TextInput id="location" value={form.location} onChange={set("location")} placeholder="e.g. CITE Faculty" required />
                    </Field>
                    <Field id="preferred_date" label="Preferred Date" required>
                      <TextInput
                        id="preferred_date"
                        type="date"
                        value={form.preferred_date}
                        onChange={set("preferred_date")}
                        placeholder=""
                        required
                      />
                    </Field>
                  </div>
                  <Field id="asset_details" label="Asset / Item Details" required>
                    <TextInput id="asset_details" value={form.asset_details} onChange={set("asset_details")} placeholder="e.g.Laptop" required />
                  </Field>
                  <Field id="description" label="Description / Reason (Optional)">
                    <TextArea
                      id="description"
                      value={form.description}
                      onChange={set("description")}
                      placeholder="Please describe the issue or reason for this request in detail…"
                      rows={4}
                    />
                  </Field>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }} className="pt-1">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full h-11 text-sm font-semibold rounded-[5px] gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="size-4" /> Submit Request</>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">
              ITAMS · IT and Asset Management System
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RequestFormPage
