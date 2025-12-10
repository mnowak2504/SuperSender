import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function QuotesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz wszystkie zamówienia gotowe do wyceny
  // 1. WarehouseOrder ze statusem READY_FOR_QUOTE (zamówienia lokalne)
  const { data: orders, error: ordersError } = await supabase
    .from('WarehouseOrder')
    .select('*, Client:clientId(displayName, clientCode)')
    .eq('status', 'READY_FOR_QUOTE')
    .order('createdAt', { ascending: false })

  // 2. ShipmentOrder z REQUEST_CUSTOM (custom quote requests dla transportu wychodzącego)
  const { data: customQuoteShipments, error: shipmentsError } = await supabase
    .from('ShipmentOrder')
    .select(`
      id,
      createdAt,
      customQuoteRequestedAt,
      calculatedPriceEur,
      status,
      clientTransportChoice,
      Client:clientId(displayName, clientCode),
      deliveryAddress:deliveryAddressId(city, country),
      Package(widthCm, lengthCm, heightCm, weightKg)
    `)
    .or('customQuoteRequestedAt.not.is.null,clientTransportChoice.eq.REQUEST_CUSTOM')
    .order('customQuoteRequestedAt', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders ready for quote:', ordersError)
  }
  if (shipmentsError) {
    console.error('Error fetching custom quote shipments:', shipmentsError)
  }

  const allOrders = (orders || []).map((o: any) => ({ ...o, type: 'WAREHOUSE_ORDER' }))
  const allShipments = (customQuoteShipments || []).map((s: any) => ({ ...s, type: 'SHIPMENT_ORDER' }))
  const combinedOrders = [...allOrders, ...allShipments].sort((a, b) => {
    // Sort by date: customQuoteRequestedAt first (if exists), then createdAt
    const dateA = a.type === 'WAREHOUSE_ORDER' 
      ? a.createdAt 
      : (a.customQuoteRequestedAt || a.createdAt)
    const dateB = b.type === 'WAREHOUSE_ORDER' 
      ? b.createdAt 
      : (b.customQuoteRequestedAt || b.createdAt)
    
    // Put null dates last
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Zamówienia gotowe do wyceny</h1>
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {combinedOrders && combinedOrders.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {combinedOrders.map((order: any) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {order.type === 'WAREHOUSE_ORDER' ? 'Zamówienie' : 'Transport'} #{order.id.slice(-8)}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.type === 'WAREHOUSE_ORDER' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.type === 'WAREHOUSE_ORDER' ? 'Gotowe do wyceny' : 'Wycena indywidualna'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <span className="font-medium">Klient:</span> {(order.Client as any)?.displayName || 'Brak'}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {(order.Client as any)?.clientCode || 'Brak kodu'}
                        </span>
                      </div>
                      {order.type === 'WAREHOUSE_ORDER' ? (
                        <>
                          {order.warehouseLocation && (
                            <div className="mt-1 text-sm text-gray-500">
                              Lokalizacja: {order.warehouseLocation}
                            </div>
                          )}
                          {order.packedLengthCm && order.packedWidthCm && order.packedHeightCm && (
                            <div className="mt-1 text-sm text-gray-500">
                              Wymiary: {order.packedLengthCm}×{order.packedWidthCm}×{order.packedHeightCm} cm
                              {order.packedWeightKg && `, Waga: ${order.packedWeightKg} kg`}
                            </div>
                          )}
                          {order.packedAt && (
                            <div className="mt-1 text-xs text-gray-400">
                              Spakowano: {new Date(order.packedAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {order.deliveryAddress && (
                            <div className="mt-1 text-sm text-gray-500">
                              Dostawa: {(order.deliveryAddress as any)?.city || ''} {(order.deliveryAddress as any)?.country || ''}
                            </div>
                          )}
                          {order.customQuoteRequestedAt && (
                            <div className="mt-1 text-xs text-gray-400">
                              Zgłoszono: {new Date(order.customQuoteRequestedAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                          {order.calculatedPriceEur && (
                            <div className="mt-1 text-sm text-green-600 font-medium">
                              Wycena: €{order.calculatedPriceEur.toFixed(2)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/admin/quote/${order.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        {order.type === 'WAREHOUSE_ORDER' ? 'Wyceń transport' : 'Wyceń transport'}
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Brak zamówień gotowych do wyceny</p>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Powrót do dashboardu
          </Link>
        </div>
      )}
    </div>
  )
}

