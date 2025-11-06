'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Truck, Mail } from 'lucide-react'

interface DeliveryAlert {
  id: string
  clientId: string
  supplierName: string
  goodsDescription: string
  createdAt: string
  Client: {
    displayName: string
    clientCode: string
  }
  daysPending: number
}

export default function DeliveryAlertsSection() {
  const [alerts, setAlerts] = useState<DeliveryAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/delivery-alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching delivery alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSupplier = (alert: DeliveryAlert) => {
    // TODO: Open email draft or modal
    const subject = encodeURIComponent(`Missing Delivery: ${alert.supplierName}`)
    const body = encodeURIComponent(
      `Dear ${alert.Client.displayName},\n\n` +
      `We noticed that the delivery from ${alert.supplierName} (${alert.goodsDescription}) ` +
      `reported on ${new Date(alert.createdAt).toLocaleDateString()} has not yet arrived at our warehouse.\n\n` +
      `Could you please check with the supplier and confirm the delivery status?\n\n` +
      `Thank you,\nMAK Consulting Team`
    )
    window.location.href = `mailto:${alert.Client.email}?subject=${subject}&body=${body}`
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading alerts...</div>
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
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goods Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reported On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Pending
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {alert.Client?.displayName || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {alert.Client?.clientCode || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {alert.supplierName || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {alert.goodsDescription || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(alert.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    alert.daysPending > 14
                      ? 'bg-red-100 text-red-800'
                      : alert.daysPending > 7
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.daysPending} days
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleContactSupplier(alert)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Contact Supplier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No delivery alerts</p>
        </div>
      )}
    </div>
  )
}

