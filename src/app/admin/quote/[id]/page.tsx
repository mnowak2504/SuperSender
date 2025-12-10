import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import QuoteForm from './QuoteForm'

export const runtime = 'nodejs'

export default async function QuotePage({
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

  // Sprawdź czy to WarehouseOrder czy ShipmentOrder
  // Najpierw spróbuj WarehouseOrder
  let { data: warehouseOrder, error: warehouseOrderError } = await supabase
    .from('WarehouseOrder')
    .select('*, Client:clientId(displayName, clientCode, id)')
    .eq('id', id)
    .single()

  // Jeśli nie znaleziono WarehouseOrder, spróbuj ShipmentOrder
  let shipmentOrder: any = null
  let orderType: 'WAREHOUSE_ORDER' | 'SHIPMENT_ORDER' = 'WAREHOUSE_ORDER'
  
  if (warehouseOrderError || !warehouseOrder) {
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        clientId,
        status,
        customQuoteRequestedAt,
        clientTransportChoice,
        calculatedPriceEur,
        deliveryAddressId,
        Client:clientId(displayName, clientCode, id),
        deliveryAddress:deliveryAddressId(contactName, line1, line2, city, postalCode, country),
        Package(widthCm, lengthCm, heightCm, weightKg)
      `)
      .eq('id', id)
      .single()
    
    if (!shipmentError && shipment) {
      shipmentOrder = shipment
      orderType = 'SHIPMENT_ORDER'
    }
  }

  const order = warehouseOrder || shipmentOrder

  if (!order) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd: Nie znaleziono zamówienia lub błąd pobierania danych.</p>
          <a href="/admin/quotes" className="text-red-600 hover:text-red-800 underline mt-2 inline-block">
            Wróć do listy wycen
          </a>
        </div>
      </div>
    )
  }

  // Pobierz adresy klienta (dla wyceny potrzebny będzie adres dostawy)
  let addresses: any[] = []
  if (order && (order.Client as any)?.id) {
    const { data: clientAddresses } = await supabase
      .from('Address')
      .select('*')
      .eq('clientId', (order.Client as any).id)
    
    addresses = clientAddresses || []
  }

  // Sprawdź czy zamówienie może być wycenione
  if (orderType === 'WAREHOUSE_ORDER' && order.status !== 'READY_FOR_QUOTE') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            To zamówienie nie może być wycenione. Obecny status: {order.status}
          </p>
          <a href="/admin/quotes" className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
            Wróć do listy
          </a>
        </div>
      </div>
    )
  }

  if (orderType === 'SHIPMENT_ORDER' && order.clientTransportChoice !== 'REQUEST_CUSTOM' && !order.customQuoteRequestedAt) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            To zamówienie nie jest zgłoszone do wyceny indywidualnej.
          </p>
          <a href="/admin/quotes" className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
            Wróć do listy
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <a
          href="/admin/quotes"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Wróć do listy wycen
        </a>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Wycena transportu</h1>

      {/* Informacje o zamówieniu */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {orderType === 'WAREHOUSE_ORDER' ? 'Szczegóły zamówienia' : 'Szczegóły transportu'}
        </h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">ID {orderType === 'WAREHOUSE_ORDER' ? 'zamówienia' : 'transportu'}</dt>
            <dd className="mt-1 text-sm text-gray-900">#{order.id.slice(-8)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Klient</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(order.Client as any)?.displayName || 'Brak'} ({(order.Client as any)?.clientCode || 'Brak kodu'})
            </dd>
          </div>
          {orderType === 'WAREHOUSE_ORDER' ? (
            <>
              {order.warehouseLocation && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lokalizacja magazynowa</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.warehouseLocation}</dd>
                </div>
              )}
              {order.packedLengthCm && order.packedWidthCm && order.packedHeightCm && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Wymiary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.packedLengthCm}×{order.packedWidthCm}×{order.packedHeightCm} cm
                  </dd>
                </div>
              )}
              {order.packedWeightKg && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Waga</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.packedWeightKg} kg</dd>
                </div>
              )}
            </>
          ) : (
            <>
              {order.deliveryAddress && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Adres dostawy</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(order.deliveryAddress as any)?.contactName && (
                      <div className="font-medium">{(order.deliveryAddress as any).contactName}</div>
                    )}
                    <div>
                      {(order.deliveryAddress as any)?.line1 || ''}
                      {(order.deliveryAddress as any)?.line2 && `, ${(order.deliveryAddress as any).line2}`}
                    </div>
                    <div>
                      {(order.deliveryAddress as any)?.city || ''} {(order.deliveryAddress as any)?.postalCode || ''}
                    </div>
                    <div>
                      {(order.deliveryAddress as any)?.country || ''}
                    </div>
                  </dd>
                </div>
              )}
              {order.customQuoteRequestedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Zgłoszono</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(order.customQuoteRequestedAt).toLocaleDateString('pl-PL')}
                  </dd>
                </div>
              )}
              {order.Package && (order.Package as any[]).length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paczki/Palety</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(order.Package as any[]).length} szt.
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      {/* Formularz wyceny */}
      <QuoteForm
        orderId={id}
        clientId={order.clientId}
        addresses={addresses}
        quotedById={session.user.id!}
        orderType={orderType}
        dimensions={orderType === 'WAREHOUSE_ORDER' ? {
          length: order.packedLengthCm || 0,
          width: order.packedWidthCm || 0,
          height: order.packedHeightCm || 0,
          weight: order.packedWeightKg || 0,
        } : {
          // Dla ShipmentOrder oblicz wymiary z Package
          length: (order.Package as any[])?.[0]?.lengthCm || 0,
          width: (order.Package as any[])?.[0]?.widthCm || 0,
          height: (order.Package as any[])?.[0]?.heightCm || 0,
          weight: (order.Package as any[])?.reduce((sum, pkg) => sum + (pkg.weightKg || 0), 0) || 0,
        }}
      />
    </div>
  )
}

