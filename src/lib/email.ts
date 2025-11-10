'use server'

import { createClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

interface NotificationPreferences {
  deliveryReceived: boolean
  shipmentReady: boolean
  invoiceIssued: boolean
  paymentReminder: boolean
  overStorageAlert: boolean
  newsletter: boolean
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  if (!supabase) return null

  try {
    // First try to get from UserSettings
    const { data: settings } = await supabase
      .from('UserSettings')
      .select('*')
      .eq('userId', userId)
      .single()

    if (settings) {
      return {
        deliveryReceived: settings.deliveryReceived ?? true,
        shipmentReady: settings.shipmentReady ?? true,
        invoiceIssued: settings.invoiceIssued ?? true,
        paymentReminder: settings.paymentReminder ?? true,
        overStorageAlert: settings.overStorageAlert ?? true,
        newsletter: settings.newsletter ?? false,
      }
    }

    // If no settings found, return defaults
    return {
      deliveryReceived: true,
      shipmentReady: true,
      invoiceIssued: true,
      paymentReminder: true,
      overStorageAlert: true,
      newsletter: false,
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    // Return defaults on error
    return {
      deliveryReceived: true,
      shipmentReady: true,
      invoiceIssued: true,
      paymentReminder: true,
      overStorageAlert: true,
      newsletter: false,
    }
  }
}

/**
 * Get client's notification preferences (from associated user)
 */
export async function getClientNotificationPreferences(clientId: string): Promise<NotificationPreferences | null> {
  if (!supabase) return null

  try {
    // Get user associated with client
    const { data: user } = await supabase
      .from('User')
      .select('id')
      .eq('clientId', clientId)
      .limit(1)
      .single()

    if (!user) return null

    return getUserNotificationPreferences(user.id)
  } catch (error) {
    console.error('Error fetching client notification preferences:', error)
    return null
  }
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not configured. Email would be sent:', {
      to: options.to,
      subject: options.subject,
    })
    return { success: true } // Return success to not break flow, but log it
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: options.from || 'Supersender <noreply@supersender.com>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Email] Resend API error:', error)
      return { success: false, error }
    }

    const data = await response.json()
    console.log('[Email] Sent successfully:', data.id)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification email if user has preference enabled
 */
export async function sendNotificationEmail(
  userId: string,
  preferenceKey: keyof NotificationPreferences,
  emailOptions: EmailOptions
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const preferences = await getUserNotificationPreferences(userId)

  if (!preferences) {
    console.warn('[Email] Could not fetch preferences, sending anyway')
    return sendEmail(emailOptions)
  }

  if (!preferences[preferenceKey]) {
    console.log(`[Email] Notification "${preferenceKey}" disabled for user ${userId}, skipping`)
    return { success: true, skipped: true }
  }

  return sendEmail(emailOptions)
}

/**
 * Send notification email for client (checks client's user preferences)
 */
export async function sendClientNotificationEmail(
  clientId: string,
  preferenceKey: keyof NotificationPreferences,
  emailOptions: EmailOptions
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const preferences = await getClientNotificationPreferences(clientId)

  if (!preferences) {
    console.warn('[Email] Could not fetch preferences, sending anyway')
    return sendEmail(emailOptions)
  }

  if (!preferences[preferenceKey]) {
    console.log(`[Email] Notification "${preferenceKey}" disabled for client ${clientId}, skipping`)
    return { success: true, skipped: true }
  }

  return sendEmail(emailOptions)
}

/**
 * Send Delivery Received notification email
 */
