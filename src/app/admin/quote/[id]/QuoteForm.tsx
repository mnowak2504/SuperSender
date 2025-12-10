'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Address } from '@/lib/db'

interface QuoteFormProps {
  orderId: string
  clientId: string
  addresses: Address[]
  quotedById: string
  orderType?: 'WAREHOUSE_ORDER' | 'SHIPMENT_ORDER'
  dimensions: {
    length: number
    width: number
    height: number
    weight: number
  }
}

export default function QuoteForm({
  orderId,
  clientId,
  addresses,
  quotedById,
  orderType = 'WAREHOUSE_ORDER',
  dimensions,
}: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    deliveryAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || '',
    transportMode: 'MAK' as 'MAK' | 'CLIENT_OWN',
    proposedPriceEur: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.deliveryAddressId) {
        throw new Error('Wybierz adres dostawy')
      }

      if (formData.transportMode === 'MAK' && !formData.proposedPriceEur) {
        throw new Error('Wprowadź wycenę transportu')
      }

      const response = await fetch('/api/admin/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          orderType,
          clientId,
          deliveryAddressId: formData.deliveryAddressId,
          transportMode: formData.transportMode,
          proposedPriceEur: formData.proposedPriceEur ? parseFloat(formData.proposedPriceEur) : null,
          quotedById,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy tworzeniu wyceny')
      }

      // Przekieruj do dashboardu
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Formularz wyceny</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="deliveryAddressId" className="block text-sm font-medium text-gray-700">
            Adres dostawy *
          </label>
          <select
            id="deliveryAddressId"
            value={formData.deliveryAddressId}
            onChange={(e) => setFormData({ ...formData, deliveryAddressId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="">Wybierz adres...</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.contactName} - {address.line1}, {address.city} {address.postalCode}, {address.country}
                {address.isDefault && ' (Domyślny)'}
              </option>
            ))}
          </select>
          {addresses.length === 0 && (
            <p className="mt-2 text-sm text-yellow-600">
              Klient nie ma jeszcze zapisanych adresów. Wycena zostanie utworzona bez adresu (można dodać później).
            </p>
          )}
        </div>

        <div>
          <label htmlFor="transportMode" className="block text-sm font-medium text-gray-700">
            Sposób transportu *
          </label>
          <select
            id="transportMode"
            value={formData.transportMode}
            onChange={(e) => setFormData({ ...formData, transportMode: e.target.value as 'MAK' | 'CLIENT_OWN' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="MAK">Transport przez MAK</option>
            <option value="CLIENT_OWN">Klient organizuje transport samodzielnie</option>
          </select>
        </div>

        {formData.transportMode === 'MAK' && (
          <div>
            <label htmlFor="proposedPriceEur" className="block text-sm font-medium text-gray-700">
              Wycena transportu (EUR) *
            </label>
            <input
              type="number"
              id="proposedPriceEur"
              min="0"
              step="0.01"
              value={formData.proposedPriceEur}
              onChange={(e) => setFormData({ ...formData, proposedPriceEur: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required={formData.transportMode === 'MAK'}
              placeholder="0.00"
            />
          </div>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Uwagi dotyczące wyceny
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Dodatkowe uwagi dotyczące wyceny..."
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Informacje do wyceny:</strong>
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Wymiary: {dimensions.length}×{dimensions.width}×{dimensions.height} cm</li>
            <li>Waga: {dimensions.weight} kg</li>
            {formData.deliveryAddressId && (
              <li>
                Adres dostawy: {addresses.find((a) => a.id === formData.deliveryAddressId)?.city || 'Nie wybrano'}
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <a
            href="/admin/quotes"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Tworzenie wyceny...' : 'Utwórz wycenę'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Uwaga:</strong> Po utworzeniu wyceny:
        </p>
        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>Status zamówienia zmieni się na "Gotowe do wyceny" (pozostaje)</li>
          <li>Zostanie utworzone zlecenie wysyłki ze statusem "Wycena gotowa"</li>
          <li>Klient otrzyma powiadomienie o gotowej wycenie</li>
          <li>Klient będzie mógł zaakceptować lub odrzucić wycenę</li>
        </ul>
      </div>
    </div>
  )
}

