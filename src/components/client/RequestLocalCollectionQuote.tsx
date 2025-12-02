'use client'

import { useState } from 'react'
import { Truck, X, Loader2 } from 'lucide-react'
import { calculateVolumeCbm } from '@/lib/warehouse-calculations'

interface RequestLocalCollectionQuoteProps {
  onClose: () => void
  onSuccess: () => void
}

export default function RequestLocalCollectionQuote({ onClose, onSuccess }: RequestLocalCollectionQuoteProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    widthCm: '',
    lengthCm: '',
    heightCm: '',
    weightKg: '',
    collectionAddressLine1: '',
    collectionAddressLine2: '',
    collectionCity: '',
    collectionPostCode: '',
    clientNotes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Calculate volume
      const volumeCbm = calculateVolumeCbm(
        parseFloat(formData.widthCm),
        parseFloat(formData.lengthCm),
        parseFloat(formData.heightCm)
      )

      const res = await fetch('/api/client/local-collection-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          widthCm: parseFloat(formData.widthCm),
          lengthCm: parseFloat(formData.lengthCm),
          heightCm: parseFloat(formData.heightCm),
          weightKg: parseFloat(formData.weightKg),
          volumeCbm,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit quote request')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const calculatedVolume = formData.widthCm && formData.lengthCm && formData.heightCm
    ? calculateVolumeCbm(parseFloat(formData.widthCm), parseFloat(formData.lengthCm), parseFloat(formData.heightCm))
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Request Local Collection Quote</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Package Dimensions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="widthCm" className="block text-sm font-medium text-gray-700 mb-1">
                  Width (cm) *
                </label>
                <input
                  type="number"
                  id="widthCm"
                  name="widthCm"
                  required
                  min="1"
                  step="0.1"
                  value={formData.widthCm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lengthCm" className="block text-sm font-medium text-gray-700 mb-1">
                  Length (cm) *
                </label>
                <input
                  type="number"
                  id="lengthCm"
                  name="lengthCm"
                  required
                  min="1"
                  step="0.1"
                  value={formData.lengthCm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  id="heightCm"
                  name="heightCm"
                  required
                  min="1"
                  step="0.1"
                  value={formData.heightCm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  id="weightKg"
                  name="weightKg"
                  required
                  min="0.1"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {calculatedVolume > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Calculated volume: <span className="font-medium">{calculatedVolume.toFixed(3)} m³</span> (with 5% buffer)
              </p>
            )}
          </div>

          {/* Collection Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Address</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="collectionAddressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  id="collectionAddressLine1"
                  name="collectionAddressLine1"
                  required
                  value={formData.collectionAddressLine1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="collectionAddressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="collectionAddressLine2"
                  name="collectionAddressLine2"
                  value={formData.collectionAddressLine2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="collectionCity" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="collectionCity"
                    name="collectionCity"
                    required
                    value={formData.collectionCity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="collectionPostCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="collectionPostCode"
                    name="collectionPostCode"
                    required
                    value={formData.collectionPostCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="clientNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (optional)
            </label>
            <textarea
              id="clientNotes"
              name="clientNotes"
              rows={3}
              value={formData.clientNotes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information about the collection..."
            />
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

