'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'

export default function NewDeliveryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    supplierName: '',
    goodsDescription: '',
    orderNumber: '',
    clientReference: '',
    eta: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.supplierName || !formData.goodsDescription) {
      setError('Supplier name and goods description are required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/client/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eta: formData.eta || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create delivery' }))
        throw new Error(errorData.error || 'Failed to create delivery')
      }

      // Use window.location for full page reload to ensure session is updated
      window.location.href = '/client/deliveries'
    } catch (err) {
      setError('Failed to submit delivery. Please try again.')
      setLoading(false)
    }
  }

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Report Delivery</h1>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="supplierName"
                  required
                  value={formData.supplierName}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierName: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="goodsDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Goods Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="goodsDescription"
                  required
                  rows={4}
                  value={formData.goodsDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, goodsDescription: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">
                  Order Number (optional)
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, orderNumber: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="clientReference" className="block text-sm font-medium text-gray-700">
                  Client Reference (optional)
                </label>
                <input
                  type="text"
                  id="clientReference"
                  value={formData.clientReference}
                  onChange={(e) =>
                    setFormData({ ...formData, clientReference: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your internal reference"
                />
              </div>

              <div>
                <label htmlFor="eta" className="block text-sm font-medium text-gray-700">
                  Estimated Delivery Date (optional)
                </label>
                <input
                  type="date"
                  id="eta"
                  value={formData.eta}
                  onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ClientLayout>
  )
}

