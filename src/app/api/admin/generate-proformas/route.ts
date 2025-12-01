import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/generate-proformas
 * Generate proforma invoices for all clients with monthly charges at end of month (ADMIN/SUPERADMIN)
 * Can be called for specific month/year or previous month
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

    const body = await req.json()
    const { month, year } = body

    // Use provided month/year or previous month
    const now = new Date()
    let targetMonth = month
    let targetYear = year

    if (!targetMonth || !targetYear) {
      // Previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      targetMonth = prevMonth.getMonth() + 1
      targetYear = prevMonth.getFullYear()
    }

    // Get all clients with monthly charges for this month
    const { data: charges, error: chargesError } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .gt('totalAmountEur', 0) // Only clients with charges > 0

    if (chargesError) {
      console.error('Error fetching monthly charges:', chargesError)
      return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 })
    }

    if (!charges || charges.length === 0) {
      return NextResponse.json({ 
        message: 'No charges found for this month',
        proformasGenerated: 0 
      })
    }

    // Calculate due date (7 days from month end)
    const monthEnd = new Date(targetYear, targetMonth, 0) // Last day of month
    const dueDate = new Date(monthEnd)
    dueDate.setDate(dueDate.getDate() + 7) // 7 days after month end

    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const proformasGenerated = []
    const errors = []

    // Generate proforma for each client
    for (const charge of charges) {
      // Check if proforma already exists
      const { data: existingProforma } = await supabase
        .from('ProformaInvoice')
        .select('id')
        .eq('clientId', charge.clientId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .single()

      if (existingProforma) {
        // Update existing proforma
        const { error: updateError } = await supabase
          .from('ProformaInvoice')
          .update({
            amountEur: charge.totalAmountEur,
            dueDate: dueDate.toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingProforma.id)

        if (updateError) {
          errors.push({ clientId: charge.clientId, error: updateError.message })
        } else {
          proformasGenerated.push({ clientId: charge.clientId, proformaId: existingProforma.id })
        }
      } else {
        // Create new proforma
        const proformaId = generateCUID()

        const { error: createError } = await supabase
          .from('ProformaInvoice')
          .insert({
            id: proformaId,
            clientId: charge.clientId,
            month: targetMonth,
            year: targetYear,
            amountEur: charge.totalAmountEur,
            status: 'PENDING',
            dueDate: dueDate.toISOString(),
          })

        if (createError) {
          errors.push({ clientId: charge.clientId, error: createError.message })
        } else {
          proformasGenerated.push({ clientId: charge.clientId, proformaId })
        }
      }
    }

    return NextResponse.json({
      message: `Generated ${proformasGenerated.length} proforma invoices`,
      proformasGenerated: proformasGenerated.length,
      proformas: proformasGenerated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/generate-proformas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

