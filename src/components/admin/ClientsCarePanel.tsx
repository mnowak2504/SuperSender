'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, Euro, Mail, Phone, User } from 'lucide-react'
import { formatVolumeCbm, formatUsagePercent } from '@/lib/warehouse-calculations'
import AlertBanner from '@/components/dashboard/AlertBanner'
import Link from 'next/link'

interface Client {
  id: string
  displayName: string
  email: string
  clientCode: string
  status: string
  usedCbm: number
  limitCbm: number
  usagePercent: number
  isOverLimit: boolean
  salesOwner?: {
    name: string
    email: string
  }
  overdueInvoices: number
  lastShipment?: string
}

export default function ClientsCarePanel() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'overLimit' | 'overdue' | 'my'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    if (filter === 'overLimit' && !client.isOverLimit) return false
    if (filter === 'overdue' && client.overdueInvoices === 0) return false
    if (searchQuery && !client.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !client.clientCode.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">Loading clients...</div>
      </div>
    )
  }

  const overLimitClients = clients.filter(c => c.isOverLimit).length
  const overdueClients = clients.filter(c => c.overdueInvoices > 0).length

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients & Care</h1>
        <p className="mt-2 text-sm text-gray-600">Manage client relationships and monitor space usage</p>
      </div>

      {/* Alerts */}
      <div className="mb-6 space-y-3">
        {overLimitClients > 0 && (
          <AlertBanner
            type="error"
            title={`${overLimitClients} clients over storage limit`}
            message="Review and take action to free up space or upgrade plans."
          />
        )}
        {overdueClients > 0 && (
          <AlertBanner
            type="warning"
            title={`${overdueClients} clients with overdue invoices`}
            message="Send payment reminders or place credit holds."
          />
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or client code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('overLimit')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'overLimit' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Over Limit
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'overdue' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.displayName}</div>
                      <div className="text-sm text-gray-500">{client.clientCode}</div>
                      <div className="text-xs text-gray-400">{client.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatVolumeCbm(client.usedCbm)} / {formatVolumeCbm(client.limitCbm)}
                      </div>
                      <div className="text-xs text-gray-500">{formatUsagePercent(client.usagePercent)}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            client.usagePercent > 100
                              ? 'bg-red-500'
                              : client.usagePercent > 80
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(client.usagePercent, 100)}%` }}
                        />
                      </div>
                      {client.isOverLimit && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          Over by {formatVolumeCbm(client.usedCbm - client.limitCbm)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.salesOwner ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{client.salesOwner.name}</div>
                        <div className="text-xs text-gray-500">{client.salesOwner.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                      {client.overdueInvoices > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{client.overdueInvoices} overdue</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    <button className="text-green-600 hover:text-green-900">
                      <Mail className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

