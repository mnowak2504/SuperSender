'use client'

import { useEffect, useState } from 'react'
import { Package, Clock, CheckCircle, AlertTriangle, Euro, Users, FileText } from 'lucide-react'
import KPICard from './KPICard'
import QueueCard from './QueueCard'
import AlertBanner from './AlertBanner'
import Link from 'next/link'

interface QueueItem {
  id: string
  status: string
  clientId?: string
  Client?: { displayName: string; clientCode: string }
  timeInQueue?: string
  hoursInQueue?: number
  calculatedPriceEur?: number
  packedAt?: string
}

interface DashboardData {
  kpi: {
    ordersInProgress: number
    avgAcceptanceTime: number
    avgProcessingTime: number
    pendingShipments24h: number
  }
  queues: {
    toVerify: QueueItem[]
    awaitingDecision: QueueItem[]
    readyForLoading: QueueItem[]
  }
}

export default function AdminDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQueue, setActiveQueue] = useState<'toVerify' | 'awaitingDecision' | 'readyForLoading'>('toVerify')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [kpiRes, queuesRes] = await Promise.all([
        fetch('/api/admin/dashboard/kpi'),
        fetch('/api/admin/dashboard/queues'),
      ])

      if (kpiRes.ok && queuesRes.ok) {
        const kpi = await kpiRes.json()
        const queues = await queuesRes.json()
        setData({
          kpi: {
            ordersInProgress: (queues.toVerify?.length || 0) + (queues.awaitingDecision?.length || 0),
            avgAcceptanceTime: kpi.performance?.avgAcceptanceTime || 0,
            avgProcessingTime: kpi.performance?.avgProcessingTimeHours || 0,
            pendingShipments24h: kpi.alerts?.pendingShipments24h || 0,
          },
          queues,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  const currentQueue = data.queues[activeQueue] || []

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Operations Hub</h1>
        <p className="mt-2 text-sm text-gray-600">Shipment management and client operations</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Orders In Progress"
          value={data.kpi.ordersInProgress}
          icon={Package}
          color="blue"
          size="large"
        />
        <KPICard
          title="Avg Acceptance Time"
          value={`${data.kpi.avgAcceptanceTime.toFixed(1)}h`}
          subtitle="Client decision time"
          icon={Clock}
          color="yellow"
          size="large"
        />
        <KPICard
          title="Avg Processing Time"
          value={`${data.kpi.avgProcessingTime.toFixed(1)}h`}
          subtitle="Reception → Shipment"
          icon={CheckCircle}
          color="green"
          size="large"
        />
        <KPICard
          title="Pending >24h"
          value={data.kpi.pendingShipments24h}
          subtitle="Awaiting client decision"
          icon={AlertTriangle}
          color="red"
          size="large"
        />
      </div>

      {/* Alert Banner */}
      {data.kpi.pendingShipments24h > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="warning"
            title={`${data.kpi.pendingShipments24h} shipments waiting for client decision > 24h`}
            message="Consider following up with clients or their sales representatives."
            action={{
              label: 'View shipments',
              onClick: () => setActiveQueue('awaitingDecision')
            }}
          />
        </div>
      )}

      {/* Queue Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'toVerify', label: 'To Verify', count: data.queues.toVerify?.length || 0, icon: Package },
              { key: 'awaitingDecision', label: 'Awaiting Decision', count: data.queues.awaitingDecision?.length || 0, icon: Clock },
              { key: 'readyForLoading', label: 'Ready for Loading', count: data.queues.readyForLoading?.length || 0, icon: CheckCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveQueue(tab.key as any)}
                className={`${
                  activeQueue === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeQueue === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Queue Content */}
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-4">
          {currentQueue.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No items in this queue</p>
            </div>
          ) : (
            currentQueue.map((item: QueueItem) => (
              <QueueCard
                key={item.id}
                id={item.id}
                title={item.Client?.displayName || `Client ${item.clientId}`}
                subtitle={item.Client?.clientCode || ''}
                status={item.status}
                priority={item.hoursInQueue && item.hoursInQueue > 24 ? 'high' : 'medium'}
                hasPhotos={true} // TODO: Check from API
                hasCalculations={!!item.calculatedPriceEur}
                timeInQueue={item.timeInQueue}
                onClick={() => {
                  if (activeQueue === 'toVerify') {
                    window.location.href = `/warehouse/pack-order/${item.id}`
                  } else if (activeQueue === 'awaitingDecision') {
                    window.location.href = `/admin/shipments/${item.id}`
                  } else {
                    window.location.href = `/admin/shipments/${item.id}`
                  }
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Link
          href="/admin/invoices"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Invoices & Payments</h3>
          </div>
          <p className="text-sm text-gray-600">Manage subscriptions, operations, and transport invoices</p>
        </Link>

        <Link
          href="/admin/clients"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clients & Care</h3>
          </div>
          <p className="text-sm text-gray-600">Client overview, space usage, and sales representative assignment</p>
        </Link>

        <Link
          href="/admin/shipments"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">All Shipments</h3>
          </div>
          <p className="text-sm text-gray-600">View and manage all shipment orders</p>
        </Link>
      </div>
    </div>
  )
}

