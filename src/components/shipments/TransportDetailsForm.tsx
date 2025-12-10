'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'

interface TransportDetailsFormProps {
  shipmentId: string
  currentData?: {
    transportCompanyName?: string | null
    plannedLoadingDate?: string | null
    plannedDeliveryDateFrom?: string | null
    plannedDeliveryDateTo?: string | null
  }
}

export default function TransportDetailsForm({
  shipmentId,
  currentData,
}: TransportDetailsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [transportCompanyName, setTransportCompanyName] = useState(currentData?.transportCompanyName || '')
  const [plannedLoadingDate, setPlannedLoadingDate] = useState(
    currentData?.plannedLoadingDate
      ? new Date(currentData.plannedLoadingDate).toISOString().split('T')[0]
      : ''
  )
  const [plannedDeliveryDateFrom, setPlannedDeliveryDateFrom] = useState(
    currentData?.plannedDeliveryDateFrom
      ? new Date(currentData.plannedDeliveryDateFrom).toISOString().split('T')[0]
      : ''
  )
  const [plannedDeliveryDateTo, setPlannedDeliveryDateTo] = useState(
    currentData?.plannedDeliveryDateTo
      ? new Date(currentData.plannedDeliveryDateTo).toISOString().split('T')[0]
      : ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/warehouse/shipments/${shipmentId}/transport-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transportCompanyName: transportCompanyName.trim() || null,
          plannedLoadingDate: plannedLoadingDate ? new Date(plannedLoadingDate).toISOString() : null,
          plannedDeliveryDateFrom: plannedDeliveryDateFrom ? new Date(plannedDeliveryDateFrom).toISOString() : null,
          plannedDeliveryDateTo: plannedDeliveryDateTo ? new Date(plannedDeliveryDateTo).toISOString() : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save transport details')
      }

      setShowForm(false)
      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transport details')
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
      >
        <Truck className="w-4 h-4 mr-1" />
        {currentData?.transportCompanyName ? 'Edytuj dane transportu' : 'Dodaj dane transportu'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="transportCompanyName" className="block text-sm font-medium text-gray-700 mb-1">
            Firma transportowa
          </label>
          <input
            type="text"
            id="transportCompanyName"
            value={transportCompanyName}
            onChange={(e) => setTransportCompanyName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="np. DHL, FedEx, UPS"
          />
        </div>
        
        <div>
          <label htmlFor="plannedLoadingDate" className="block text-sm font-medium text-gray-700 mb-1">
            Planowana data załadunku
          </label>
          <input
            type="date"
            id="plannedLoadingDate"
            value={plannedLoadingDate}
            onChange={(e) => setPlannedLoadingDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <label htmlFor="plannedDeliveryDateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Planowana data dostawy (od)
          </label>
          <input
            type="date"
            id="plannedDeliveryDateFrom"
            value={plannedDeliveryDateFrom}
            onChange={(e) => setPlannedDeliveryDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min={plannedLoadingDate || new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <label htmlFor="plannedDeliveryDateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Planowana data dostawy (do) - opcjonalne
          </label>
          <input
            type="date"
            id="plannedDeliveryDateTo"
            value={plannedDeliveryDateTo}
            onChange={(e) => setPlannedDeliveryDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min={plannedDeliveryDateFrom || plannedLoadingDate || new Date().toISOString().split('T')[0]}
          />
          <p className="mt-1 text-xs text-gray-500">Zostaw puste jeśli dokładna data</p>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Zapisywanie...' : 'Zapisz'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false)
            setError(null)
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          Anuluj
        </button>
      </div>
    </form>
  )
}