export async function sendDeliveryReceivedEmail(
  clientId: string,
  deliveryNumber: string,
  supplierName: string,
  photosCount: number = 0
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Get client info
  const { data: client } = await supabase
    .from('Client')
    .select('email, displayName')
    .eq('id', clientId)
    .single()

  if (!client || !client.email) {
    return { success: false, error: 'Client not found' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const emailSubject = `Delivery Received: ${deliveryNumber}`
  const emailBody = `
    <h2>Your delivery has been received!</h2>
    <p>Hello ${client.displayName || 'Valued Client'},</p>
    <p>We have successfully received your delivery at our warehouse.</p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>Delivery Number:</strong> ${deliveryNumber}</p>
      <p><strong>Supplier:</strong> ${supplierName}</p>
      ${photosCount > 0 ? `<p><strong>Photos:</strong> ${photosCount} photo(s) attached</p>` : ''}
    </div>
    <p>You can view the delivery details and photos in your dashboard.</p>
    <p>
      <a href="${baseUrl}/client/deliveries" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        View Deliveries
      </a>
    </p>
    <p>Best regards,<br>Supersender Team</p>
  `

  return sendClientNotificationEmail(clientId, 'deliveryReceived', {
    to: client.email,
    subject: emailSubject,
    html: emailBody,
  })
}

/**
 * Send Invoice Issued notification email
 */
export async function sendInvoiceIssuedEmail(
  clientId: string,
  invoiceId: string,
  invoiceNumber: string | null,
  amount: number,
  type: 'SUBSCRIPTION' | 'TRANSPORT' | 'OPERATIONS',
  dueDate: string,
  paymentLink?: string | null
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Get client info
  const { data: client } = await supabase
    .from('Client')
    .select('email, displayName')
    .eq('id', clientId)
    .single()

  if (!client || !client.email) {
    return { success: false, error: 'Client not found' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const invoiceTypeLabels = {
    SUBSCRIPTION: 'Subscription',
    TRANSPORT: 'Transport',
    OPERATIONS: 'Operations',
  }

  const emailSubject = `New Invoice: ${invoiceNumber || invoiceId.slice(-8)} - €${amount.toFixed(2)}`
  const emailBody = `
    <h2>New Invoice Issued</h2>
    <p>Hello ${client.displayName || 'Valued Client'},</p>
    <p>A new invoice has been issued for your account.</p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>Invoice Number:</strong> ${invoiceNumber || invoiceId.slice(-8)}</p>
      <p><strong>Type:</strong> ${invoiceTypeLabels[type]}</p>
      <p><strong>Amount:</strong> €${amount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
    </div>
    ${paymentLink ? `
      <p>
        <a href="${paymentLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Pay Now
        </a>
      </p>
    ` : ''}
    <p>
      <a href="${baseUrl}/client/invoices" 
         style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        View All Invoices
      </a>
    </p>
    <p>Best regards,<br>Supersender Team</p>
  `

  return sendClientNotificationEmail(clientId, 'invoiceIssued', {
    to: client.email,
    subject: emailSubject,
    html: emailBody,
  })
}

/**
 * Send Payment Reminder email
 */
export async function sendPaymentReminderEmail(
  clientId: string,
  invoiceId: string,
  invoiceNumber: string | null,
  amount: number,
  dueDate: string,
  isOverdue: boolean,
  paymentLink?: string | null
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Get client info
  const { data: client } = await supabase
    .from('Client')
    .select('email, displayName')
    .eq('id', clientId)
    .single()

  if (!client || !client.email) {
    return { success: false, error: 'Client not found' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const emailSubject = isOverdue 
    ? `⚠️ Overdue Payment: ${invoiceNumber || invoiceId.slice(-8)}`
    : `Payment Reminder: ${invoiceNumber || invoiceId.slice(-8)}`
  
  const emailBody = `
    <h2>${isOverdue ? '⚠️ Payment Overdue' : 'Payment Reminder'}</h2>
    <p>Hello ${client.displayName || 'Valued Client'},</p>
    <p>${isOverdue 
      ? 'This invoice is now overdue. Please make payment as soon as possible.'
      : 'This is a friendly reminder that payment is due soon.'}</p>
    <div style="background-color: ${isOverdue ? '#fef2f2' : '#fef3c7'}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${isOverdue ? '#dc2626' : '#f59e0b'};">
      <p><strong>Invoice Number:</strong> ${invoiceNumber || invoiceId.slice(-8)}</p>
      <p><strong>Amount Due:</strong> €${amount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      ${isOverdue ? `<p style="color: #dc2626; font-weight: bold;">⚠️ This invoice is overdue</p>` : ''}
    </div>
    ${paymentLink ? `
      <p>
        <a href="${paymentLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Pay Now
        </a>
      </p>
    ` : ''}
    <p>
      <a href="${baseUrl}/client/invoices" 
         style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        View All Invoices
      </a>
    </p>
    <p>Best regards,<br>Supersender Team</p>
  `

  return sendClientNotificationEmail(clientId, 'paymentReminder', {
    to: client.email,
    subject: emailSubject,
    html: emailBody,
  })
}

/**
 * Send Over-Storage Alert email
 */
export async function sendOverStorageAlertEmail(
  clientId: string,
  usedCbm: number,
  limitCbm: number,
  usagePercent: number
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Get client info
  const { data: client } = await supabase
    .from('Client')
    .select('email, displayName')
    .eq('id', clientId)
    .single()

  if (!client || !client.email) {
    return { success: false, error: 'Client not found' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const emailSubject = `⚠️ Storage Limit Exceeded: ${usagePercent.toFixed(0)}% Used`
  const emailBody = `
    <h2>⚠️ Storage Limit Alert</h2>
    <p>Hello ${client.displayName || 'Valued Client'},</p>
    <p>Your storage usage has exceeded your plan limit.</p>
    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
      <p><strong>Storage Used:</strong> ${usedCbm.toFixed(2)} CBM</p>
      <p><strong>Storage Limit:</strong> ${limitCbm.toFixed(2)} CBM</p>
      <p><strong>Usage:</strong> ${usagePercent.toFixed(0)}%</p>
      <p style="color: #dc2626; font-weight: bold;">⚠️ You are exceeding your storage limit</p>
    </div>
    <p>Additional charges may apply for over-storage. Please consider organizing shipments to reduce your storage usage.</p>
    <p>
      <a href="${baseUrl}/client/deliveries" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        View Deliveries
      </a>
    </p>
    <p>Best regards,<br>Supersender Team</p>
  `

  return sendClientNotificationEmail(clientId, 'overStorageAlert', {
    to: client.email,
    subject: emailSubject,
    html: emailBody,
  })
}

