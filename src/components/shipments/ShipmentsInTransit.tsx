'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, Truck, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ShipmentInTransit {
  id: string
  packingOrderNumber?: string | null
  createdAt: string
  status: string
  calculatedPriceEur?: number
  clientTransportChoice?: string
  ownTransportVehicleReg?: string
  ownTransportTrailerReg?: string
  ownTransportCarrier?: string
  ownTransportTrackingNumber?: string
  transportCompanyName?: string
  items: Array<{
    id: string
    warehouseOrder: {
      id: string
      status: string
      delivery?: {
        deliveryNumber?: string
        supplierName?: string
        goodsDescription?: string
      }
    }
  }>
}

interface ShipmentsInTransitProps {
  shipments: ShipmentInTransit[]
}

export default function ShipmentsInTransit({ shipments }: ShipmentsInTransitProps) {
  const router = useRouter()
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const toggleShipment = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments)
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId)
    } else {
      newExpanded.add(shipmentId)
    }
    setExpandedShipments(newExpanded)
  }

  const handleConfirmDelivery = async (shipmentId: string) => {
    if (!confirm('Czy na pewno chcesz potwierdzić dostawę tego shipmentu?')) {
      return
    }

    setConfirmingId(shipmentId)

    try {
      const response = await fetch(`/api/client/shipments/${shipmentId}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Błąd przy potwierdzaniu dostawy')
      }

      // Refresh the page
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Wystąpił błąd')
      setConfirmingId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (shipments.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shipments in Transit</h3>
            <p className="text-xs text-gray-500">
              {shipments.length} {shipments.length === 1 ? 'shipment' : 'shipments'} in transit
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {shipments.map((shipment) => {
          const isExpanded = expandedShipments.has(shipment.id)
          const totalOrders = shipment.items?.length || 0

          return (
            <div key={shipment.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleShipment(shipment.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {shipment.packingOrderNumber || `Shipment #${shipment.id.slice(-8)}`}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        In Transit
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalOrders} order{totalOrders !== 1 ? 's' : ''} • Shipped {formatDate(shipment.createdAt)}
                    </p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">Orders in this shipment:</p>
                    {shipment.items?.map((item) => {
                      const wo = item.warehouseOrder
                      const delivery = wo.delivery
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-md p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  Order #{wo.id.slice(-8)}
                                </span>
                              </div>
                              {delivery && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {delivery.deliveryNumber && (
                                    <span className="font-mono text-blue-600 mr-2">
                                      {delivery.deliveryNumber}
                                    </span>
                                  )}
                                  {delivery.supplierName && (
                                    <span>{delivery.supplierName}</span>
                                  )}
                                  {delivery.goodsDescription && (
                                    <span className="text-gray-500"> • {delivery.goodsDescription}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        🚚 Shipment is in transit
                      </p>
                      {shipment.transportCompanyName && (
                        <p className="text-xs text-blue-800">
                          <span className="font-medium">Transport company:</span> {shipment.transportCompanyName}
                        </p>
                      )}
                      {shipment.ownTransportVehicleReg && (
                        <p className="text-xs text-blue-800 mt-1">
                          <span className="font-medium">Vehicle:</span> {shipment.ownTransportVehicleReg}
                          {shipment.ownTransportTrailerReg && ` + ${shipment.ownTransportTrailerReg}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleConfirmDelivery(shipment.id)}
                      disabled={confirmingId === shipment.id}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {confirmingId === shipment.id ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

