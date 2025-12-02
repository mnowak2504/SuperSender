'use client'

import { useState } from 'react'
import { Calendar, Clock, X, Loader2, FileText, Key, Mail, XCircle } from 'lucide-react'

interface AcceptQuoteAndScheduleProps {
  quote: any
  onClose: () => void
  onSuccess: () => void
}

export default function AcceptQuoteAndSchedule({ quote, onClose, onSuccess }: AcceptQuoteAndScheduleProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    collectionContactName: '',
    collectionContactPhone: '',
    collectionDateFrom: '',
    collectionDateTo: '',
    orderNumber: '',
    orderDetails: '',
    pinCode: '',
  })

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/client/local-collection-quote/${quote.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionCountry: 'Poland', // Always Poland for local collection
          collectionContactName: formData.collectionContactName || null,
          collectionContactPhone: formData.collectionContactPhone || null,
          collectionDateFrom: formData.collectionDateFrom,
          collectionDateTo: formData.collectionDateTo,
          orderNumber: formData.orderNumber,
          orderDetails: formData.orderDetails || null,
          pinCode: formData.pinCode || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to accept quote and schedule collection')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Accept or Decline Quote</h2>
              <p className="text-sm text-gray-500">Quote: €{quote.quotedPriceEur?.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info about email contact */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Additional Information Required?</p>
              <p className="text-sm text-blue-700">
                If you need additional information or have questions, your sales representative will contact you via email.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAccept} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Quote Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Package:</p>
                <p className="font-medium text-gray-900">
                  {quote.widthCm}×{quote.lengthCm}×{quote.heightCm} cm, {quote.weightKg} kg
                </p>
                <p className="text-xs text-gray-500">{quote.volumeCbm.toFixed(3)} m³</p>
              </div>
              <div>
                <p className="text-gray-600">Collection Address:</p>
                <p className="font-medium text-gray-900">
                  {quote.collectionAddressLine1}
                  {quote.collectionAddressLine2 && `, ${quote.collectionAddressLine2}`}
                </p>
                <p className="text-xs text-gray-500">
                  {quote.collectionCity}, {quote.collectionPostCode}, Poland
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information (Optional) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="collectionContactName" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="collectionContactName"
                  name="collectionContactName"
                  value={formData.collectionContactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="collectionContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="collectionContactPhone"
                  name="collectionContactPhone"
                  value={formData.collectionContactPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Collection Time Window */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Collection Time Window *
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="collectionDateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  From (Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  id="collectionDateFrom"
                  name="collectionDateFrom"
                  required
                  value={formData.collectionDateFrom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="collectionDateTo" className="block text-sm font-medium text-gray-700 mb-1">
                  To (Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  id="collectionDateTo"
                  name="collectionDateTo"
                  required
                  value={formData.collectionDateTo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Documentation for Collection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Documentation for Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number *
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  required
                  value={formData.orderNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Order number from seller"
                />
              </div>
              <div>
                <label htmlFor="orderDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Details (Optional)
                </label>
                <textarea
                  id="orderDetails"
                  name="orderDetails"
                  rows={3}
                  value={formData.orderDetails}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional order details/description"
                />
              </div>
              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  PIN Code (Optional)
                </label>
                <input
                  type="text"
                  id="pinCode"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PIN code if required by seller"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Accept & Schedule Collection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
