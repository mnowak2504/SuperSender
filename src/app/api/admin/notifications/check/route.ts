import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { sendPaymentReminderEmail, sendOverStorageAlertEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * POST /api/admin/notifications/check
 * Check and send payment reminders and over-storage alerts
 * Can be called by cron job or manually by admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results = {
      paymentReminders: { sent: 0, skipped: 0, errors: 0 },
      overStorageAlerts: { sent: 0, skipped: 0, errors: 0 },
    }

    // 1. Check for payment reminders (invoices due in 3 days or overdue)
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const { data: invoicesDue, error: invoicesError } = await supabase
      .from('Invoice')
      .select('id, clientId, invoiceNumber, amountEur, dueDate, status, revolutCheckoutUrl')
      .eq('status', 'ISSUED')
      .lte('dueDate', threeDaysFromNow.toISOString())

    if (!invoicesError && invoicesDue) {
      for (const invoice of invoicesDue) {
        const dueDate = new Date(invoice.dueDate)
        const isOverdue = dueDate < today

        try {
          const result = await sendPaymentReminderEmail(
            invoice.clientId,
            invoice.id,
            invoice.invoiceNumber,
            invoice.amountEur,
            invoice.dueDate,
            isOverdue,
            invoice.revolutCheckoutUrl || null
          )

          if (result.skipped) {
            results.paymentReminders.skipped++
          } else if (result.success) {
            results.paymentReminders.sent++
          } else {
            results.paymentReminders.errors++
            console.error(`Error sending payment reminder for invoice ${invoice.id}:`, result.error)
          }
        } catch (error) {
          results.paymentReminders.errors++
          console.error(`Error sending payment reminder for invoice ${invoice.id}:`, error)
        }
      }
    }

    // 2. Check for over-storage alerts
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, usedCbm, limitCbm, planId')
      .not('planId', 'is', null)

    if (!clientsError && clients) {
      for (const client of clients) {
        if (!client.limitCbm || client.limitCbm === 0) continue

        const usagePercent = (client.usedCbm / client.limitCbm) * 100

        // Alert if usage exceeds 100%
        if (usagePercent > 100) {
          try {
            const result = await sendOverStorageAlertEmail(
              client.id,
              client.usedCbm,
              client.limitCbm,
              usagePercent
            )

            if (result.skipped) {
              results.overStorageAlerts.skipped++
            } else if (result.success) {
              results.overStorageAlerts.sent++
            } else {
              results.overStorageAlerts.errors++
              console.error(`Error sending over-storage alert for client ${client.id}:`, result.error)
            }
          } catch (error) {
            results.overStorageAlerts.errors++
            console.error(`Error sending over-storage alert for client ${client.id}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Notification check completed',
    })
  } catch (error) {
    console.error('Error in notification check:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

