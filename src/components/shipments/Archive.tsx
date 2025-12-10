'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, CheckCircle, ChevronUp } from 'lucide-react'

interface ArchivedShipment {
  id: string
  packingOrderNumber?: string | null
  createdAt: string
  status: string
  calculatedPriceEur?: number
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

interface ArchiveProps {
  shipments: ArchivedShipment[]
}

export default function Archive({ shipments }: ArchiveProps) {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(true)

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
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Archive</h3>
              <p className="text-xs text-gray-500">Delivered shipments</p>
            </div>
          </div>
        </div>
        <div className="py-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No archived shipments</p>
          <p className="text-xs text-gray-400 mt-2">
            Delivered shipments will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Package className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Archive</h3>
            <p className="text-xs text-gray-500">
              {shipments.length} {shipments.length === 1 ? 'delivered shipment' : 'delivered shipments'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isCollapsed ? (
            <>
              <span>Show</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Hide</span>
              <ChevronUp className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
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
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalOrders} order{totalOrders !== 1 ? 's' : ''} • Delivered {formatDate(shipment.createdAt)}
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
                                {delivery?.deliveryNumber && (
                                  <span className="text-xs font-mono text-gray-500">
                                    {delivery.deliveryNumber}
                                  </span>
                                )}
                              </div>
                              {delivery && (
                                <div className="text-xs text-gray-600 mt-1">
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
                  {shipment.calculatedPriceEur && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Transport cost:</span> €{shipment.calculatedPriceEur.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}

