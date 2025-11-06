'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, CheckCircle, Truck, Camera, Calculator } from 'lucide-react'
import KPICard from './KPICard'
import AlertBanner from './AlertBanner'
import Link from 'next/link'
import { formatVolumeCbm } from '@/lib/warehouse-calculations'

interface DashboardData {
  receivedToday: { cbm: number; count: number }
  toPack: { count: number }
  missingData: { count: number; items: any[] }
  shippedToday: { count: number; weight: number }
}

export default function WarehouseDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPI()
    const interval = setInterval(fetchKPI, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchKPI = async () => {
    try {
      const res = await fetch('/api/warehouse/dashboard/kpi')
      if (res.ok) {
        const kpiData = await res.json()
        setData(kpiData)
      }
    } catch (error) {
      console.error('Error fetching warehouse KPI:', error)
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

  const currentHour = new Date().getHours()
  const isLoadingWindow = currentHour >= 8 && currentHour < 16

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Execution Desk</h1>
        <p className="mt-2 text-sm text-gray-600">Daily operations and queues</p>
      </div>

      {/* Day Header KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Received Today"
          value={`${formatVolumeCbm(data.receivedToday.cbm)}`}
          subtitle={`${data.receivedToday.count} items`}
          icon={Package}
          color="green"
          size="large"
        />
        <KPICard
          title="To Pack"
          value={data.toPack.count}
          subtitle="Shipping requests"
          icon={Truck}
          color="yellow"
          size="large"
        />
        <KPICard
          title="Missing Data"
          value={data.missingData.count}
          subtitle="⚠️ No photos / dimensions"
          icon={AlertTriangle}
          color="red"
          size="large"
        />
        <KPICard
          title="Shipped Today"
          value={`${data.shippedToday.count}`}
          subtitle={`${data.shippedToday.weight.toFixed(1)} kg`}
          icon={CheckCircle}
          color="blue"
          size="large"
        />
      </div>

      {/* Loading Window Alert */}
      {!isLoadingWindow && (
        <div className="mb-6">
          <AlertBanner
            type="warning"
            title="Outside loading window (8:00-16:00)"
            message="Shipment releases outside this window require approval from sales representative."
          />
        </div>
      )}

      {/* Missing Data Alert */}
      {data.missingData.count > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="error"
            title={`${data.missingData.count} orders missing data`}
            message="Please add photos or dimensions before proceeding."
            action={{
              label: 'View orders',
              onClick: () => window.location.href = '/warehouse/orders'
            }}
          />
        </div>
      )}

      {/* Operational Queues */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Expected Deliveries */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Expected Deliveries</h2>
            <Link
              href="/warehouse/expected-deliveries"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Receive deliveries and record dimensions (m³) for storage
          </p>
          <Link
            href="/warehouse/expected-deliveries"
            className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="w-5 h-5 mr-2" />
            Receive Delivery
          </Link>
        </div>

        {/* To Pack */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Shipping Requests</h2>
            <Link
              href="/warehouse/shipments"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Pack shipments as single units (add multiple pallets/packages with dimensions)
          </p>
          <Link
            href="/warehouse/shipments"
            className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Package className="w-5 h-5 mr-2" />
            Pack Shipment
          </Link>
        </div>

        {/* Ready for Loading */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ready for Loading</h2>
            <Link
              href="/warehouse/orders?status=READY_TO_SHIP"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {isLoadingWindow 
              ? 'Release shipments and take loading photos'
              : 'Loading window: 8:00-16:00. Outside hours require approval.'
            }
          </p>
          <Link
            href="/warehouse/orders?status=READY_TO_SHIP"
            className={`inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md ${
              isLoadingWindow 
                ? 'text-white bg-purple-600 hover:bg-purple-700'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Release Shipment
          </Link>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900 mb-2">📦 Reception (Storage)</div>
            <ul className="text-gray-600 space-y-1 list-disc list-inside">
              <li>Always measure: width × length × height (cm)</li>
              <li>System calculates m³ with +5% buffer</li>
              <li>Take photos of received items</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-2">📋 Packing (Shipment)</div>
            <ul className="text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Pallets:</strong> Count + total weight (kg)</li>
              <li><strong>Packages:</strong> Dimensions + weight → auto m³</li>
              <li>Take photos before/after wrapping</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

