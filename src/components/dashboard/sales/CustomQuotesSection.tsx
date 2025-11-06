'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface CustomQuote {
  id: string
  clientId: string
  customQuoteRequestedAt: string
  calculatedPriceEur: number | null
  status: string
  clientTransportChoice: string | null
  Client: {
    displayName: string
    clientCode: string
  }
  deliveryAddress: {
    city: string
    country: string
  } | null
  packages: Array<{
    widthCm: number
    lengthCm: number
    heightCm: number
    weightKg: number
  }>
}

export default function CustomQuotesSection() {
  const [quotes, setQuotes] = useState<CustomQuote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const res = await fetch('/api/admin/custom-quotes')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Error fetching custom quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTimePending = (requestedAt: string) => {
    const now = new Date()
    const requested = new Date(requestedAt)
    let hours = (now.getTime() - requested.getTime()) / (1000 * 60 * 60)
    
    // Remove weekend hours (simplified: subtract 48h for each weekend)
    const daysDiff = Math.floor(hours / 24)
    const weekends = Math.floor(daysDiff / 7)
    hours -= weekends * 48
    
    if (hours < 24) return { hours: Math.round(hours), color: 'text-gray-600' }
    if (hours < 48) return { hours: Math.round(hours), color: 'text-orange-600' }
    return { hours: Math.round(hours), color: 'text-red-600' }
  }

  const getStatusBadge = (quote: CustomQuote) => {
    if (quote.clientTransportChoice === 'ACCEPT') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </span>
      )
    }
    if (quote.clientTransportChoice === 'REQUEST_CUSTOM') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Awaiting Quote
        </span>
      )
    }
    if (quote.status === 'AWAITING_ACCEPTANCE' && quote.calculatedPriceEur) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Sent
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Pending
      </span>
    )
  }

  const getTotalDimensions = (packages: CustomQuote['packages']) => {
    if (!packages || packages.length === 0) return { totalWeight: 0, totalVolume: 0 }
    
    const totalWeight = packages.reduce((sum, pkg) => sum + (pkg.weightKg || 0), 0)
    const totalVolume = packages.reduce((sum, pkg) => {
      const volume = ((pkg.widthCm || 0) * (pkg.lengthCm || 0) * (pkg.heightCm || 0)) / 1000000
      return sum + volume
    }, 0)
    
    return { totalWeight, totalVolume }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading quotes...</div>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Pending
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.map((quote) => {
              const timePending = calculateTimePending(quote.customQuoteRequestedAt)
              const dimensions = getTotalDimensions(quote.packages)
              
              return (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quote.Client?.displayName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {quote.Client?.clientCode || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(quote.customQuoteRequestedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.deliveryAddress 
                      ? `${quote.deliveryAddress.city}, ${quote.deliveryAddress.country}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {dimensions.totalVolume > 0 ? (
                      <>
                        {dimensions.totalVolume.toFixed(2)} m³
                        {dimensions.totalWeight > 0 && (
                          <span className="ml-2">{dimensions.totalWeight.toFixed(1)} kg</span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(quote)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${timePending.color}`}>
                      {timePending.hours}h
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {quote.clientTransportChoice === 'REQUEST_CUSTOM' && (
                      <Link
                        href={`/admin/quote/${quote.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Create Quote
                      </Link>
                    )}
                    {quote.calculatedPriceEur && quote.status === 'AWAITING_ACCEPTANCE' && (
                      <span className="text-green-600 font-medium">Sent</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {quotes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No custom quotes pending</p>
        </div>
      )}
    </div>
  )
}

