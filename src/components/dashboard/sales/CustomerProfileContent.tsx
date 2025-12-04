'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, FileText, MessageSquare, Image, Plus, Calendar, Mail } from 'lucide-react'
import SubscriptionManager from '@/components/admin/SubscriptionManager'

interface TimelineItem {
  id: string
  type: 'DELIVERY' | 'SHIPMENT' | 'INVOICE' | 'QUOTE_REQUEST'
  date: string
  title: string
  description: string
  status: string
  receivedAt?: string
  transportChoice?: string
  transportCompany?: string
  dueDate?: string
}

interface DeliveryPhoto {
  id: string
  photoUrl: string
  supplierName: string
  createdAt: string
}

interface Client {
  id: string
  displayName: string
  clientCode: string
  email: string
  country: string
  planId: string | null
  limitCbm: number
  createdAt: string
  subscriptionDiscount?: number | null
  additionalServicesDiscount?: number | null
  Plan?: {
    name: string
    priceEur?: number
    spaceLimitCbm?: number
    deliveriesPerMonth?: number
  } | Array<{
    name: string
    priceEur?: number
    spaceLimitCbm?: number
    deliveriesPerMonth?: number
  }>
  WarehouseCapacity?: {
    usedCbm: number
    limitCbm: number
    usagePercent: number
    isOverLimit: boolean
  }
  salesOwner?: {
    email: string
    name?: string
  }
}

interface CustomerProfileContentProps {
  client: Client
  timeline: TimelineItem[]
  deliveryPhotos: DeliveryPhoto[]
  isSuperAdmin?: boolean
  additionalCharges?: {
    overSpaceAmountEur: number
    additionalServicesAmountEur: number
    totalAmountEur: number
  } | null
}

export default function CustomerProfileContent({
  client,
  timeline,
  deliveryPhotos,
  isSuperAdmin = false,
  additionalCharges = null,
}: CustomerProfileContentProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  
  const capacity = Array.isArray(client.WarehouseCapacity)
    ? client.WarehouseCapacity[0]
    : client.WarehouseCapacity

  const usedCbm = capacity?.usedCbm || 0
  const limitCbm = capacity?.limitCbm || client.limitCbm || 0
  const usagePercent = capacity?.usagePercent || (limitCbm > 0 ? (usedCbm / limitCbm) * 100 : 0)
  const isOverLimit = capacity?.isOverLimit || false

  const getTimelineIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'DELIVERY':
        return <Package className="w-4 h-4" />
      case 'SHIPMENT':
        return <Truck className="w-4 h-4" />
      case 'INVOICE':
        return <FileText className="w-4 h-4" />
      case 'QUOTE_REQUEST':
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTimelineColor = (type: TimelineItem['type'], status: string) => {
    if (type === 'INVOICE') {
      if (status === 'PAID') return 'bg-green-100 text-green-800'
      if (status === 'OVERDUE') return 'bg-red-100 text-red-800'
      return 'bg-yellow-100 text-yellow-800'
    }
    if (type === 'SHIPMENT') {
      if (status === 'DELIVERED') return 'bg-green-100 text-green-800'
      if (status === 'IN_TRANSIT') return 'bg-blue-100 text-blue-800'
      return 'bg-gray-100 text-gray-800'
    }
    if (type === 'DELIVERY') {
      if (status === 'RECEIVED') return 'bg-green-100 text-green-800'
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.displayName}</h1>
            <p className="text-sm text-gray-500 font-mono">{client.clientCode}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Country</p>
                <p className="text-sm font-medium text-gray-900">{client.country || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                {(() => {
                  const plan = Array.isArray(client.Plan) ? client.Plan[0] : client.Plan
                  return (
                    <>
                      <p className="text-sm font-medium text-gray-900">{plan?.name || 'No Plan'}</p>
                      {plan && (
                        <p className="text-xs text-gray-500">
                          {plan.spaceLimitCbm?.toFixed(2) || 0} m³, {plan.deliveriesPerMonth || 0} deliveries/month
                        </p>
                      )}
                    </>
                  )
                })()}
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned Sales Owner</p>
                <p className="text-sm font-medium text-gray-900">
                  {client.salesOwner?.name || client.salesOwner?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Used / Limit</span>
                  <span className="text-sm font-medium text-gray-900">
                    {usedCbm.toFixed(2)} / {limitCbm.toFixed(2)} m³
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      isOverLimit
                        ? 'bg-red-500'
                        : usagePercent > 80
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usagePercent.toFixed(1)}% used
                  {isOverLimit && (
                    <span className="text-red-600 font-medium ml-2">
                      Over limit by {(usedCbm - limitCbm).toFixed(2)} m³
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Charges This Month */}
          {additionalCharges && additionalCharges.totalAmountEur > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">Additional Charges This Month</h2>
              <div className="space-y-2 text-sm">
                {additionalCharges.overSpaceAmountEur > 0 && (
                  <div className="flex justify-between text-yellow-800">
                    <span>Over-space storage:</span>
                    <span className="font-medium">€{additionalCharges.overSpaceAmountEur.toFixed(2)}</span>
                  </div>
                )}
                {additionalCharges.additionalServicesAmountEur > 0 && (
                  <div className="flex justify-between text-yellow-800">
                    <span>Additional services:</span>
                    <span className="font-medium">€{additionalCharges.additionalServicesAmountEur.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-yellow-200 font-semibold text-yellow-900">
                  <span>Total:</span>
                  <span>€{additionalCharges.totalAmountEur.toFixed(2)}</span>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  These charges will be included in the order when client requests a shipment.
                </p>
              </div>
            </div>
          )}

          {/* Subscription Management */}
          <SubscriptionManager
            clientId={client.id}
            currentPlanId={client.planId}
            subscriptionDiscount={client.subscriptionDiscount}
            additionalServicesDiscount={client.additionalServicesDiscount}
            isSuperAdmin={isSuperAdmin}
            onUpdate={() => window.location.reload()}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Mail className="w-4 h-4" />
                Send Message
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column - Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {timeline.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTimelineColor(item.type, item.status)}`}>
                    {getTimelineIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className={`inline-flex mt-2 px-2 py-1 text-xs font-medium rounded-full ${getTimelineColor(item.type, item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {timeline.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Notes & Photos */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">No notes yet. Click "Add Note" to add one.</p>
              {/* TODO: Implement notes functionality */}
            </div>
          </div>

          {/* Delivery Photos */}
          {deliveryPhotos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Delivery Photos</h2>
              <div className="grid grid-cols-2 gap-3">
                {deliveryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo.photoUrl)}
                    className="cursor-pointer aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.supplierName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Delivery photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

