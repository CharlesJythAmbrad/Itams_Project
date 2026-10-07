import { supabase } from "@/lib/supabaseClient"

/**
 * Activity Logger Utility
 * Logs user activities to the activity_logs table
 */

/**
 * Log an activity action
 * @param {Object} params - Activity parameters
 * @param {string} params.action - Action type (create, update, delete, assign, etc.)
 * @param {string} params.resourceType - Type of resource (asset, user, repair, etc.)
 * @param {string} params.resourceId - ID of the affected resource
 * @param {string} params.resourceName - Human-readable name of the resource
 * @param {string} params.description - Human-readable description
 * @param {Object} params.metadata - Additional structured data
 * @param {boolean} params.success - Whether the action was successful
 * @param {string} params.errorMessage - Error message if action failed
 * @returns {Promise<Object>} Result of the logging operation
 */
export const logActivity = async ({
  action,
  resourceType,
  resourceId = null,
  resourceName = null,
  description = '',
  metadata = null,
  success = true,
  errorMessage = null
}) => {
  try {
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.warn('Cannot log activity - no authenticated user:', userError?.message)
      return { success: false, error: 'No authenticated user' }
    }

    // Get user profile for role and name
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('Cannot get user profile for activity logging:', profileError.message)
      // Continue with basic user info
    }

    // Prepare activity log data
    const activityData = {
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown User',
      user_role: profile?.role || user.user_metadata?.role || 'end_user',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip_address: null, // Could be enhanced with IP detection
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      session_id: user.session_id || null,
      success,
      error_message: errorMessage
    }

    // Insert activity log
    const { data: logData, error: logError } = await supabase
      .from('activity_logs')
      .insert([activityData])
      .select()
      .single()

    if (logError) {
      console.error('Failed to log activity:', logError)
      return { success: false, error: logError.message }
    }

    console.log('Activity logged successfully:', {
      action,
      resourceType,
      resourceName,
      user: activityData.user_name
    })

    return { success: true, data: logData }
    
  } catch (error) {
    console.error('Activity logging error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Log asset-related activities
 */
export const logAssetActivity = {
  created: (asset) => logActivity({
    action: 'create',
    resourceType: 'asset',
    resourceId: asset.id,
    resourceName: `${asset.name} (${asset.asset_tag})`,
    description: `Created new asset: ${asset.name} (${asset.asset_tag})`,
    metadata: {
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      cost: asset.purchase_cost,
      location: asset.location
    }
  }),

  updated: (asset, changes) => logActivity({
    action: 'update',
    resourceType: 'asset',
    resourceId: asset.id,
    resourceName: `${asset.name} (${asset.asset_tag})`,
    description: `Updated asset: ${asset.name} (${asset.asset_tag})`,
    metadata: {
      changes,
      category: asset.category,
      location: asset.location
    }
  }),

  deleted: (asset) => logActivity({
    action: 'delete',
    resourceType: 'asset',
    resourceId: asset.id,
    resourceName: `${asset.name} (${asset.asset_tag})`,
    description: `Deleted asset: ${asset.name} (${asset.asset_tag})`,
    metadata: {
      category: asset.category,
      brand: asset.brand,
      model: asset.model
    }
  }),

  assigned: (asset, assignee) => logActivity({
    action: 'assign',
    resourceType: 'assignment',
    resourceId: assignee.id,
    resourceName: `${asset.name} → ${assignee.assignee_name}`,
    description: `Assigned asset ${asset.name} (${asset.asset_tag}) to ${assignee.assignee_name}`,
    metadata: {
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      assignee_name: assignee.assignee_name,
      assignee_department: assignee.assignee_department,
      purpose: assignee.purpose
    }
  }),

  unassigned: (asset, assignment) => logActivity({
    action: 'unassign',
    resourceType: 'assignment',
    resourceId: assignment.id,
    resourceName: `${asset.name} ← ${assignment.assignee_name}`,
    description: `Unassigned asset ${asset.name} (${asset.asset_tag}) from ${assignment.assignee_name}`,
    metadata: {
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      previous_assignee: assignment.assignee_name,
      assignment_duration: assignment.assignment_duration
    }
  })
}

/**
 * Log user management activities
 */
export const logUserActivity = {
  created: (newUser) => logActivity({
    action: 'create',
    resourceType: 'user',
    resourceId: newUser.id,
    resourceName: `${newUser.full_name} (${newUser.email})`,
    description: `Created new user account: ${newUser.full_name}`,
    metadata: {
      email: newUser.email,
      role: newUser.role,
      department: newUser.department
    }
  }),

  updated: (user, changes) => logActivity({
    action: 'update',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: `${user.full_name} (${user.email})`,
    description: `Updated user account: ${user.full_name}`,
    metadata: {
      changes,
      role: user.role
    }
  }),

  deleted: (user) => logActivity({
    action: 'delete',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: `${user.full_name} (${user.email})`,
    description: `Deleted user account: ${user.full_name}`,
    metadata: {
      email: user.email,
      role: user.role
    }
  }),

  deactivated: (user) => logActivity({
    action: 'deactivate',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: `${user.full_name} (${user.email})`,
    description: `Deactivated user account: ${user.full_name}`,
    metadata: {
      email: user.email,
      role: user.role
    }
  }),

  activated: (user) => logActivity({
    action: 'activate',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: `${user.full_name} (${user.email})`,
    description: `Activated user account: ${user.full_name}`,
    metadata: {
      email: user.email,
      role: user.role
    }
  })
}

/**
 * Log authentication activities
 */
export const logAuthActivity = {
  login: () => logActivity({
    action: 'login',
    resourceType: 'system',
    resourceName: 'ITAMS System',
    description: 'User logged into the system',
    metadata: {
      login_method: 'password',
      timestamp: new Date().toISOString()
    }
  }),

  logout: () => logActivity({
    action: 'logout',
    resourceType: 'system',
    resourceName: 'ITAMS System',
    description: 'User logged out of the system',
    metadata: {
      timestamp: new Date().toISOString()
    }
  }),

  passwordReset: (email) => logActivity({
    action: 'password_reset',
    resourceType: 'system',
    resourceName: 'Password Reset',
    description: `Password reset requested for ${email}`,
    metadata: {
      target_email: email,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Log repair-related activities
 */
export const logRepairActivity = {
  created: (repair, asset) => logActivity({
    action: 'create',
    resourceType: 'repair',
    resourceId: repair.id,
    resourceName: `${repair.repair_ticket} - ${asset?.name || 'Asset'}`,
    description: `Created repair ticket: ${repair.repair_ticket}`,
    metadata: {
      asset_id: asset?.id,
      asset_tag: asset?.asset_tag,
      issue: repair.issue_description,
      priority: repair.priority,
      assigned_technician: repair.assigned_technician
    }
  }),

  updated: (repair, asset, changes) => logActivity({
    action: 'update',
    resourceType: 'repair',
    resourceId: repair.id,
    resourceName: `${repair.repair_ticket} - ${asset?.name || 'Asset'}`,
    description: `Updated repair ticket: ${repair.repair_ticket}`,
    metadata: {
      changes,
      status: repair.status,
      priority: repair.priority
    }
  }),

  completed: (repair, asset) => logActivity({
    action: 'complete',
    resourceType: 'repair',
    resourceId: repair.id,
    resourceName: `${repair.repair_ticket} - ${asset?.name || 'Asset'}`,
    description: `Completed repair ticket: ${repair.repair_ticket}`,
    metadata: {
      asset_id: asset?.id,
      asset_tag: asset?.asset_tag,
      completion_date: repair.completion_date,
      technician: repair.assigned_technician
    }
  })
}

export default {
  logActivity,
  logAssetActivity,
  logUserActivity,
  logAuthActivity,
  logRepairActivity
}