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
    const requestBody = await req.json()
    console.log('Request received:', { 
      hasTo: !!requestBody.to, 
      hasSubject: !!requestBody.subject, 
      hasAction: !!requestBody.action 
    })
    
    // For direct email sending
    if (requestBody.to && requestBody.subject && (requestBody.html || requestBody.text)) {
      return await sendSingleEmail(requestBody)
    }
    
    // For processing email queue (legacy asynchronous flow)
    if (requestBody.action === 'process_queue') {
      return await processEmailQueue()
    }

    // For direct due-date reminder processing. This action is intended for a
    // trusted scheduler and never writes to email_queue.
    if (requestBody.action === 'process_reminders') {
      const reminderSecret = Deno.env.get('REMINDER_CRON_SECRET')
      const suppliedSecret = req.headers.get('x-reminder-secret')

      if (!reminderSecret || suppliedSecret !== reminderSecret) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized reminder processor request' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return await processDueReminders()
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request format. Need either {to, subject, html} or {action: "process_queue"}' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})

async function sendSingleEmail({ to, subject, html, text }) {
  console.log('Attempting to send email to:', to)
  console.log('Subject:', subject)

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY)
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const emailData = {
    from: 'onboarding@resend.dev',
    to: [to],
    subject: subject,
    html: html || `<p>${text || 'No content'}</p>`,
  }

  console.log('Sending email with data:', {
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    hasHtml: !!emailData.html
  })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('Resend API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error response:', errorData)
      throw new Error(`Resend API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, messageId: result.id, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (fetchError) {
    console.error('Fetch error:', fetchError)
    throw new Error(`Failed to send email: ${fetchError.message}`)
  }
}

async function processEmailQueue() {
  console.log('Processing email queue...')
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  // Get pending emails from queue
  const { data: pendingEmails, error: fetchError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10) // Process up to 10 emails at once

  if (fetchError) {
    throw new Error(`Failed to fetch email queue: ${fetchError.message}`)
  }

  console.log(`Found ${pendingEmails?.length || 0} pending emails`)

  let processedCount = 0
  let errorCount = 0

  for (const email of pendingEmails || []) {
    try {
      // Send email using Resend
      const emailData = {
        from: 'onboarding@resend.dev',
        to: [email.recipient_email],
        subject: email.email_subject,
        html: email.email_body.replace(/\n/g, '<br>'),
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update email status to sent
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', email.id)

        // Log successful notification
        await supabase
          .from('notification_logs')
          .insert({
            borrow_id: email.borrow_id,
            notification_type: email.notification_type,
            recipient_email: email.recipient_email,
            sent_at: new Date().toISOString(),
            status: 'sent'
          })

        console.log(`Email sent successfully to ${email.recipient_email}`, result)
        processedCount++
      } else {
        const errorData = await response.text()
        console.error(`Failed to send email to ${email.recipient_email}:`, errorData)
        
        // Update email status to failed
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed', 
            error_message: errorData 
          })
          .eq('id', email.id)

        errorCount++
      }
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error)
      
      // Update email status to failed
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed', 
          error_message: error.message 
        })
        .eq('id', email.id)

      errorCount++
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      processed: processedCount, 
      errors: errorCount,
      message: `Processed ${processedCount} emails, ${errorCount} errors`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}


/**
 * Sends due-tomorrow and overdue reminders directly through Resend.
 * This path deliberately does not use email_queue.
 */
async function processDueReminders() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase service-role environment variables are not set')
  }
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const tomorrowDateObject = new Date(`${todayDate}T00:00:00.000Z`)
  tomorrowDateObject.setUTCDate(tomorrowDateObject.getUTCDate() + 1)
  const tomorrowDate = tomorrowDateObject.toISOString().slice(0, 10)
  const now = new Date().toISOString()

  const assetFields = `
    id,
    borrower_name,
    borrower_email,
    expected_return_date,
    reminder_sent_tomorrow,
    reminder_sent_overdue,
    last_overdue_reminder,
    assets (
      asset_tag,
      name,
      category,
      brand,
      model
    )
  `

  const { data: dueTomorrow, error: dueTomorrowError } = await supabase
    .from('asset_borrowing')
    .select(assetFields)
    .eq('status', 'active')
    .eq('expected_return_date', tomorrowDate)
    .or('reminder_sent_tomorrow.is.null,reminder_sent_tomorrow.eq.false')

  if (dueTomorrowError) {
    throw new Error(`Failed to find due-tomorrow borrowings: ${dueTomorrowError.message}`)
  }

  const { data: overdue, error: overdueError } = await supabase
    .from('asset_borrowing')
    .select(assetFields)
    .eq('status', 'active')
    .lt('expected_return_date', todayDate)
    .or(`last_overdue_reminder.is.null,last_overdue_reminder.lt.${todayDate}`)

  if (overdueError) {
    throw new Error(`Failed to find overdue borrowings: ${overdueError.message}`)
  }

  const result = {
    dueTomorrowFound: dueTomorrow?.length || 0,
    overdueFound: overdue?.length || 0,
    sent: 0,
    failed: 0,
    skipped: 0
  }

  const processReminder = async (borrowing, reminderType) => {
    const isDueTomorrow = reminderType === 'return_reminder_tomorrow'
    const asset = Array.isArray(borrowing.assets) ? borrowing.assets[0] : borrowing.assets

    // Atomically claim the reminder before sending. A concurrent invocation
    // cannot claim the same row because these conditions are part of UPDATE.
    let claimQuery = supabase
      .from('asset_borrowing')
      .update(isDueTomorrow
        ? {
            reminder_sent_tomorrow: true,
            last_reminder_sent: now
          }
        : {
            reminder_sent_overdue: true,
            last_overdue_reminder: todayDate,
            last_reminder_sent: now
          }
      )
      .eq('id', borrowing.id)
      .eq('status', 'active')

    if (isDueTomorrow) {
      claimQuery = claimQuery
        .eq('expected_return_date', tomorrowDate)
        .or('reminder_sent_tomorrow.is.null,reminder_sent_tomorrow.eq.false')
    } else {
      claimQuery = claimQuery
        .lt('expected_return_date', todayDate)
        .or(`last_overdue_reminder.is.null,last_overdue_reminder.lt.${todayDate}`)
    }

    const { data: claimed, error: claimError } = await claimQuery
      .select('id')
      .maybeSingle()

    if (claimError) {
      throw new Error(`Failed to claim reminder for borrowing ${borrowing.id}: ${claimError.message}`)
    }

    if (!claimed) {
      result.skipped++
      return
    }

    const assetTag = asset?.asset_tag || 'Unknown asset'
    const assetName = asset?.name || 'Unnamed asset'
    const recipient = borrowing.borrower_email
    const daysOverdue = Math.max(
      1,
      Math.floor((Date.parse(`${todayDate}T00:00:00.000Z`) - Date.parse(`${borrowing.expected_return_date}T00:00:00.000Z`)) / 86400000)
    )
    const subject = isDueTomorrow
      ? `Reminder: Asset Return Due Tomorrow - ${assetTag}`
      : `OVERDUE: Asset Return Required - ${assetTag}`
    const body = isDueTomorrow
      ? `Dear ${borrowing.borrower_name || 'Borrower'},\n\nThis is a friendly reminder that your borrowed asset is due for return tomorrow.\n\nAsset Details:\n• Asset Tag: ${assetTag}\n• Asset Name: ${assetName}\n• Category: ${asset?.category || 'Not specified'}\n• Brand: ${asset?.brand || 'Not specified'}\n• Model: ${asset?.model || 'Not specified'}\n• Due Date: ${borrowing.expected_return_date}\n\nPlease ensure the asset is returned on time.\n\nBest regards,\nIT Asset Management System`
      : `Dear ${borrowing.borrower_name || 'Borrower'},\n\nYour borrowed asset is overdue for return.\n\nAsset Details:\n• Asset Tag: ${assetTag}\n• Asset Name: ${assetName}\n• Category: ${asset?.category || 'Not specified'}\n• Brand: ${asset?.brand || 'Not specified'}\n• Model: ${asset?.model || 'Not specified'}\n• Original Due Date: ${borrowing.expected_return_date}\n• Days Overdue: ${daysOverdue}\n\nPlease return this asset immediately or contact the inventory staff.\n\nBest regards,\nIT Asset Management System`

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [recipient],
          subject,
          html: escapeHtml(body).replace(/\n/g, '<br>')
        })
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Resend API error: ${response.status} - ${errorBody}`)
      }

      const providerResult = await response.json()
      const { error: logError } = await supabase
        .from('notification_logs')
        .insert({
          borrow_id: borrowing.id,
          notification_type: reminderType,
          recipient_email: recipient,
          sent_at: new Date().toISOString(),
          status: 'sent'
        })

      if (logError) {
        console.error('Reminder sent but audit log failed:', logError)
      }

      console.log(`Direct reminder sent to ${recipient}`, providerResult)
      result.sent++
    } catch (sendError) {
      // Release the claim so the next scheduled run can retry the delivery.
      await supabase
        .from('asset_borrowing')
        .update(isDueTomorrow
          ? { reminder_sent_tomorrow: false, last_reminder_sent: null }
          : { reminder_sent_overdue: false, last_overdue_reminder: null, last_reminder_sent: null }
        )
        .eq('id', borrowing.id)

      await supabase
        .from('notification_logs')
        .insert({
          borrow_id: borrowing.id,
          notification_type: reminderType,
          recipient_email: recipient,
          sent_at: new Date().toISOString(),
          status: 'failed',
          error_message: sendError.message
        })
        .then(({ error: logError }) => {
          if (logError) console.error('Failed to write reminder failure log:', logError)
        })

      result.failed++
      console.error(`Direct reminder failed for ${recipient}:`, sendError)
    }
  }

  for (const borrowing of dueTomorrow || []) {
    await processReminder(borrowing, 'return_reminder_tomorrow')
  }

  for (const borrowing of overdue || []) {
    await processReminder(borrowing, 'return_reminder_overdue')
  }

  return new Response(
    JSON.stringify({
      success: true,
      mode: 'direct',
      ...result,
      message: `Sent ${result.sent} reminders directly; ${result.failed} failed; ${result.skipped} skipped.`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function escapeHtml(value: unknown) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  return String(value ?? '').replace(/[&<>"']/g, (character) => entities[character])
}