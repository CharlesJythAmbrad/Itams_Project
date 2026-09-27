import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Initialize regular client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // Generate a secure temporary password
    const generateTempPassword = (length = 12) => {
      const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
      const numberChars = '0123456789'
      const specialChars = '!@#$%^&*'
      
      const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars
      
      let password = ''
      
      // Add at least one character from each category
      password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
      password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
      password += numberChars[Math.floor(Math.random() * numberChars.length)]
      password += specialChars[Math.floor(Math.random() * specialChars.length)]
      
      // Fill the rest
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
      }
      
      // Shuffle the password
      return password.split('').sort(() => 0.5 - Math.random()).join('')
    }

    // Find user by email in the auth.users table
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error listing users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to process password reset request' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const authUser = authUsers.users.find(user => user.email === cleanEmail)
    
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'No account found with this email address' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find user details in our custom tables
    let userDetails = null
    let userRole = 'end_user'

    // Check users table first
    const { data: mainUser } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (mainUser) {
      userDetails = mainUser
      userRole = mainUser.role || 'end_user'
    } else {
      // Check role-specific tables
      const { data: itsdUser } = await supabase
        .from('itsd_users')
        .select('user_id, email, full_name')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (itsdUser) {
        userDetails = { ...itsdUser, id: itsdUser.user_id }
        userRole = 'itsd'
      } else {
        const { data: staffUser } = await supabase
          .from('inventory_staff_users')
          .select('user_id, email, full_name')
          .eq('email', cleanEmail)
          .maybeSingle()

        if (staffUser) {
          userDetails = { ...staffUser, id: staffUser.user_id }
          userRole = 'inventory_staff'
        } else {
          const { data: endUser } = await supabase
            .from('end_users')
            .select('user_id, email, full_name')
            .eq('email', cleanEmail)
            .maybeSingle()

          if (endUser) {
            userDetails = { ...endUser, id: endUser.user_id }
            userRole = 'end_user'
          }
        }
      }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword(12)

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to reset password' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // In a real implementation, send email here using a service like SendGrid, Resend, etc.
    console.log(`Password reset for ${cleanEmail}: ${tempPassword}`)

    // Mock email content for development
    const emailContent = `
=== ITAMS PASSWORD RESET ===
To: ${cleanEmail}
Subject: ITAMS - Your New Temporary Password

Hello ${userDetails?.full_name || 'User'},

Your password has been reset successfully. Please use the temporary password below to log in:

Temporary Password: ${tempPassword}
Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ')}

IMPORTANT SECURITY NOTICE:
- This is a temporary password generated for your security
- Please change your password immediately after logging in
- Do not share this password with anyone

To log in:
1. Go to the ITAMS Portal login page
2. Enter your email: ${cleanEmail}
3. Enter the temporary password above
4. Update your password in Profile Settings

If you did not request this password reset, please contact IT support immediately.

Best regards,
ITAMS IT Support Team
    `

    console.log(emailContent)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Temporary password sent to ${cleanEmail}. Please check your email and log in with the new password.`,
        // Remove tempPassword in production
        tempPassword: tempPassword
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Password reset function error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})