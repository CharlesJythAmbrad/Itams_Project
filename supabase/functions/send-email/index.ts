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
    
    // For processing email queue
    if (requestBody.action === 'process_queue') {
      return await processEmailQueue()
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