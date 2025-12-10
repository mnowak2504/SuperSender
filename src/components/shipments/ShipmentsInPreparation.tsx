'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, Truck } from 'lucide-react'
import Link from 'next/link'

interface ShipmentInPrep {
  id: string
  createdAt: string
  status: string
  calculatedPriceEur?: number
  clientTransportChoice?: string
  transportMode?: string
  ownTransportVehicleReg?: string
  ownTransportTrailerReg?: string
  ownTransportCarrier?: string
  ownTransportTrackingNumber?: string
  ownTransportPlannedLoadingDate?: string
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

interface ShipmentsInPreparationProps {
  shipments: ShipmentInPrep[]
}

export default function ShipmentsInPreparation({ shipments }: ShipmentsInPreparationProps) {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())

  const toggleShipment = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments)
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId)
    } else {
      newExpanded.add(shipmentId)
    }
    setExpandedShipments(newExpanded)
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
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Package className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shipments in Preparation</h3>
            <p className="text-xs text-gray-500">
              {shipments.filter(s => s.status === 'REQUESTED').length} being packed
              {(shipments.filter(s => s.status === 'QUOTED').length > 0 || shipments.filter(s => s.status === 'AWAITING_ACCEPTANCE').length > 0) && (
                <span>
                  {' • '}
                  <span className="text-green-600 font-medium">
                    {shipments.filter(s => s.status === 'QUOTED' || s.status === 'AWAITING_ACCEPTANCE').length} ready for transport choice
                  </span>
                </span>
              )}
              {shipments.filter(s => s.status === 'AWAITING_PAYMENT').length > 0 && (
                <span>
                  {' • '}
                  <span className="text-blue-600 font-medium">
                    {shipments.filter(s => s.status === 'AWAITING_PAYMENT').length} awaiting payment
                  </span>
                </span>
              )}
              {shipments.filter(s => s.status === 'READY_FOR_LOADING').length > 0 && (
                <span>
                  {' • '}
                  <span className="text-yellow-600 font-medium">
                    {shipments.filter(s => s.status === 'READY_FOR_LOADING').length} ready for pickup
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {shipments
          .sort((a, b) => {
            // Sort: QUOTED/AWAITING_ACCEPTANCE first, then AWAITING_PAYMENT, then READY_FOR_LOADING, then REQUESTED
            const statusOrder: Record<string, number> = {
              'QUOTED': 1,
              'AWAITING_ACCEPTANCE': 1,
              'AWAITING_PAYMENT': 2,
              'READY_FOR_LOADING': 3,
              'REQUESTED': 4,
            }
            const orderA = statusOrder[a.status] || 99
            const orderB = statusOrder[b.status] || 99
            return orderA - orderB
          })
          .map((shipment) => {
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
                        Shipment #{shipment.id.slice(-8)}
                      </span>
                      {(shipment.status === 'QUOTED' || shipment.status === 'AWAITING_ACCEPTANCE') ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Ready for Transport Choice
                        </span>
                      ) : shipment.status === 'READY_FOR_LOADING' ? (
                        <span className={`text-xs px-2 py-1 rounded ${
                          shipment.clientTransportChoice === 'OWN_TRANSPORT' || shipment.transportMode === 'CLIENT_OWN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {shipment.clientTransportChoice === 'OWN_TRANSPORT' || shipment.transportMode === 'CLIENT_OWN'
                            ? 'Ready for Pickup'
                            : 'Ready for Loading'}
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          In Preparation
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalOrders} order{totalOrders !== 1 ? 's' : ''} • Created {formatDate(shipment.createdAt)}
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
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {wo.status.replace(/_/g, ' ')}
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
                    {(shipment.status === 'QUOTED' || shipment.status === 'AWAITING_ACCEPTANCE') ? (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm font-medium text-green-900 mb-1">
                            ✅ Ready for transport selection!
                          </p>
                          {shipment.calculatedPriceEur ? (
                            <p className="text-sm text-green-700">
                              Calculated price: <strong>€{shipment.calculatedPriceEur.toFixed(2)}</strong>
                            </p>
                          ) : (
                            <p className="text-sm text-green-700">
                              Please choose your transport method to proceed.
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/client/shipments/${shipment.id}/transport-choice`}
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Choose Transport Method
                        </Link>
                      </div>
                    ) : shipment.status === 'AWAITING_PAYMENT' ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            💳 Awaiting Payment
                          </p>
                          {shipment.calculatedPriceEur ? (
                            <p className="text-sm text-blue-700">
                              Transport price: <strong>€{shipment.calculatedPriceEur.toFixed(2)}</strong>
                            </p>
                          ) : (
                            <p className="text-sm text-blue-700">
                              A proforma invoice has been created. Please check your invoices section.
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-2">
                            A proforma invoice has been created. You can pay by bank transfer or request a payment link.
                          </p>
                        </div>
                        <Link
                          href="/client/invoices"
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          View Invoices
                        </Link>
                      </div>
                    ) : shipment.status === 'READY_FOR_LOADING' ? (
                      // Check if it's own transport or MAK transport
                      shipment.clientTransportChoice === 'OWN_TRANSPORT' || shipment.transportMode === 'CLIENT_OWN' ? (
                        <div className="space-y-3">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm font-medium text-yellow-900 mb-2">
                              🚚 Ready for your own transport pickup
                            </p>
                            {shipment.ownTransportVehicleReg && (
                              <p className="text-xs text-yellow-800">
                                <span className="font-medium">Vehicle:</span> {shipment.ownTransportVehicleReg}
                                {shipment.ownTransportTrailerReg && ` + Trailer: ${shipment.ownTransportTrailerReg}`}
                              </p>
                            )}
                            {shipment.ownTransportCarrier && shipment.ownTransportTrackingNumber && (
                              <p className="text-xs text-yellow-800 mt-1">
                                <span className="font-medium">Carrier:</span> {shipment.ownTransportCarrier}
                                <br />
                                <span className="font-medium">Tracking:</span> {shipment.ownTransportTrackingNumber}
                              </p>
                            )}
                            {shipment.ownTransportPlannedLoadingDate && (
                              <p className="text-xs text-yellow-800 mt-1">
                                <span className="font-medium">Planned loading date:</span>{' '}
                                {new Date(shipment.ownTransportPlannedLoadingDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                            {!shipment.ownTransportVehicleReg && !shipment.ownTransportCarrier && (
                              <p className="text-xs text-yellow-700 mt-2 italic">
                                ⚠️ Please add your transport details
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/client/shipments/${shipment.id}/transport-choice`}
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 transition-colors"
                          >
                            {!shipment.ownTransportVehicleReg && !shipment.ownTransportCarrier 
                              ? 'Add Transport Details'
                              : 'Update Transport Details'}
                          </Link>
                        </div>
                      ) : (
                        // MAK transport - paid and ready for loading
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm font-medium text-green-900 mb-2">
                              ✓ Ready for Loading
                            </p>
                            <p className="text-xs text-green-800">
                              Your shipment has been paid and is ready for loading. Our transport company will pick it up soon.
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-gray-500">
                        ⏳ Warehouse is packing these orders. You'll receive an email notification when ready.
                      </p>
                    )}
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

