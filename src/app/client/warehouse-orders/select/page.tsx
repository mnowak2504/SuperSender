'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import Link from 'next/link'
import { Check, Package, ArrowRight } from 'lucide-react'

export default function SelectWarehouseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
    fetchAddresses()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/client/warehouse-orders')
      if (res.ok) {
        const data = await res.json()
        // Show AT_WAREHOUSE and READY_TO_SHIP orders (exclude already shipped)
        const availableOrders = data.filter(
          (o: any) => o.status === 'AT_WAREHOUSE' || o.status === 'READY_TO_SHIP'
        )
        setOrders(availableOrders)
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
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          transportMode: 'MAK', // Default to MAK transport
          warehouseOrderIds: selectedOrders,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create shipment')
      }

      const shipment = await res.json()
      router.push(`/client/shipments/${shipment.id}/transport-choice`)
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment. Please try again.')
      setSubmitting(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Shipment</h1>
              <p className="text-sm text-gray-500 mt-1">
                Select warehouse orders you want to ship
              </p>
            </div>
            <Link
              href="/client/warehouse-orders"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Orders
            </Link>
          </div>

          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders available for shipment.</p>
              <p className="text-xs text-gray-400 mt-2">
                Orders will appear here once they are received at the warehouse.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Orders Selection */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Available Orders ({selectedOrders.length} selected)
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {orders.map((order: any) => {
                      const isSelected = selectedOrders.includes(order.id)
                      return (
                        <label
                          key={order.id}
                          className={`flex items-start p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOrder(order.id)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {order.delivery?.deliveryNumber || order.sourceDeliveryId?.slice(0, 8)}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {order.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.delivery?.supplierName || 'Unknown Supplier'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {order.delivery?.goodsDescription || 'No description'}
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <div>Received: {formatDate(order.receivedAt)}</div>
                                {order.warehouseLocation && (
                                  <div className="mt-1">Location: {order.warehouseLocation}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Delivery Address Selection */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
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
                    <div className="space-y-3">
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
                            <div className="flex items-center justify-between">
                              <div>
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
                            </div>
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
                <div className="flex justify-end gap-4">
                  <Link
                    href="/client/warehouse-orders"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || selectedOrders.length === 0 || !selectedAddressId}
                    className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      'Creating...'
                    ) : (
                      <>
                        Continue to Transport Selection
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}

