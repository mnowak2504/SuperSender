import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import CustomerProfileContent from '@/components/dashboard/sales/CustomerProfileContent'

export const runtime = 'nodejs'

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  const userId = (session.user as any)?.id

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('Client')
    .select(`
      *,
      Plan:planId(*),
      salesOwner:salesOwnerId(id, email, name)
    `)
    .eq('id', id)
    .single()

  // Fetch warehouse capacity separately
  const { data: capacity } = await supabase
    .from('WarehouseCapacity')
    .select('*')
    .eq('clientId', id)
    .single()

  if (clientError || !client) {
    redirect('/admin/customers')
  }

  // Check if client is assigned to this admin
  if (client.salesOwnerId !== userId && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Fetch timeline data (deliveries, shipments, invoices)
  const [deliveries, shipments, invoices] = await Promise.all([
    supabase
      .from('DeliveryExpected')
      .select('id, supplierName, goodsDescription, status, createdAt, receivedAt')
      .eq('clientId', id)
      .order('createdAt', { ascending: false })
      .limit(50),
    supabase
      .from('ShipmentOrder')
      .select('id, status, calculatedPriceEur, createdAt, clientTransportChoice, transportCompanyName')
      .eq('clientId', id)
      .order('createdAt', { ascending: false })
      .limit(50),
    supabase
      .from('Invoice')
      .select('id, type, amountEur, status, createdAt, dueDate')
      .eq('clientId', id)
      .order('createdAt', { ascending: false })
      .limit(50),
  ])

  // Fetch custom quotes
  const { data: customQuotes } = await supabase
    .from('ShipmentOrder')
    .select('id, customQuoteRequestedAt, calculatedPriceEur, status')
    .eq('clientId', id)
    .not('customQuoteRequestedAt', 'is', null)
    .order('customQuoteRequestedAt', { ascending: false })

  // Build timeline
  const timeline: any[] = []
  
  deliveries.data?.forEach(delivery => {
    timeline.push({
      id: delivery.id,
      type: 'DELIVERY',
      date: delivery.createdAt,
      title: `Delivery from ${delivery.supplierName}`,
      description: delivery.goodsDescription,
      status: delivery.status,
      receivedAt: delivery.receivedAt,
    })
  })

  shipments.data?.forEach(shipment => {
    timeline.push({
      id: shipment.id,
      type: 'SHIPMENT',
      date: shipment.createdAt,
      title: `Shipment ${shipment.status}`,
      description: shipment.calculatedPriceEur ? `€${shipment.calculatedPriceEur.toFixed(2)}` : 'Pending quote',
      status: shipment.status,
      transportChoice: shipment.clientTransportChoice,
      transportCompany: shipment.transportCompanyName,
    })
  })

  invoices.data?.forEach(invoice => {
    timeline.push({
      id: invoice.id,
      type: 'INVOICE',
      date: invoice.createdAt,
      title: `${invoice.type} Invoice`,
      description: `€${invoice.amountEur.toFixed(2)} - ${invoice.status}`,
      status: invoice.status,
      dueDate: invoice.dueDate,
    })
  })

  customQuotes?.forEach(quote => {
    timeline.push({
      id: quote.id,
      type: 'QUOTE_REQUEST',
      date: quote.customQuoteRequestedAt,
      title: 'Custom Quote Requested',
      description: quote.calculatedPriceEur ? `Quote sent: €${quote.calculatedPriceEur.toFixed(2)}` : 'Awaiting quote',
      status: quote.status,
    })
  })

  // Sort timeline by date (newest first)
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Fetch recent delivery photos (if any) - from WarehouseOrder photos
  const { data: warehouseOrders } = await supabase
    .from('WarehouseOrder')
    .select(`
      id,
      photoUrl,
      sourceDelivery:sourceDeliveryId(supplierName, createdAt)
    `)
    .eq('clientId', id)
    .not('photoUrl', 'is', null)
    .order('receivedAt', { ascending: false })
    .limit(10)

  const deliveryPhotos = warehouseOrders?.map(wo => ({
    id: wo.id,
    photoUrl: wo.photoUrl,
    supplierName: (wo.sourceDelivery as any)?.supplierName || 'Unknown',
    createdAt: (wo.sourceDelivery as any)?.createdAt || wo.id,
  })) || []

  return (
    <CustomerProfileContent
      client={{
        ...client,
        WarehouseCapacity: capacity,
        subscriptionDiscount: (client as any).subscriptionDiscount,
        additionalServicesDiscount: (client as any).additionalServicesDiscount,
      }}
      timeline={timeline}
      deliveryPhotos={deliveryPhotos}
      isSuperAdmin={role === 'SUPERADMIN'}
    />
  )
}

