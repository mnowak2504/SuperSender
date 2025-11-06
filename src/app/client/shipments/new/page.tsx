'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'

export default function NewShipmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [formData, setFormData] = useState({
    deliveryAddressId: '',
    transportMode: 'MAK',
    timeWindowFrom: '',
    timeWindowTo: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
    fetchAddresses()
  }, [])

  const fetchOrders = async () => {
    const res = await fetch('/api/client/warehouse-orders')
    const data = await res.json()
    setOrders(data.filter((o: any) => o.status === 'READY_TO_SHIP'))
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/client/addresses')
      const data = await res.json()
      const addressList = data.addresses || []
      setAddresses(addressList)
      // Set default address if available
      const defaultAddress = addressList.find((a: any) => a.isDefault) || addressList[0]
      if (defaultAddress) {
        setFormData((prev) => ({ ...prev, deliveryAddressId: defaultAddress.id }))
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (selectedOrders.length === 0) {
      setError('Please select at least one order')
      setLoading(false)
      return
    }

    if (!formData.deliveryAddressId) {
      setError('Please select a delivery address')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/client/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          warehouseOrderIds: selectedOrders,
          timeWindowFrom: formData.timeWindowFrom || null,
          timeWindowTo: formData.timeWindowTo || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create shipment')
      }

      router.push('/client/shipments')
    } catch (err) {
      setError('Failed to submit shipment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Request Shipment</h1>

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Select Orders</span>
              <span className="text-sm text-gray-600">Delivery Address</span>
              <span className="text-sm text-gray-600">Transport Mode</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {/* Step 1: Select Orders */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Select Orders to Ship</h2>
                {orders.length === 0 ? (
                  <p className="text-gray-500">No orders ready for shipment</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <label
                        key={order.id}
                        className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id])
                            } else {
                              setSelectedOrders(selectedOrders.filter((id) => id !== order.id))
                            }
                          }}
                          className="mr-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Order #{order.id.slice(0, 8)}</div>
                          <div className="text-sm text-gray-500">
                            Weight: {order.packedWeightKg || 'N/A'} kg | Dimensions:{' '}
                            {order.packedLengthCm && order.packedWidthCm && order.packedHeightCm
                              ? `${order.packedLengthCm}x${order.packedWidthCm}x${order.packedHeightCm} cm`
                              : 'N/A'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={selectedOrders.length === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <div>
                  <label
                    htmlFor="deliveryAddressId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Address
                  </label>
                  <select
                    id="deliveryAddressId"
                    required
                    value={formData.deliveryAddressId}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryAddressId: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an address</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.contactName} - {addr.line1}, {addr.city}, {addr.country}
                        {addr.isDefault && ' (Default)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.deliveryAddressId}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Transport Mode */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Transport Organization</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="transportMode"
                        value="MAK"
                        checked={formData.transportMode === 'MAK'}
                        onChange={(e) =>
                          setFormData({ ...formData, transportMode: e.target.value })
                        }
                        className="mr-4"
                      />
                      <div>
                        <div className="font-medium">Transport by MAK</div>
                        <div className="text-sm text-gray-500">
                          MAK will organize and handle the shipment
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="transportMode"
                        value="CLIENT_OWN"
                        checked={formData.transportMode === 'CLIENT_OWN'}
                        onChange={(e) =>
                          setFormData({ ...formData, transportMode: e.target.value })
                        }
                        className="mr-4"
                      />
                      <div>
                        <div className="font-medium">I will organize myself</div>
                        <div className="text-sm text-gray-500">
                          Client will arrange their own transportation
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.transportMode === 'MAK' && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Loading hours:</strong> Monday-Friday 8:00-16:00. Outside these hours,
                      please contact your caretaker.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </ClientLayout>
  )
}

