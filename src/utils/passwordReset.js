import { supabase } from "@/lib/supabaseClient"

/**
 * Generate a secure temporary password
 * @param {number} length - Length of the password (default 12)
 * @returns {string} Generated password
 */
export const generateTemporaryPassword = (length = 12) => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const specialChars = '!@#$%^&*'
  
  // Ensure at least one character from each category
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars
  
  let password = ''
  
  // Add at least one character from each category
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
  password += numberChars[Math.floor(Math.random() * numberChars.length)]
  password += specialChars[Math.floor(Math.random() * specialChars.length)]
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

/**
 * Check if a user exists in any of the user tables
 * @param {string} email - Email to check
 * @returns {Promise<Object>} User data if found, null otherwise
 */
export const findUserByEmail = async (email) => {
  try {
    const cleanEmail = email.trim().toLowerCase()
    console.log('🔍 Looking for user with email:', cleanEmail)
    
    // First check the main users table - this is where the email is stored
    console.log('🔍 Checking users table...')
    const { data: mainUser, error: mainError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', cleanEmail)
      .maybeSingle()
    
    if (mainError) {
      console.warn('Warning checking users table:', mainError)
      return { found: false, user: null, source: null, error: mainError.message }
    }
    
    if (mainUser) {
      console.log('✅ Found user in users table:', mainUser)
      
      // Now get additional role-specific details based on the user's role
      let roleDetails = null
      
      if (mainUser.role === 'itsd') {
        console.log('🔍 Getting ITSD role details...')
        const { data: itsdDetails } = await supabase
          .from('itsd_users')
          .select('admin_level, specialization, shift, can_manage_assets')
          .eq('user_id', mainUser.id)
          .maybeSingle()
        
        roleDetails = itsdDetails
      } else if (mainUser.role === 'inventory_staff') {
        console.log('🔍 Getting inventory staff role details...')
        const { data: staffDetails } = await supabase
          .from('inventory_staff_users')
          .select('warehouse_location, inventory_tier, badge_number')
          .eq('user_id', mainUser.id)
          .maybeSingle()
        
        roleDetails = staffDetails
      } else if (mainUser.role === 'end_user') {
        console.log('🔍 Getting end user role details...')
        const { data: endUserDetails } = await supabase
          .from('end_users')
          .select('department, employee_id, job_title')
          .eq('user_id', mainUser.id)
          .maybeSingle()
        
        roleDetails = endUserDetails
      }
      
      return {
        found: true,
        user: {
          ...mainUser,
          roleDetails
        },
        source: 'users'
      }
    }
    
    console.log('❌ User not found in users table')
    return { found: false, user: null, source: null }
    
  } catch (error) {
    console.error('❌ Error finding user by email:', error)
    return { found: false, user: null, source: null, error: error.message }
  }
}

/**
 * Debug function to list all users in the database (for development)
 */
export const listAllUsers = async () => {
  console.log('📋 Listing all users in database...')
  
  try {
    // Check main users table - this is where all emails are stored
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .limit(10)
    
    if (!usersError && users && users.length > 0) {
      console.log('👥 All users in database:', users)
      console.log('📧 Available email addresses:')
      users.forEach(user => {
        console.log(`   • ${user.email} (${user.role}) - ${user.full_name}`)
      })
    } else if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log('� No users found in database')
    }
    
    console.log('📋 Finished listing users')
    
  } catch (error) {
    console.error('❌ Error listing users:', error)
  }
}

/**
 * Reset user password by sending a Supabase auth reset email.
 * The only client-safe way to change another user's password is via
 * supabase.auth.resetPasswordForEmail — which emails the user a magic link
 * they click to land on /reset-password and set a new password.
 *
 * NOTE: Generating a "temp password" and showing it on screen does NOT work
 * unless you have a server-side admin key to call auth.admin.updateUserById().
 *
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Success/error response
 */
export const resetUserPassword = async (email) => {
  try {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Verify the email exists in our public.users table first
    //    so we don't leak whether an email is registered (for unknown emails
    //    we still return success to prevent user enumeration)
    const userResult = await findUserByEmail(cleanEmail)

    // 2. Send the Supabase password-reset email regardless of whether the
    //    user was found in public.users (Supabase handles non-existent emails
    //    silently on its side, preventing enumeration)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
      expiresIn: 600, // 10 minutes in seconds (10 * 60 = 600)
    })

    if (resetError) {
      console.error("Password reset email error:", resetError)
      return {
        success: false,
        error: "Failed to send reset email. Please try again later.",
      }
    }

    return {
      success: true,
      isAuthReset: true,
      userName: userResult.found ? userResult.user?.full_name : null,
      message: `A password reset link has been sent to ${cleanEmail}. Please check your inbox (and spam folder) and click the link to set a new password.`,
    }
  } catch (error) {
    console.error("Error in resetUserPassword:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    }
  }
}