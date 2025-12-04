'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, Calendar, User, Phone, Loader2 } from 'lucide-react'

interface ReceiveLocalCollectionFormProps {
  quote: any
}

export default function ReceiveLocalCollectionForm({ quote }: ReceiveLocalCollectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    condition: 'NO_REMARKS',
    warehouseLocation: '',
    warehouseInternalNumber: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/warehouse/receive-local-collection/${quote.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: formData.condition,
          warehouseLocation: formData.warehouseLocation || null,
          warehouseInternalNumber: formData.warehouseInternalNumber || null,
          notes: formData.notes || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Nie udało się przyjąć transportu lokalnego')
      }

      // Redirect to local collections list
      router.push('/warehouse/local-collections')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Przyjmij transport lokalny</h1>
        <Link
          href="/warehouse/local-collections"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do listy
        </Link>
      </div>

      {/* Quote Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły transportu lokalnego</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Klient</p>
            <p className="text-sm text-gray-900">{quote.Client?.displayName || 'Brak'}</p>
            <p className="text-xs text-gray-500 font-mono">{quote.Client?.clientCode || '-'}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="font-medium">Wymiary</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">
              {quote.widthCm} × {quote.lengthCm} × {quote.heightCm} cm
            </p>
            <p className="text-xs text-gray-500 ml-6">
              Objętość: {quote.volumeCbm.toFixed(3)} m³ | Waga: {quote.weightKg} kg
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Adres odbioru</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">
              {quote.collectionAddressLine1}
              {quote.collectionAddressLine2 && `, ${quote.collectionAddressLine2}`}
            </p>
            <p className="text-xs text-gray-500 ml-6">
              {quote.collectionCity}, {quote.collectionPostCode}
            </p>
          </div>

          {quote.collectionDateFrom && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Termin odbioru</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">
                {new Date(quote.collectionDateFrom).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {(quote.collectionContactName || quote.collectionContactPhone) && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="font-medium">Kontakt</span>
              </div>
              {quote.collectionContactName && (
                <p className="text-sm text-gray-900 ml-6">{quote.collectionContactName}</p>
              )}
              {quote.collectionContactPhone && (
                <div className="flex items-center gap-2 ml-6">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <p className="text-sm text-gray-900">{quote.collectionContactPhone}</p>
                </div>
              )}
            </div>
          )}

          {quote.orderNumber && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Numer zamówienia</p>
              <p className="text-sm text-gray-900">{quote.orderNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Formularz przyjęcia</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Condition */}
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Stan opakowań <span className="text-red-500">*</span>
            </label>
            <select
              id="condition"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="NO_REMARKS">Bez uwag</option>
              <option value="MINOR_DAMAGE">Uszkodzenie opakowania nie zagrażające zawartości</option>
              <option value="MODERATE_DAMAGE">Poważniejsze uszkodzenie opakowania - zawartość do weryfikacji</option>
              <option value="SEVERE_DAMAGE">Poważne uszkodzenie</option>
            </select>
            {formData.condition !== 'NO_REMARKS' && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>UWAGA:</strong> Przedstawiciel handlowy wyśle zdjęcia uszkodzenia w ciągu 24h do potwierdzenia jaka powinna być dalsza akcja.
                </p>
              </div>
            )}
          </div>

          {/* Warehouse Location */}
          <div>
            <label htmlFor="warehouseLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Lokalizacja w magazynie
            </label>
            <input
              type="text"
              id="warehouseLocation"
              value={formData.warehouseLocation}
              onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
              placeholder="np. A-12-3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Warehouse Internal Number */}
          <div>
            <label htmlFor="warehouseInternalNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Numer wewnętrzny magazynu (z naklejki)
            </label>
            <input
              type="text"
              id="warehouseInternalNumber"
              value={formData.warehouseInternalNumber}
              onChange={(e) => setFormData({ ...formData, warehouseInternalNumber: e.target.value })}
              placeholder="np. AA-001"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Numer z fizycznej naklejki na zamówieniu.</p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Uwagi
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Dodatkowe uwagi dotyczące przyjęcia..."
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <Link
            href="/warehouse/local-collections"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              'Przyjmij na magazynie'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

