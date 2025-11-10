// Supabase Edge Function to send email when shipment is ready
// This function is called via database webhook or HTTP request

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailPayload {
  shipmentId: string
  clientEmail: string
  clientName?: string
  calculatedPrice: number
}

serve(async (req) => {
  try {
    const payload: EmailPayload = await req.json()

    const { shipmentId, clientEmail, clientName, calculatedPrice } = payload

    if (!clientEmail || !shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get shipment details for email
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('id, calculatedPriceEur, clientId, deliveryAddress:Address(*)')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      console.error('Error fetching shipment:', shipmentError)
      return new Response(
        JSON.stringify({ error: 'Shipment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check notification preferences
    const { data: user } = await supabase
      .from('User')
      .select('id')
      .eq('clientId', shipment.clientId)
      .limit(1)
      .single()

    if (user) {
      const { data: settings } = await supabase
        .from('UserSettings')
        .select('shipmentReady')
        .eq('userId', user.id)
        .single()

      if (settings && !settings.shipmentReady) {
        console.log(`[Email] Notification "shipmentReady" disabled for user ${user.id}, skipping`)
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Email skipped (user preference disabled)',
            skipped: true
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send email using Resend (or Supabase email if available)
    const emailSubject = `Your shipment is ready - Transport quote: €${calculatedPrice.toFixed(2)}`
    const emailBody = `
      <h2>Your shipment is ready!</h2>
      <p>Hello ${clientName || 'Valued Client'},</p>
      <p>Your shipment #${shipmentId.slice(-8)} has been packed and is ready for transport selection.</p>
      <p><strong>Calculated Transport Price: €${calculatedPrice.toFixed(2)}</strong></p>
      <p>Please log in to your dashboard to choose your delivery method:</p>
      <ul>
        <li>✅ Accept the calculated price</li>
        <li>🟡 Request a custom quote</li>
        <li>🚚 Organize your own transport</li>
      </ul>
      <p>
        <a href="${SUPABASE_URL.replace('/rest/v1', '')}/client/shipments/${shipmentId}/transport-choice" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Choose Transport Method
        </a>
      </p>
      <p>Best regards,<br>Supersender Team</p>
    `

    // Use Resend API if available
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Supersender <noreply@supersender.com>',
          to: [clientEmail],
          subject: emailSubject,
          html: emailBody,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.text()
        console.error('Resend API error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: error }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent via Resend' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      // Fallback: log to console (in production, use Supabase email service or other provider)
      console.log('Email would be sent:', {
        to: clientEmail,
        subject: emailSubject,
        body: emailBody,
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged (RESEND_API_KEY not configured)',
          email: {
            to: clientEmail,
            subject: emailSubject,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in send-shipment-ready-email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

