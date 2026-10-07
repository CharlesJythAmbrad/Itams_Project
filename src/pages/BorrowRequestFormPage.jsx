import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Boxes,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Package,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Send,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

const DEPARTMENTS = [
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

const EMPTY_FORM = {
  full_name: "",
  email: "",
  department: "",
  contact_number: "",
  asset_type: "",
  preferred_brand: "",
  quantity: "1",
  purpose: "",
  usage_location: "",
  borrowing_date: "",
  return_date: "",
  additional_instructions: "",
}

/* ── Form Components ─────────────────────────────────── */
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

function TextInput({ id, type = "text", value, onChange, placeholder, required, min, max }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
    />
  )
}

function SelectInput({ id, value, onChange, required, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full h-10 px-3 rounded-[5px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
    >
      {children}
    </select>
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

/* ── Main Page Component ──────────────────────────────── */
export function BorrowRequestFormPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: "" })

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (status.type) setStatus({ type: null, message: "" })
  }

  // Form validation
  const validateForm = () => {
    const required = [
      'full_name', 'email', 'department', 'contact_number', 
      'asset_type', 'quantity', 'purpose', 'usage_location', 
      'borrowing_date', 'return_date'
    ]
    
    for (const field of required) {
      if (!form[field]?.trim()) {
        setStatus({
          type: "error",
          message: `Please fill in all required fields. Missing: ${field.replace('_', ' ')}`
        })
        return false
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setStatus({ type: "error", message: "Please enter a valid email address" })
      return false
    }

    // Date validation
    const borrowDate = new Date(form.borrowing_date)
    const returnDate = new Date(form.return_date)
    const today = new Date()
    
    if (borrowDate < today.setHours(0,0,0,0)) {
      setStatus({ type: "error", message: "Borrowing date cannot be in the past" })
      return false
    }
    
    if (returnDate <= borrowDate) {
      setStatus({ type: "error", message: "Return date must be after borrowing date" })
      return false
    }

    // Quantity validation
    const qty = parseInt(form.quantity)
    if (qty < 1 || qty > 10) {
      setStatus({ type: "error", message: "Quantity must be between 1 and 10" })
      return false
    }

    return true
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setStatus({ type: null, message: "" })

    try {
      const requestData = {
        request_type: "borrow_request",
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department,
        contact_number: form.contact_number.trim(),
        asset_type: form.asset_type,
        preferred_brand: form.preferred_brand.trim() || null,
        quantity: parseInt(form.quantity),
        purpose: form.purpose.trim(),
        usage_location: form.usage_location.trim(),
        borrowing_date: form.borrowing_date,
        return_date: form.return_date,
        additional_instructions: form.additional_instructions.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("asset_requests").insert([requestData])

      if (error) throw error

      setStatus({
        type: "success",
        message: "Borrow request submitted successfully! The IT team will review and contact you with available assets.",
      })
      
      // Reset form
      setForm(EMPTY_FORM)
      
    } catch (err) {
      console.error("Error submitting borrow request:", err)
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
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <div className="inline-flex items-center justify-center size-14 rounded-[5px] bg-red-700 shadow-lg mb-3">
          <Boxes className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Equipment Borrow Request
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Submit a request to temporarily borrow equipment from IT inventory
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="rounded-[5px] shadow-xl border border-zinc-200/90 dark:border-zinc-800">
          <CardContent className="p-6 sm:p-8 space-y-5">

            {/* Status Messages */}
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
                      <p className="font-semibold text-sm text-green-800 dark:text-green-300">Success!</p>
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

              {/* Requester Information */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                  Requester Information
                </p>
                <div className="space-y-4">
                  <Field id="full_name" label="Full Name" required>
                    <TextInput 
                      id="full_name" 
                      value={form.full_name} 
                      onChange={set("full_name")} 
                      placeholder="Juan dela Cruz" 
                      required 
                    />
                  </Field>
                  
                  <Field id="email" label="Email" required>
                    <TextInput 
                      id="email" 
                      type="email" 
                      value={form.email} 
                      onChange={set("email")} 
                      placeholder="juan@example.com" 
                      required 
                    />
                  </Field>
                  
                  <Field id="department" label="Department/Office" required>
                    <SelectInput id="department" value={form.department} onChange={set("department")} required>
                      <option value="">— Select department/office —</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field id="contact_number" label="Contact Number" required>
                    <TextInput 
                      id="contact_number" 
                      type="tel" 
                      value={form.contact_number} 
                      onChange={set("contact_number")} 
                      placeholder="09xx-xxx-xxxx" 
                      required 
                    />
                  </Field>
                </div>
              </div>

              {/* Borrowing Details */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                  Borrowing Details
                </p>
                <div className="space-y-4">
                  
                  <Field id="asset_type" label="Asset Type Needed" required>
                    <SelectInput id="asset_type" value={form.asset_type} onChange={set("asset_type")} required>
                      <option value="">— Select asset type —</option>
                      {ASSET_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field id="preferred_brand" label="Preferred Brand/Model">
                    <TextInput 
                      id="preferred_brand" 
                      value={form.preferred_brand} 
                      onChange={set("preferred_brand")} 
                      placeholder="e.g. Dell Latitude, Any available" 
                    />
                  </Field>
                  
                  <Field id="quantity" label="Quantity" required>
                    <TextInput 
                      id="quantity" 
                      type="number" 
                      min="1" 
                      max="10"
                      value={form.quantity} 
                      onChange={set("quantity")} 
                      placeholder="1" 
                      required 
                    />
                  </Field>
                  
                  <Field id="purpose" label="Purpose / Reason" required>
                    <TextInput 
                      id="purpose" 
                      value={form.purpose} 
                      onChange={set("purpose")} 
                      placeholder="e.g. Training workshop, Conference presentation" 
                      required 
                    />
                  </Field>
                  
                  <Field id="usage_location" label="Location / Where it will be used" required>
                    <TextInput 
                      id="usage_location" 
                      value={form.usage_location} 
                      onChange={set("usage_location")} 
                      placeholder="e.g. CL2, Medical Faculty, Conference Room" 
                      required 
                    />
                  </Field>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="borrowing_date" label="Borrowing Date" required>
                      <TextInput
                        id="borrowing_date"
                        type="date"
                        value={form.borrowing_date}
                        onChange={set("borrowing_date")}
                        required
                      />
                    </Field>
                    <Field id="return_date" label="Expected Return Date" required>
                      <TextInput
                        id="return_date"
                        type="date"
                        value={form.return_date}
                        onChange={set("return_date")}
                        required
                      />
                    </Field>
                  </div>
                  
                  <Field id="additional_instructions" label="Additional Instructions">
                    <TextArea
                      id="additional_instructions"
                      value={form.additional_instructions}
                      onChange={set("additional_instructions")}
                      placeholder="Any special requirements, setup instructions, or notes..."
                      rows={3}
                    />
                  </Field>
                </div>
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.985 }} className="pt-1">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full h-11 text-sm font-semibold rounded-[5px] gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Submitting Request…</>
                  ) : (
                    <><Send className="size-4" /> Submit Borrow Request</>
                  )}
                </Button>
              </motion.div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}