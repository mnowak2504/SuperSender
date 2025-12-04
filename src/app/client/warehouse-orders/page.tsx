'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import Link from 'next/link'
import { ArrowRight, Package, Edit2, Check, X, Loader2 } from 'lucide-react'

function EditableDescription({ deliveryId, initialValue, onUpdate }: { deliveryId: string; initialValue: string; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = async () => {
    if (value.trim() === initialValue.trim()) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/client/deliveries/${deliveryId}/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goodsDescription: value.trim() }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update description')
      }

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="space-y-1">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          disabled={loading}
        />
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
            title="Save"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 group">
      <span className="flex-1">{value}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-700 transition-opacity"
        title="Edit description"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'AT_WAREHOUSE':
      return 'bg-blue-100 text-blue-800'
    case 'TO_PACK':
      return 'bg-yellow-100 text-yellow-800'
    case 'PACKED':
      return 'bg-green-100 text-green-800'
    case 'READY_FOR_QUOTE':
      return 'bg-purple-100 text-purple-800'
    case 'READY_TO_SHIP':
      return 'bg-indigo-100 text-indigo-800'
    case 'SHIPPED':
      return 'bg-gray-100 text-gray-800'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function WarehouseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showShipmentForm, setShowShipmentForm] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchAddresses()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/client/warehouse-orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/client/addresses')
      if (res.ok) {
        const data = await res.json()
        const addressList = data.addresses || []
        setAddresses(addressList)
        const defaultAddress = addressList.find((a: any) => a.isDefault) || addressList[0]
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const toggleOrder = (orderId: string) => {
    const newSelected = selectedOrders.includes(orderId)
      ? selectedOrders.filter((id) => id !== orderId)
      : [...selectedOrders, orderId]
    
    setSelectedOrders(newSelected)
    
    // Show/hide shipment form based on selection
    if (newSelected.length > 0) {
      setShowShipmentForm(true)
    } else {
      setShowShipmentForm(false)
    }
  }

  const handleShipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (selectedOrders.length === 0) {
      setError('Please select at least one order to ship')
      return
    }

    if (!selectedAddressId) {
      setError('Please select a delivery address')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/client/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddressId: selectedAddressId,
          transportMode: 'MAK',
          warehouseOrderIds: selectedOrders,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create shipment')
      }

      const shipment = await res.json()
      // Redirect to dashboard - transport choice will be available after warehouse packs
      router.push('/client/dashboard?shipment=created')
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment. Please try again.')
      setSubmitting(false)
    }
  }

  const canSelectOrder = (status: string) => {
    // Client can only select orders that are AT_WAREHOUSE (not yet selected for packing)
    return status === 'AT_WAREHOUSE'
  }

  const availableOrders = orders.filter((o: any) => canSelectOrder(o.status))

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Orders</h1>
            <Link
              href="/client/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No warehouse orders found.</p>
              <p className="text-xs text-gray-400 mt-2">
                Orders will appear here once deliveries are received by the warehouse.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Orders Table */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      All Orders
                    </h2>
                    {selectedOrders.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          {availableOrders.length > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedOrders.length === availableOrders.length && availableOrders.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrders(availableOrders.map((o: any) => o.id))
                                  setShowShipmentForm(true)
                                } else {
                                  setSelectedOrders([])
                                  setShowShipmentForm(false)
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          )}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Received Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                          <span className="ml-1 text-xs text-gray-400 font-normal">(editable)</span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order: any) => {
                        const delivery = order.delivery || order.sourceDelivery
                        const isSelectable = canSelectOrder(order.status)
                        const isSelected = selectedOrders.includes(order.id)
                        
                        return (
                          <tr 
                            key={order.id}
                            className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isSelectable ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleOrder(order.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {delivery?.deliveryNumber ? (
                                <span className="font-mono text-blue-600">{delivery.deliveryNumber}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(order.receivedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {delivery?.supplierName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {order.status === 'AT_WAREHOUSE' && delivery?.id ? (
                                <EditableDescription
                                  deliveryId={delivery.id}
                                  initialValue={delivery.goodsDescription || 'No description'}
                                  onUpdate={() => fetchOrders()}
                                />
                              ) : (
                                <span>{delivery?.goodsDescription || 'No description'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.warehouseLocation || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {order.sourceDeliveryId && (
                                <Link
                                  href={`/client/deliveries/${order.sourceDeliveryId}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View Details
                                </Link>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shipment Request Form */}
              {showShipmentForm && selectedOrders.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Request Shipment ({selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''})
                  </h2>
                  
                  <form onSubmit={handleShipmentSubmit} className="space-y-4">
                    {/* Delivery Address Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Address
                      </label>
                      {addresses.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <p className="text-yellow-800 text-sm">
                            No delivery address found. Please{' '}
                            <Link href="/client/settings" className="underline font-medium">
                              add an address
                            </Link>{' '}
                            first.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {addresses.map((address: any) => (
                            <label
                              key={address.id}
                              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                selectedAddressId === address.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                value={address.id}
                                checked={selectedAddressId === address.id}
                                onChange={(e) => setSelectedAddressId(e.target.value)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {address.name || address.street}
                                  {address.isDefault && (
                                    <span className="ml-2 text-xs text-blue-600">(Default)</span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {address.street}, {address.city}, {address.postalCode}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{address.country}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrders([])
                          setShowShipmentForm(false)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !selectedAddressId}
                        className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          'Creating...'
                        ) : (
                          <>
                            Request Shipment
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
