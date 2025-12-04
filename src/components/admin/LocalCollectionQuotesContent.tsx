'use client'

import { useEffect, useState } from 'react'
import { Truck, Clock, Euro, MapPin, Package, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { adminTranslations } from '@/lib/admin-translations'

interface LocalCollectionQuote {
  id: string
  clientId: string
  status: string
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
  volumeCbm: number
  collectionAddressLine1: string
  collectionAddressLine2: string | null
  collectionCity: string
  collectionPostCode: string
  collectionCountry: string | null
  collectionContactName: string | null
  collectionContactPhone: string | null
  quotedPriceEur: number | null
  quotedById: string | null
  quotedAt: string | null
  collectionDateFrom: string | null
  collectionDateTo: string | null
  orderNumber: string | null
  orderDetails: string | null
  pinCode: string | null
  clientNotes: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  Client: {
    id: string
    displayName: string
    clientCode: string
    email: string
  }
}

export default function LocalCollectionQuotesContent() {
  const [quotes, setQuotes] = useState<LocalCollectionQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('REQUESTED')
  const [selectedQuote, setSelectedQuote] = useState<LocalCollectionQuote | null>(null)
  const [quotePrice, setQuotePrice] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<{
    REQUESTED: number
    QUOTED: number
    ACCEPTED: number
    SCHEDULED: number
    COMPLETED: number
    CANCELLED: number
    ALL: number
  }>({
    REQUESTED: 0,
    QUOTED: 0,
    ACCEPTED: 0,
    SCHEDULED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    ALL: 0,
  })

  useEffect(() => {
    fetchQuotes()
  }, [statusFilter])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const queryParams = statusFilter ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/admin/local-collection-quotes${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
        if (data.counts) {
          setCounts(data.counts)
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch quotes')
      }
    } catch (err) {
      console.error('Error fetching local collection quotes:', err)
      setError('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleQuoteClick = (quote: LocalCollectionQuote) => {
    if (quote.status === 'REQUESTED') {
      setSelectedQuote(quote)
      setQuotePrice('')
      setAdminNotes('')
      setError(null)
    }
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/local-collection-quotes/${selectedQuote.id}/quote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotedPriceEur: parseFloat(quotePrice),
          adminNotes: adminNotes || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit quote')
      }

      setSelectedQuote(null)
      setQuotePrice('')
      setAdminNotes('')
      await fetchQuotes()
    } catch (err) {
      console.error('Error submitting quote:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      REQUESTED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      QUOTED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Euro },
      ACCEPTED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      SCHEDULED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
    }

    const badge = badges[status] || badges.REQUESTED
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-500">Ładowanie transportów lokalnych...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transporty lokalne</h1>
          <p className="mt-1 text-sm text-gray-500">Zarządzaj zapytaniami o odbiór lokalny</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('REQUESTED')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'REQUESTED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Oczekujące ({counts.REQUESTED})
        </button>
        <button
          onClick={() => setStatusFilter('QUOTED')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'QUOTED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Wycenione ({counts.QUOTED})
        </button>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Wszystkie ({counts.ALL})
        </button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Brak transportów lokalnych</p>
          <p className="text-gray-400 text-sm mt-2">
            {statusFilter === 'REQUESTED' 
              ? 'Brak zapytań oczekujących na wycenę'
              : 'Brak transportów w wybranym statusie'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <li key={quote.id}>
                <div
                  className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer ${
                    quote.status === 'REQUESTED' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleQuoteClick(quote)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          Transport #{quote.id.slice(-8).toUpperCase()}
                        </p>
                        {getStatusBadge(quote.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Package className="w-4 h-4" />
                            <span className="font-medium">Klient:</span>
                          </div>
                          <p className="text-sm text-gray-900">{quote.Client?.displayName || 'Brak'}</p>
                          <p className="text-xs text-gray-500 font-mono">{quote.Client?.clientCode || '-'}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Adres odbioru:</span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {quote.collectionAddressLine1}
                            {quote.collectionAddressLine2 && `, ${quote.collectionAddressLine2}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {quote.collectionCity}, {quote.collectionPostCode}
                            {quote.collectionCountry && `, ${quote.collectionCountry}`}
                          </p>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Wymiary:</span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {quote.widthCm} × {quote.lengthCm} × {quote.heightCm} cm
                          </p>
                          <p className="text-xs text-gray-500">
                            {quote.volumeCbm.toFixed(3)} m³, {quote.weightKg} kg
                          </p>
                        </div>

                        {quote.quotedPriceEur && (
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Euro className="w-4 h-4" />
                              <span className="font-medium">Wycena:</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              €{quote.quotedPriceEur.toFixed(2)}
                            </p>
                            {quote.quotedAt && (
                              <p className="text-xs text-gray-500">Wycena: {formatDate(quote.quotedAt)}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {quote.clientNotes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <span className="font-medium">Uwagi klienta:</span> {quote.clientNotes}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-400">
                        Utworzono: {formatDate(quote.createdAt)}
                      </div>
                    </div>

                    {quote.status === 'REQUESTED' && (
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuoteClick(quote)
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Euro className="w-4 h-4 mr-2" />
                          Wyceń
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quote Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Euro className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Wycena transportu lokalnego</h2>
                  <p className="text-sm text-gray-500">Transport #{selectedQuote.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedQuote(null)
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Quote Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Klient</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedQuote.Client?.displayName} ({selectedQuote.Client?.clientCode})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Adres odbioru</p>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.collectionAddressLine1}
                    {selectedQuote.collectionAddressLine2 && `, ${selectedQuote.collectionAddressLine2}`}
                    <br />
                    {selectedQuote.collectionCity}, {selectedQuote.collectionPostCode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Wymiary</p>
                    <p className="text-sm text-gray-900">
                      {selectedQuote.widthCm} × {selectedQuote.lengthCm} × {selectedQuote.heightCm} cm
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedQuote.volumeCbm.toFixed(3)} m³, {selectedQuote.weightKg} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data utworzenia</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                </div>
                {selectedQuote.clientNotes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Uwagi klienta</p>
                    <p className="text-sm text-gray-700">{selectedQuote.clientNotes}</p>
                  </div>
                )}
              </div>

              {/* Price Input */}
              <div>
                <label htmlFor="quotePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Cena wyceny (EUR) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Euro className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="quotePrice"
                    required
                    min="0"
                    step="0.01"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Uwagi wewnętrzne (opcjonalnie)
                </label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notatki dla zespołu..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuote(null)
                    setError(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submitting || !quotePrice}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Euro className="mr-2 h-4 w-4" />
                      Wyślij wycenę
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

