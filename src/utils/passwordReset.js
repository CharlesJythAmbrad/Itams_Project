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
 * Simple password reset that generates a temporary password and shows it to user
 * @param {string} email - User's email
 * @returns {Promise<Object>} Success/error response
 */
export const resetUserPassword = async (email) => {
  try {
    console.log('🔍 Starting password reset for:', email)
    
    // Debug: List all users first
    await listAllUsers()
    
    const cleanEmail = email.trim().toLowerCase()
    
    // Check if user exists in our custom tables first
    console.log('🔍 Searching for user in public.users table...')
    const userResult = await findUserByEmail(cleanEmail)
    
    console.log('🔍 User search result:', userResult)
    
    if (userResult.found) {
      console.log('✅ User found in public.users:', userResult.user)
      
      // Generate a temporary password
      const tempPassword = generateTemporaryPassword(10)
      console.log('🔐 Generated temporary password:', tempPassword)
      
      const result = {
        success: true,
        message: `Temporary password generated for ${cleanEmail}.`,
        tempPassword: tempPassword,
        userRole: userResult.user.role,
        userName: userResult.user.full_name
      }
      
      console.log('✅ Password reset result:', result)
      return result
    }
    
    // If not found in public.users, try to use Supabase auth directly
    // This will work if the user exists in auth.users but not in public.users
    console.log('🔍 User not found in public.users, trying Supabase auth reset...')
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (resetError) {
        console.error('❌ Supabase auth reset error:', resetError)
        
        // If the error is because user doesn't exist in auth either
        if (resetError.message.includes('Unable to validate email address')) {
          return {
            success: false,
            error: 'No account found with this email address. Please verify your email and try again.'
          }
        }
        
        return {
          success: false,
          error: 'Failed to send password reset. Please try again later.'
        }
      }
      
      console.log('✅ Supabase auth reset successful')
      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}. Please check your email and follow the link to reset your password.`,
        isAuthReset: true // Flag to indicate this used auth reset
      }
      
    } catch (authError) {
      console.error('❌ Auth reset error:', authError)
      return {
        success: false,
        error: 'Failed to process password reset. Please try again later.'
      }
    }
    
  } catch (error) {
    console.error('❌ Error in password reset:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    }
  }
}