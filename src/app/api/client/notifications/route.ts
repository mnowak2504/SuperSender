import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // For MVP, return default preferences
    // In the future, this could be stored in a UserSettings table
    const preferences = {
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

    const body = await req.json()
    
    // For MVP, just return success
    // In the future, save to UserSettings table
    console.log('Notification preferences saved:', body)

    return NextResponse.json({ success: true, preferences: body })
  } catch (error) {
    console.error('Error in PUT /api/client/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

