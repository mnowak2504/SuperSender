import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'
import MarkReadyForQuoteButton from './MarkReadyForQuoteButton'
import TransportDetailsForm from '@/components/shipments/TransportDetailsForm'
import ConfirmShipmentButton from './ConfirmShipmentButton'

export const runtime = 'nodejs'

export default async function WarehouseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  const statusFilter = params.status || 'AT_WAREHOUSE'

  // For READY_TO_SHIP, show ShipmentOrders instead of individual WarehouseOrders
  let orders: any[] = []
  let error: any = null

  if (statusFilter === 'READY_TO_SHIP' || statusFilter === 'SHIPPED') {
    // Fetch ShipmentOrders that are ready (AWAITING_ACCEPTANCE or READY_FOR_LOADING) or shipped (IN_TRANSIT)
    const statuses = statusFilter === 'READY_TO_SHIP' 
      ? ['AWAITING_ACCEPTANCE', 'READY_FOR_LOADING']
      : ['IN_TRANSIT']
    
    // Fetch ShipmentOrders with their packages
    const { data: shipments, error: shipmentsError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        createdAt,
        status,
        calculatedPriceEur,
        clientTransportChoice,
        transportMode,
        ownTransportVehicleReg,
        ownTransportTrailerReg,
        ownTransportCarrier,
        ownTransportTrackingNumber,
        ownTransportPlannedLoadingDate,
        transportCompanyName,
        plannedLoadingDate,
        plannedDeliveryDateFrom,
        plannedDeliveryDateTo,
        Client:clientId(displayName, clientCode),
        packages:Package(
          id,
          type,
          widthCm,
          lengthCm,
          heightCm,
          weightKg,
          volumeCbm
        ),
        items:ShipmentItem(
          warehouseOrder:WarehouseOrder(
            id,
            sourceDelivery:DeliveryExpected(
              deliveryNumber,
              supplierName,
              goodsDescription
            )
          )
        )
      `)
      .in('status', statuses)
      .order('createdAt', { ascending: false })

    if (shipmentsError) {
      error = shipmentsError
      console.error('Error fetching shipments:', shipmentsError)
    } else {
      console.log('[WAREHOUSE ORDERS] Found shipments:', shipments?.length || 0)
      if (shipments && shipments.length > 0) {
        console.log('[WAREHOUSE ORDERS] Sample shipment:', {
          id: shipments[0].id,
          status: shipments[0].status,
          choice: shipments[0].clientTransportChoice,
          packagesCount: shipments[0].packages?.length || 0,
          itemsCount: shipments[0].items?.length || 0
        })
      }
      // Transform shipments to match the orders format for display
      orders = shipments?.map((shipment: any) => {
        // Supabase returns relations as arrays - handle both formats
        const packages = Array.isArray(shipment.packages) 
          ? shipment.packages 
          : shipment.packages 
            ? [shipment.packages] 
            : []
        
        // Handle items - Supabase returns as array
        const items = Array.isArray(shipment.items) 
          ? shipment.items 
          : shipment.items 
            ? [shipment.items] 
            : []
        
        return {
          id: shipment.id,
          type: 'SHIPMENT',
          shipmentId: shipment.id,
          status: shipment.status,
          createdAt: shipment.createdAt,
          Client: shipment.Client,
          packages: packages,
          calculatedPriceEur: shipment.calculatedPriceEur,
          clientTransportChoice: shipment.clientTransportChoice,
          transportMode: shipment.transportMode,
          ownTransportVehicleReg: shipment.ownTransportVehicleReg,
          ownTransportTrailerReg: shipment.ownTransportTrailerReg,
          ownTransportCarrier: shipment.ownTransportCarrier,
          ownTransportTrackingNumber: shipment.ownTransportTrackingNumber,
          ownTransportPlannedLoadingDate: shipment.ownTransportPlannedLoadingDate,
          transportCompanyName: shipment.transportCompanyName,
          plannedLoadingDate: shipment.plannedLoadingDate,
          plannedDeliveryDateFrom: shipment.plannedDeliveryDateFrom,
          plannedDeliveryDateTo: shipment.plannedDeliveryDateTo,
          warehouseOrders: items.map((item: any) => item.warehouseOrder).filter(Boolean),
        }
      }) || []
    }
  } else {
    // For other statuses, fetch WarehouseOrders as before
    let query = supabase
      .from('WarehouseOrder')
      .select('*, Client:clientId(displayName, clientCode), sourceDelivery:sourceDeliveryId(id, deliveryNumber, supplierName, goodsDescription)')
      .order('createdAt', { ascending: false })

    if (statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter)
    }

    const { data: warehouseOrders, error: ordersError } = await query
    
    if (ordersError) {
      error = ordersError
      console.error('Error fetching warehouse orders:', ordersError)
    } else {
      orders = warehouseOrders || []
    }
  }

  const statusOptions = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'AT_WAREHOUSE', label: 'Na magazynie' },
    { value: 'BEING_PACKED', label: 'W przygotowaniu' },
    { value: 'TO_PACK', label: 'Do pakowania' },
    { value: 'PACKED', label: 'Spakowane' },
    { value: 'READY_FOR_QUOTE', label: 'Gotowe do wyceny' },
    { value: 'READY_TO_SHIP', label: 'Gotowe do wysyłki' },
    { value: 'SHIPPED', label: 'Wysłane' },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Zamówienia magazynowe</h1>
        <Link
          href="/warehouse/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {/* Filtry statusów */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Link
              key={option.value}
              href={`/warehouse/orders${option.value !== 'ALL' ? `?status=${option.value}` : ''}`}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === option.value || (statusFilter === undefined && option.value === 'ALL')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {order.type === 'SHIPMENT' ? (
                        // Display as ShipmentOrder with packages
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              Shipment #{order.shipmentId.slice(-8)}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Gotowe do wysyłki
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
                          {order.warehouseOrders && order.warehouseOrders.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Zamówienia w shipmentcie:</span>
                              <ul className="mt-1 ml-4 space-y-1">
                                {order.warehouseOrders.map((wo: any) => (
                                  <li key={wo.id} className="text-xs">
                                    • {wo.sourceDelivery?.deliveryNumber || wo.id.slice(-8)} - {wo.sourceDelivery?.supplierName || 'Unknown'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {order.packages && order.packages.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm font-medium text-gray-700 mb-1">Paczki/Palety:</div>
                              <div className="space-y-1">
                                {order.packages.map((pkg: any, idx: number) => (
                                  <div key={pkg.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{pkg.type === 'PALLET' ? 'Paleta' : 'Paczka'} {idx + 1}:</span>{' '}
                                    {pkg.widthCm}×{pkg.lengthCm}×{pkg.heightCm} cm
                                    {pkg.weightKg && `, ${pkg.weightKg.toFixed(1)} kg`}
                                    {pkg.volumeCbm && `, ${pkg.volumeCbm.toFixed(3)} m³`}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-sm text-gray-700">
                                <span className="font-medium">Łącznie:</span>{' '}
                                {order.packages.reduce((sum: number, p: any) => sum + (p.weightKg || 0), 0).toFixed(1)} kg,{' '}
                                {order.packages.reduce((sum: number, p: any) => sum + (p.volumeCbm || 0), 0).toFixed(3)} m³
                              </div>
                            </div>
                          )}
                          {order.calculatedPriceEur && (
                            <div className="mt-2 text-sm text-green-700 font-medium">
                              Cena transportu: €{order.calculatedPriceEur.toFixed(2)}
                            </div>
                          )}
                          {/* Transport details */}
                          {order.clientTransportChoice === 'OWN_TRANSPORT' && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="text-sm font-medium text-yellow-900 mb-2">Transport własny klienta:</div>
                              {!order.ownTransportVehicleReg && !order.ownTransportCarrier && (
                                <div className="text-xs text-yellow-800 mb-2 italic">
                                  ⚠️ Klient wybrał własny transport, ale jeszcze nie podał szczegółów pojazdu/przewoźnika
                                </div>
                              )}
                              {order.ownTransportVehicleReg && (
                                <div className="text-xs text-yellow-800">
                                  <span className="font-medium">Pojazd:</span> {order.ownTransportVehicleReg}
                                  {order.ownTransportTrailerReg && ` + Przyczepa: ${order.ownTransportTrailerReg}`}
                                </div>
                              )}
                              {order.ownTransportCarrier && order.ownTransportTrackingNumber && (
                                <div className="text-xs text-yellow-800">
                                  <span className="font-medium">Przewoźnik:</span> {order.ownTransportCarrier}
                                  <br />
                                  <span className="font-medium">Nr śledzenia:</span> {order.ownTransportTrackingNumber}
                                </div>
                              )}
                              {order.ownTransportPlannedLoadingDate && (
                                <div className="text-xs text-yellow-800 mt-1">
                                  <span className="font-medium">Planowana data załadunku:</span>{' '}
                                  {new Date(order.ownTransportPlannedLoadingDate).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {order.clientTransportChoice === 'ACCEPT' && order.transportCompanyName && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="text-sm font-medium text-blue-900 mb-2">Transport MAK:</div>
                              <div className="text-xs text-blue-800">
                                <span className="font-medium">Firma transportowa:</span> {order.transportCompanyName}
                              </div>
                              {order.plannedLoadingDate && (
                                <div className="text-xs text-blue-800 mt-1">
                                  <span className="font-medium">Planowana data załadunku:</span>{' '}
                                  {new Date(order.plannedLoadingDate).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              )}
                              {order.plannedDeliveryDateFrom && (
                                <div className="text-xs text-blue-800 mt-1">
                                  <span className="font-medium">Planowana data dostawy:</span>{' '}
                                  {new Date(order.plannedDeliveryDateFrom).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                  {order.plannedDeliveryDateTo && (
                                    <>
                                      {' - '}
                                      {new Date(order.plannedDeliveryDateTo).toLocaleDateString('pl-PL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Transport details form for MAK transport */}
                          {order.clientTransportChoice === 'ACCEPT' && (
                            <div className="mt-3">
                              <TransportDetailsForm
                                shipmentId={order.shipmentId}
                                currentData={{
                                  transportCompanyName: order.transportCompanyName,
                                  plannedLoadingDate: order.plannedLoadingDate,
                                  plannedDeliveryDateFrom: order.plannedDeliveryDateFrom,
                                  plannedDeliveryDateTo: order.plannedDeliveryDateTo,
                                }}
                                onSuccess={() => {
                                  window.location.reload()
                                }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        // Display as regular WarehouseOrder
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {order.sourceDelivery?.deliveryNumber 
                                ? `Dostawa ${order.sourceDelivery.deliveryNumber}`
                                : `Zamówienie #${order.id.slice(-8)}`}
                            </p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {order.status}
                            </span>
                          </div>
                          {order.sourceDelivery?.supplierName && (
                            <div className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Dostawca:</span> {order.sourceDelivery.supplierName}
                              {order.sourceDelivery.goodsDescription && (
                                <span className="text-gray-500"> - {order.sourceDelivery.goodsDescription}</span>
                              )}
                            </div>
                          )}
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <p className="truncate">
                              <span className="font-medium">Klient:</span> {(order.Client as any)?.displayName || 'Brak'}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {(order.Client as any)?.clientCode || 'Brak kodu'}
                            </span>
                          </div>
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
                          {order.storageDays > 0 && (
                            <div className="mt-1 text-sm text-gray-500">
                              Dni składowania: {order.storageDays}
                            </div>
                          )}
                          {order.receivedAt && (
                            <div className="mt-1 text-xs text-gray-400">
                              Przyjęto: {new Date(order.receivedAt).toLocaleDateString('pl-PL')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
                      {order.type === 'SHIPMENT' && (
                        <>
                          {(order.status === 'READY_FOR_LOADING' || order.status === 'AWAITING_ACCEPTANCE') && (
                            <ConfirmShipmentButton shipmentId={order.shipmentId} />
                          )}
                          {order.status === 'IN_TRANSIT' && (
                            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600">
                              ✓ Wysłane
                            </span>
                          )}
                        </>
                      )}
                      {order.type !== 'SHIPMENT' && (
                        <>
                          {order.status === 'TO_PACK' && (
                            <Link
                              href={`/warehouse/pack-order/${order.id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              Pakuj
                            </Link>
                          )}
                          {(order.status === 'AT_WAREHOUSE' || order.status === 'BEING_PACKED') && (
                            <Link
                              href={`/warehouse/pack-order/${order.id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              {order.status === 'BEING_PACKED' ? 'Kontynuuj pakowanie' : 'Rozpocznij pakowanie'}
                            </Link>
                          )}
                          {order.status === 'PACKED' && (
                            <MarkReadyForQuoteButton orderId={order.id} />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Brak zamówień z wybranym statusem</p>
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

