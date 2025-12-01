'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, CheckCircle, Truck, Camera, Calculator } from 'lucide-react'
import KPICard from './KPICard'
import AlertBanner from './AlertBanner'
import Link from 'next/link'
import { formatVolumeCbm } from '@/lib/warehouse-calculations'
import { adminTranslations } from '@/lib/admin-translations'

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
        <div className="animate-pulse">{adminTranslations.loading}</div>
      </div>
    )
  }

  const currentHour = new Date().getHours()
  const isLoadingWindow = currentHour >= 8 && currentHour < 16

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{adminTranslations.execution_desk}</h1>
        <p className="mt-2 text-sm text-gray-600">{adminTranslations.daily_operations}</p>
      </div>

      {/* Day Header KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title={adminTranslations.received_today}
          value={`${formatVolumeCbm(data.receivedToday.cbm)}`}
          subtitle={`${data.receivedToday.count} ${adminTranslations.items}`}
          icon={Package}
          color="green"
          size="large"
        />
        <KPICard
          title={adminTranslations.to_pack}
          value={data.toPack.count}
          subtitle={adminTranslations.shipping_requests}
          icon={Truck}
          color="yellow"
          size="large"
        />
        <KPICard
          title={adminTranslations.missing_data}
          value={data.missingData.count}
          subtitle={adminTranslations.no_photos_dimensions}
          icon={AlertTriangle}
          color="red"
          size="large"
        />
        <KPICard
          title={adminTranslations.shipped_today}
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
            title={adminTranslations.outside_loading_window}
            message={adminTranslations.loading_window_message}
          />
        </div>
      )}

      {/* Missing Data Alert */}
      {data.missingData.count > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="error"
            title={`${data.missingData.count} ${adminTranslations.orders_missing_data}`}
            message={adminTranslations.add_photos_dimensions}
            action={{
              label: adminTranslations.view_orders,
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
            <h2 className="text-lg font-semibold text-gray-900">{adminTranslations.expected_deliveries}</h2>
            <Link
              href="/warehouse/expected-deliveries"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {adminTranslations.view_all} →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {adminTranslations.receive_deliveries}
          </p>
          <Link
            href="/warehouse/expected-deliveries"
            className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="w-5 h-5 mr-2" />
            {adminTranslations.receive_delivery}
          </Link>
        </div>

        {/* To Pack */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{adminTranslations.shipping_requests}</h2>
            <Link
              href="/warehouse/shipments"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {adminTranslations.view_all} →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {adminTranslations.pack_orders}
          </p>
          <Link
            href="/warehouse/shipments"
            className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Package className="w-5 h-5 mr-2" />
            {adminTranslations.pack_shipment}
          </Link>
        </div>

        {/* Ready for Loading */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{adminTranslations.ready_for_loading}</h2>
            <Link
              href="/warehouse/orders?status=READY_TO_SHIP"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {adminTranslations.view_all} →
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {isLoadingWindow 
              ? adminTranslations.release_shipments_photos
              : adminTranslations.loading_window_hours
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
            {adminTranslations.release_shipment}
          </Link>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{adminTranslations.quick_reference}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900 mb-2">{adminTranslations.reception_storage}</div>
            <ul className="text-gray-600 space-y-1 list-disc list-inside">
              <li>{adminTranslations.always_measure}</li>
              <li>{adminTranslations.system_calculates}</li>
              <li>{adminTranslations.take_photos_received}</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-2">{adminTranslations.packing_shipment}</div>
            <ul className="text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Palety:</strong> {adminTranslations.pallets_count_weight}</li>
              <li><strong>Paczki:</strong> {adminTranslations.packages_dimensions_weight}</li>
              <li>{adminTranslations.take_photos_wrapping}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

