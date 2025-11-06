import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function ShipmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Fetch shipments that need packing (status: REQUESTED)
  const { data: shipments, error } = await supabase
    .from('ShipmentOrder')
    .select(`
      id,
      createdAt,
      status,
      Client:clientId(displayName, clientCode),
      items: ShipmentItem(
        warehouseOrder: WarehouseOrder(
          id,
          status,
          sourceDelivery: DeliveryExpected(
            deliveryNumber,
            supplierName,
            goodsDescription
          )
        )
      )
    `)
    .eq('status', 'REQUESTED')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching shipments:', error)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Shipping Requests</h1>
        <Link
          href="/warehouse/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {shipments && shipments.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {shipments.map((shipment: any) => {
              const client = shipment.Client
              const totalOrders = shipment.items?.length || 0
              
              return (
                <li key={shipment.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Shipping Request #{shipment.id.slice(-8)}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            To Pack
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p className="truncate">
                            <span className="font-medium">Klient:</span> {client?.displayName || 'Brak'}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {client?.clientCode || 'Brak kodu'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{totalOrders}</span> zamówień do spakowania:
                          </p>
                          <ul className="mt-1 space-y-1">
                            {shipment.items?.slice(0, 3).map((item: any) => {
                              const wo = item.warehouseOrder
                              const delivery = wo?.sourceDelivery
                              return (
                                <li key={item.id} className="text-xs text-gray-500 ml-4">
                                  • {delivery?.deliveryNumber || wo?.id.slice(-8)} - {delivery?.supplierName || 'Unknown'} 
                                  {delivery?.goodsDescription && ` (${delivery.goodsDescription})`}
                                </li>
                              )
                            })}
                            {totalOrders > 3 && (
                              <li className="text-xs text-gray-400 ml-4">
                                ... i {totalOrders - 3} więcej
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Utworzono: {formatDate(shipment.createdAt)}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          href={`/warehouse/shipments/${shipment.id}/pack`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Pack Shipment
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Brak shipping requests do pakowania</p>
          <Link
            href="/warehouse/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Powrót do dashboardu
          </Link>
        </div>
      )}
    </div>
  )
}

