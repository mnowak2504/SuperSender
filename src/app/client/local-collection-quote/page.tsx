'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import ClientHeader from '@/components/ClientHeader'
import RequestLocalCollectionQuote from '@/components/client/RequestLocalCollectionQuote'
import { Truck, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function LocalCollectionQuotePage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/client/local-collection-quote')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Requested</span>
      case 'QUOTED':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Quoted</span>
      case 'ACCEPTED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Accepted</span>
      case 'SCHEDULED':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> Scheduled</span>
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  return (
    <ClientLayout>
      <ClientHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Local Collection Quotes</h1>
            <p className="text-sm text-gray-500 mt-1">Request quotes for local collection from your suppliers</p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Request New Quote
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No quote requests yet</h3>
            <p className="text-sm text-gray-500 mb-6">Request a quote for local collection from your supplier</p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request Your First Quote
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Quote #{quote.id.slice(-8).toUpperCase()}</h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(quote.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Package Dimensions</p>
                    <p className="text-sm font-medium text-gray-900">
                      {quote.widthCm} × {quote.lengthCm} × {quote.heightCm} cm
                    </p>
                    <p className="text-xs text-gray-500">Volume: {quote.volumeCbm.toFixed(3)} m³</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Weight</p>
                    <p className="text-sm font-medium text-gray-900">{quote.weightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Collection Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {quote.collectionAddressLine1}
                      {quote.collectionAddressLine2 && `, ${quote.collectionAddressLine2}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quote.collectionCity}, {quote.collectionPostCode}, {quote.collectionCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    <p className="text-sm font-medium text-gray-900">{quote.collectionContactName}</p>
                    <p className="text-xs text-gray-500">{quote.collectionContactPhone}</p>
                  </div>
                </div>

                {quote.quotedPriceEur && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Quoted Price</p>
                        <p className="text-2xl font-bold text-blue-600">€{quote.quotedPriceEur.toFixed(2)}</p>
                      </div>
                      {quote.status === 'QUOTED' && (
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                          Accept & Schedule
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {quote.clientNotes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{quote.clientNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showRequestForm && (
          <RequestLocalCollectionQuote
            onClose={() => setShowRequestForm(false)}
            onSuccess={() => {
              fetchQuotes()
              setShowRequestForm(false)
            }}
          />
        )}
      </div>
    </ClientLayout>
  )
}

