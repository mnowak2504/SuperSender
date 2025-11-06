import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Create Revolut payment link
 * 
 * Requires REVOLUT_API_KEY in environment variables
 * Revolut Business API: https://developer.revolut.com/
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check access
    const role = (session.user as any)?.role
    const clientId = (session.user as any)?.clientId
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && invoice.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const revolutApiKey = process.env.REVOLUT_API_KEY

    if (!revolutApiKey) {
      // Fallback to mock link if no API key configured
      console.warn('REVOLUT_API_KEY not configured, using mock link')
      const mockLink = `https://revolut.com/pay/${invoiceId}?amount=${invoice.amountEur}&currency=${invoice.currency}`
      
      await supabase
        .from('Invoice')
        .update({ revolutLink: mockLink })
        .eq('id', invoiceId)

      return NextResponse.json({ link: mockLink, isMock: true })
    }

    // Create payment link via Revolut API
    try {
      const response = await fetch('https://b2b.revolut.com/api/1.0/payment-links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${revolutApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoice.amountEur * 100, // Convert to cents
          currency: invoice.currency,
          description: `Invoice ${invoice.invoiceNumber || invoiceId}`,
          metadata: {
            invoiceId: invoice.id,
            clientId: invoice.clientId,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create Revolut payment link')
      }

      const data = await response.json()
      const paymentLink = data.public_url || data.short_url

      // Update invoice with payment link
      await supabase
        .from('Invoice')
        .update({
          revolutLink: paymentLink,
          revolutPaymentId: data.id,
        })
        .eq('id', invoiceId)

      return NextResponse.json({ link: paymentLink, isMock: false })
    } catch (apiError) {
      console.error('Revolut API error:', apiError)
      // Fallback to mock link on error
      const mockLink = `https://revolut.com/pay/${invoiceId}?amount=${invoice.amountEur}&currency=${invoice.currency}`
      await supabase
        .from('Invoice')
        .update({ revolutLink: mockLink })
        .eq('id', invoiceId)
      return NextResponse.json({ link: mockLink, isMock: true, error: 'Using fallback link' })
    }
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
