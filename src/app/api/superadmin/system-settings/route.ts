import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/superadmin/system-settings
 * Get system settings (only SUPERADMIN)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get system settings (should only be one record)
    const { data: settings, error } = await supabase
      .from('SystemSettings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching system settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        settings: {
          dimensionBufferPercent: 5.0,
          defaultClientLimitCbm: 5.0,
          translationServiceEnabled: true,
          photoRetentionDays: 90,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in GET /api/superadmin/system-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/superadmin/system-settings
 * Update system settings (only SUPERADMIN)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      dimensionBufferPercent,
      defaultClientLimitCbm,
      translationServiceEnabled,
      photoRetentionDays,
    } = body

    // Validate inputs
    if (dimensionBufferPercent !== undefined && (dimensionBufferPercent < 0 || dimensionBufferPercent > 100)) {
      return NextResponse.json({ error: 'Dimension buffer must be between 0 and 100' }, { status: 400 })
    }

    if (defaultClientLimitCbm !== undefined && defaultClientLimitCbm < 0) {
      return NextResponse.json({ error: 'Default client limit must be positive' }, { status: 400 })
    }

    if (photoRetentionDays !== undefined && (photoRetentionDays < 1 || photoRetentionDays > 3650)) {
      return NextResponse.json({ error: 'Photo retention must be between 1 and 3650 days' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    if (dimensionBufferPercent !== undefined) updateData.dimensionBufferPercent = dimensionBufferPercent
    if (defaultClientLimitCbm !== undefined) updateData.defaultClientLimitCbm = defaultClientLimitCbm
    if (translationServiceEnabled !== undefined) updateData.translationServiceEnabled = translationServiceEnabled
    if (photoRetentionDays !== undefined) updateData.photoRetentionDays = photoRetentionDays

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('SystemSettings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Update existing settings
      const { data: updated, error: updateError } = await supabase
        .from('SystemSettings')
        .update({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating system settings:', updateError)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: updated })
    } else {
      // Create new settings
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const settingsId = generateCUID()

      const { data: created, error: createError } = await supabase
        .from('SystemSettings')
        .insert({
          id: settingsId,
          dimensionBufferPercent: dimensionBufferPercent ?? 5.0,
          defaultClientLimitCbm: defaultClientLimitCbm ?? 5.0,
          translationServiceEnabled: translationServiceEnabled ?? true,
          photoRetentionDays: photoRetentionDays ?? 90,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating system settings:', createError)
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: created })
    }
  } catch (error) {
    console.error('Error in PUT /api/superadmin/system-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

