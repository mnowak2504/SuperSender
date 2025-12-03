import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import PackShipmentForm from './PackShipmentForm'

export const runtime = 'nodejs'

export default async function PackShipmentPage({
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
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Fetch shipment order
  const { data: shipment, error: shipmentError } = await supabase
    .from('ShipmentOrder')
    .select('id, status, packingOrderNumber, Client:clientId(displayName, clientCode)')
    .eq('id', id)
    .single()

  if (shipmentError || !shipment) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Zlecenie pakowania nie znalezione.</p>
        </div>
      </div>
    )
  }

  if (shipment.status !== 'REQUESTED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            To zlecenie nie może być pakowane. Status: {shipment.status}
          </p>
        </div>
      </div>
    )
  }

  // Fetch warehouse orders for this shipment
  const { data: shipmentItems } = await supabase
    .from('ShipmentItem')
    .select('warehouseOrderId')
    .eq('shipmentId', id)

  const warehouseOrderIds = shipmentItems?.map((item: any) => item.warehouseOrderId) || []

  if (warehouseOrderIds.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Brak zamówień w tym zleceniu pakowania.</p>
        </div>
      </div>
    )
  }

  // Fetch warehouse orders with delivery info
  const { data: warehouseOrders, error: ordersError } = await supabase
    .from('WarehouseOrder')
    .select(`
      id,
      warehouseLocation,
      sourceDelivery:sourceDeliveryId(
        deliveryNumber,
        supplierName,
        goodsDescription
      )
    `)
    .in('id', warehouseOrderIds)

  if (ordersError || !warehouseOrders) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd przy pobieraniu zamówień.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pakowanie zlecenia: {shipment.packingOrderNumber || id.slice(-8)}
        </h1>
        <p className="text-sm text-gray-600">
          Klient: {(shipment.Client as any)?.displayName || 'Brak'} ({(shipment.Client as any)?.clientCode || 'Brak kodu'})
        </p>
      </div>

      <PackShipmentForm
        shipmentId={id}
        warehouseOrders={warehouseOrders.map((wo: any) => ({
          id: wo.id,
          internalTrackingNumber: wo.internalTrackingNumber,
          warehouseLocation: wo.warehouseLocation,
          sourceDelivery: wo.sourceDelivery,
        }))}
      />
    </div>
  )
}

