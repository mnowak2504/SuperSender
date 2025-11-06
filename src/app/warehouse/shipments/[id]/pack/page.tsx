import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'
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

  // Fetch shipment with all warehouse orders
  const { data: shipment, error } = await supabase
    .from('ShipmentOrder')
    .select(`
      id,
      createdAt,
      status,
      Client:clientId(displayName, clientCode),
      deliveryAddress:Address(*),
      items: ShipmentItem(
        id,
        warehouseOrder: WarehouseOrder(
          id,
          status,
          warehouseLocation,
          receivedAt,
          sourceDelivery: DeliveryExpected(
            deliveryNumber,
            supplierName,
            goodsDescription
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !shipment) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd: Nie znaleziono shipping request.</p>
          <Link
            href="/warehouse/shipments"
            className="text-red-600 hover:text-red-800 underline mt-2 inline-block"
          >
            Wróć do listy
          </Link>
        </div>
      </div>
    )
  }

  if (shipment.status !== 'REQUESTED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            Ten shipping request nie może być pakowany. Obecny status: {shipment.status}
          </p>
          <Link
            href="/warehouse/shipments"
            className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block"
          >
            Wróć do listy
          </Link>
        </div>
      </div>
    )
  }

  const client = Array.isArray(shipment.Client) ? shipment.Client[0] : shipment.Client
  const warehouseOrders = shipment.items?.map((item: any) => item.warehouseOrder).filter(Boolean) || []

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/warehouse/shipments"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Wróć do shipping requests
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pakowanie Shipping Request</h1>

      {/* Shipment Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły Shipping Request</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Shipping Request ID</dt>
            <dd className="mt-1 text-sm text-gray-900">#{shipment.id.slice(-8)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Klient</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(client as any)?.displayName || 'Brak'} ({(client as any)?.clientCode || 'Brak kodu'})
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Liczba zamówień</dt>
            <dd className="mt-1 text-sm text-gray-900">{warehouseOrders.length}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">{shipment.status}</dd>
          </div>
        </dl>
      </div>

      {/* Warehouse Orders in this Shipment */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zamówienia w tym Shipmencie</h2>
        <div className="space-y-3">
          {warehouseOrders.map((wo: any) => {
            const delivery = wo.sourceDelivery
            return (
              <div key={wo.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Order #{wo.id.slice(-8)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {wo.status}
                      </span>
                    </div>
                    {delivery && (
                      <div className="text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Dostawa:</span>{' '}
                          {delivery.deliveryNumber && (
                            <span className="font-mono text-blue-600">{delivery.deliveryNumber}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Dostawca:</span> {delivery.supplierName}
                        </div>
                        {delivery.goodsDescription && (
                          <div>
                            <span className="font-medium">Opis:</span> {delivery.goodsDescription}
                          </div>
                        )}
                      </div>
                    )}
                    {wo.warehouseLocation && (
                      <div className="text-xs text-gray-500 mt-2">
                        Lokalizacja: {wo.warehouseLocation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Packing Form */}
      <PackShipmentForm shipmentId={id} warehouseOrderIds={warehouseOrders.map((wo: any) => wo.id)} />
    </div>
  )
}

