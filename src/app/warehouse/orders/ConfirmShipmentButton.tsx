'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AlertBanner from '@/components/dashboard/AlertBanner'

interface ConfirmShipmentButtonProps {
  shipmentId: string
}

export default function ConfirmShipmentButton({ shipmentId }: ConfirmShipmentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleConfirm = async () => {
    if (!confirm('Czy na pewno chcesz potwierdzić wysyłkę tego shipmentu?')) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/warehouse/shipments/${shipmentId}/confirm-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy potwierdzaniu wysyłki')
      }

      setSuccess(true)
      // Reload page after short delay to show success message
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600">
        ✓ Wysyłka potwierdzona
      </div>
    )
  }

  return (
    <div>
      {error && <AlertBanner type="error" message={error} className="mb-2" />}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Zapisywanie...' : '✓ Potwierdź wysyłkę'}
      </button>
    </div>
  )
}

