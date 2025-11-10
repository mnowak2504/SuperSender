import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

// Generate CUID helper
function generateCUID(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'us'
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const runtime = 'nodejs'

// Get notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = (session.user as any)?.id

    // Try to get user settings from database
    const { data: settings, error } = await supabase
      .from('UserSettings')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine (use defaults)
      console.error('Error fetching notification preferences:', error)
    }

    // Return preferences from database or defaults
    const preferences = settings ? {
      deliveryReceived: settings.deliveryReceived ?? true,
      shipmentReady: settings.shipmentReady ?? true,
      invoiceIssued: settings.invoiceIssued ?? true,
      paymentReminder: settings.paymentReminder ?? true,
      overStorageAlert: settings.overStorageAlert ?? true,
      newsletter: settings.newsletter ?? false,
    } : {
      deliveryReceived: true,
      shipmentReady: true,
      invoiceIssued: true,
      paymentReminder: true,
      overStorageAlert: true,
      newsletter: false,
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error in GET /api/client/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Save notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = (session.user as any)?.id
    const body = await req.json()

    // Validate preferences
    const preferences = {
      deliveryReceived: Boolean(body.deliveryReceived ?? true),
      shipmentReady: Boolean(body.shipmentReady ?? true),
      invoiceIssued: Boolean(body.invoiceIssued ?? true),
      paymentReminder: Boolean(body.paymentReminder ?? true),
      overStorageAlert: Boolean(body.overStorageAlert ?? true),
      newsletter: Boolean(body.newsletter ?? false),
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('UserSettings')
      .select('id')
      .eq('userId', userId)
      .single()

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('UserSettings')
        .update({
          ...preferences,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', userId)

      if (error) {
        console.error('Error updating notification preferences:', error)
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('UserSettings')
        .insert({
          id: generateCUID(),
          userId,
          ...preferences,
        })

      if (error) {
        console.error('Error creating notification preferences:', error)
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Error in PUT /api/client/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

