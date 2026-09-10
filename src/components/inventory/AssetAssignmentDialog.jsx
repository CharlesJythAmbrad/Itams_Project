import React, { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  X,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Mail,
  Building,
  Package
} from "lucide-react"

export function AssetAssignmentDialog({ 
  isOpen, 
  onClose, 
  asset, 
  onAssignmentComplete,
  assignmentType = "assign" // "assign" or "borrow"
}) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    // Borrower/Assignee Information
    borrower_name: "",
    borrower_email: "",
    borrower_department: "",
    borrower_employee_id: "",
    borrower_phone: "",
    
    // Assignment Details
    assignment_location: "",
    purpose: "",
    expected_return_date: "",
    special_instructions: "",
    
    // For borrowing specifically
    project_name: "",
    supervisor_name: "",
    supervisor_email: ""
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.borrower_name.trim()) return "Borrower name is required"
    if (!formData.borrower_email.trim()) return "Borrower email is required"
    if (!formData.borrower_department.trim()) return "Department is required"
    if (!formData.assignment_location.trim()) return "Assignment location is required"
    if (!formData.purpose.trim()) return "Purpose/reason is required"
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.borrower_email)) {
      return "Please enter a valid email address"
    }
    
    // For borrowing, require return date
    if (assignmentType === "borrow" && !formData.expected_return_date) {
      return "Expected return date is required for borrowing"
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // First, create the assignment/borrowing record to ensure it works
      // before updating the asset status
      let recordData, tableName;
      
      if (assignmentType === "assign") {
        // For assignments - use asset_assignments table
        tableName = "asset_assignments";
        recordData = {
          asset_id: asset.id,
          assignee_name: formData.borrower_name.trim(),
          assignee_email: formData.borrower_email.trim(),
          assignee_department: formData.borrower_department.trim(),
          assignee_employee_id: formData.borrower_employee_id.trim() || null,
          assignee_phone: formData.borrower_phone.trim() || null,
          assignment_location: formData.assignment_location.trim(),
          purpose: formData.purpose.trim(),
          assignment_reason: "Manual assignment via ITAMS",
          supervisor_name: formData.supervisor_name.trim() || null,
          supervisor_email: formData.supervisor_email.trim() || null,
          special_instructions: formData.special_instructions.trim() || null,
          assigned_by: user?.id,
          status: 'active'
        };
      } else {
        // For borrowing - use asset_borrowing table  
        tableName = "asset_borrowing";
        recordData = {
          asset_id: asset.id,
          borrower_name: formData.borrower_name.trim(),
          borrower_email: formData.borrower_email.trim(),
          borrower_department: formData.borrower_department.trim(),
          borrower_employee_id: formData.borrower_employee_id.trim() || null,
          borrower_phone: formData.borrower_phone.trim() || null,
          borrow_location: formData.assignment_location.trim(),
          purpose: formData.purpose.trim(),
          project_name: formData.project_name.trim() || null,
          expected_return_date: formData.expected_return_date,
          supervisor_name: formData.supervisor_name.trim() || null,
          supervisor_email: formData.supervisor_email.trim() || null,
          special_instructions: formData.special_instructions.trim() || null,
          borrowed_by: user?.id,
          status: 'active'
        };
      }

      // Create the record in the appropriate table FIRST
      console.log(`Creating ${assignmentType} record in ${tableName}:`, recordData)

      const { data: result, error: recordError } = await supabase
        .from(tableName)
        .insert([recordData])
        .select()
        .single()

      if (recordError) {
        console.error(`${assignmentType} creation error:`, recordError)
        
        // Check if it's a schema cache issue
        if (recordError.message.includes("schema cache") || recordError.message.includes("assignee_department") || recordError.message.includes("borrow_location")) {
          throw new Error(`Database tables not ready. Please run the 'create_separate_assignment_borrow_tables.sql' script in your Supabase SQL editor first, then try again. Error: ${recordError.message}`)
        }
        
        throw new Error(`Failed to create ${assignmentType} record: ${recordError.message}`)
      }

      console.log(`${assignmentType} record created successfully:`, result)

      // Only update asset status AFTER successful record creation
      const newStatus = assignmentType === "borrow" ? "allocated" : "deployed"
      
      const { error: updateError } = await supabase
        .from("assets")
        .update({
          status: newStatus,
          assigned_to: null, // We'll store assignment details separately
          updated_by: user?.id
        })
        .eq("id", asset.id)

      if (updateError) {
        console.error("Asset update error:", updateError)
        
        // If asset update fails, we should delete the record we just created
        await supabase.from(tableName).delete().eq("id", result.id)
        
        throw new Error(`Failed to update asset status: ${updateError.message}`)
      }

      console.log("Asset status updated successfully")

      // Reset form and close dialog
      setFormData({
        borrower_name: "", borrower_email: "", borrower_department: "",
        borrower_employee_id: "", borrower_phone: "", assignment_location: "",
        purpose: "", expected_return_date: "", special_instructions: "",
        project_name: "", supervisor_name: "", supervisor_email: ""
      })

      // Notify parent component and close dialog
      onAssignmentComplete?.({
        ...asset,
        status: newStatus,
        [assignmentType]: result
      })
      
      // Force a page refresh or data reload after successful assignment
      if (window.location.pathname.includes('borrowed')) {
        window.location.reload()
      }
      
      onClose()
      
    } catch (error) {
      console.error("Error creating assignment:", error)
      setError(error.message || "Failed to create assignment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !asset) return null

  const isAssigning = assignmentType === "assign"
  const title = isAssigning ? "Assign Asset" : "Borrow Asset"
  const actionText = isAssigning ? "Assign" : "Create Borrowing Record"

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-lg border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {asset.name} ({asset.asset_tag})
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Asset Information */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Package className="size-4" />
              Asset Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {asset.name}</div>
              <div><span className="font-medium">Tag:</span> {asset.asset_tag}</div>
              <div><span className="font-medium">Category:</span> <span className="capitalize">{asset.category}</span></div>
              <div><span className="font-medium">Current Status:</span> <span className="capitalize">{asset.status}</span></div>
            </div>
          </div>

          {/* Borrower Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <User className="size-4" />
              {isAssigning ? "Assignee" : "Borrower"} Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Doe"
                  value={formData.borrower_name}
                  onChange={(e) => handleInputChange("borrower_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@company.com"
                  value={formData.borrower_email}
                  onChange={(e) => handleInputChange("borrower_email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Department *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CITE, Engineering, Finance"
                  value={formData.borrower_department}
                  onChange={(e) => handleInputChange("borrower_department", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g., EMP-12345"
                  value={formData.borrower_employee_id}
                  onChange={(e) => handleInputChange("borrower_employee_id", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g., +1-234-567-8900"
                  value={formData.borrower_phone}
                  onChange={(e) => handleInputChange("borrower_phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="size-4" />
              Assignment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Assignment Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CITE Building Room 201, Home Office"
                  value={formData.assignment_location}
                  onChange={(e) => handleInputChange("assignment_location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
              {assignmentType === "borrow" && (
                <div>
                  <label className="block text-xs font-medium mb-1">Expected Return Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expected_return_date}
                    onChange={(e) => handleInputChange("expected_return_date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
              )}
              <div className={assignmentType === "assign" ? "md:col-span-1" : ""}>
                <label className="block text-xs font-medium mb-1">Purpose/Reason *</label>
                <textarea
                  required
                  placeholder="e.g., Remote work setup, Training program, Project development"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Information (for borrowing) */}
          {assignmentType === "borrow" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Building className="size-4" />
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Website Redesign Project"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange("project_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Jane Smith"
                    value={formData.supervisor_name}
                    onChange={(e) => handleInputChange("supervisor_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Supervisor Email</label>
                  <input
                    type="email"
                    placeholder="jane.smith@company.com"
                    value={formData.supervisor_email}
                    onChange={(e) => handleInputChange("supervisor_email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-medium mb-1">Special Instructions</label>
            <textarea
              placeholder="Any special handling instructions, setup requirements, or notes..."
              value={formData.special_instructions}
              onChange={(e) => handleInputChange("special_instructions", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <User className="size-4" />
                  {actionText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssetAssignmentDialog