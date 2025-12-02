import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/client/local-collection-quote/[id]/accept
 * Accept a quoted price and schedule collection
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Find client
    let clientId = (session.user as any)?.clientId
    if (!clientId) {
      const { data: clientByEmail } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (clientByEmail) {
        clientId = clientByEmail.id
      } else {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    // Verify quote belongs to client
    const { data: quote, error: quoteError } = await supabase
      .from('LocalCollectionQuote')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'QUOTED') {
      return NextResponse.json({ error: 'Quote is not in QUOTED status' }, { status: 400 })
    }

    const body = await req.json()
    const {
      collectionCountry,
      collectionContactName,
      collectionContactPhone,
      collectionDateFrom,
      collectionDateTo,
      orderNumber,
      orderDetails,
      pinCode,
    } = body

    // Validate required fields
    // collectionCountry is always 'Poland' for local collection
    // collectionContactName and collectionContactPhone are optional
    // orderNumber is required
    if (!collectionDateFrom || !collectionDateTo || !orderNumber) {
      return NextResponse.json({ error: 'Missing required fields: collection dates and order number are required' }, { status: 400 })
    }

    // Update quote with acceptance and scheduling details
    // collectionCountry is always 'Poland' for local collection
    const { data: updatedQuote, error: updateError } = await supabase
      .from('LocalCollectionQuote')
      .update({
        status: 'ACCEPTED',
        collectionCountry: collectionCountry || 'Poland', // Default to Poland
        collectionContactName: collectionContactName || null,
        collectionContactPhone: collectionContactPhone || null,
        collectionDateFrom: new Date(collectionDateFrom).toISOString(),
        collectionDateTo: new Date(collectionDateTo).toISOString(),
        orderNumber: orderNumber, // Required field
        orderDetails: orderDetails || null,
        pinCode: pinCode || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error accepting quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept quote', details: updateError.message },
        { status: 500 }
      )
    }

    // Add local collection cost to MonthlyAdditionalCharges
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    const localCollectionCost = updatedQuote.quotedPriceEur || 0

    if (localCollectionCost > 0) {
      // Check if charges already exist for this month
      const { data: existingCharges } = await supabase
        .from('MonthlyAdditionalCharges')
        .select('id, additionalServicesAmountEur, totalAmountEur')
        .eq('clientId', clientId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()

      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'mac' // Monthly Additional Charges prefix
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      if (existingCharges) {
        // Update existing charges - add local collection cost
        const newAdditionalServices = (existingCharges.additionalServicesAmountEur || 0) + localCollectionCost
        const newTotal = (existingCharges.totalAmountEur || 0) + localCollectionCost

        await supabase
          .from('MonthlyAdditionalCharges')
          .update({
            additionalServicesAmountEur: newAdditionalServices,
            totalAmountEur: newTotal,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingCharges.id)
      } else {
        // Create new charges record
        await supabase
          .from('MonthlyAdditionalCharges')
          .insert({
            id: generateCUID(),
            clientId: clientId,
            month: currentMonth,
            year: currentYear,
            overSpaceAmountEur: 0,
            additionalServicesAmountEur: localCollectionCost,
            totalAmountEur: localCollectionCost,
          })
      }
    }

    // TODO: Send notification email to sales rep/admin about scheduled collection

    return NextResponse.json({ success: true, quote: updatedQuote })
  } catch (error) {
    console.error('Error in POST /api/client/local-collection-quote/[id]/accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

