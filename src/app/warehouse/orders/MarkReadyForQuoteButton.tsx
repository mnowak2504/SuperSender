'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MarkReadyForQuoteButtonProps {
  orderId: string
}

export default function MarkReadyForQuoteButton({ orderId }: MarkReadyForQuoteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkReady = async () => {
    if (!confirm('Oznaczyć to zamówienie jako gotowe do wyceny?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/warehouse/mark-ready-for-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy oznaczaniu zamówienia')
      }

      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkReady}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
    >
      {loading ? 'Zapisywanie...' : 'Oznacz jako gotowe do wyceny'}
    </button>
  )
}

