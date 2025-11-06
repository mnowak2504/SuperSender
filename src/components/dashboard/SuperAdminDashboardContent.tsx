'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Package, AlertTriangle, Users, Settings, FileText, Euro } from 'lucide-react'
import KPICard from './KPICard'
import AlertBanner from './AlertBanner'
import Link from 'next/link'

interface DashboardData {
  revenue: {
    mtd: { total: number; subscription: number; transport: number; operations: number }
    ytd: { total: number; subscription: number; transport: number; operations: number }
  }
  warehouse: {
    usedCbm: number
    limitCbm: number
    usagePercent: number
    overCapacityClients: number
  }
  alerts: {
    overdueInvoices: number
    pendingShipments24h: number
  }
  performance: {
    avgProcessingTimeHours: number
  }
}

export default function SuperAdminDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pricingRules, setPricingRules] = useState<any[]>([])

  useEffect(() => {
    fetchKPI()
    fetchPricingRules()
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchKPI()
      fetchPricingRules()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPricingRules = async () => {
    try {
      const res = await fetch('/api/superadmin/pricing')
      if (res.ok) {
        const data = await res.json()
        setPricingRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
    }
  }

  const fetchKPI = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/kpi')
      if (res.ok) {
        const kpiData = await res.json()
        setData(kpiData)
      }
    } catch (error) {
      console.error('Error fetching KPI:', error)
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

  const formatCurrency = (value: number) => `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatCbm = (value: number) => `${value.toFixed(2)} m³`

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Control Tower</h1>
        <p className="mt-2 text-sm text-gray-600">Global system overview and governance</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Revenue MTD"
          value={formatCurrency(data.revenue.mtd.total)}
          subtitle={`Sub: ${formatCurrency(data.revenue.mtd.subscription)} | Trans: ${formatCurrency(data.revenue.mtd.transport)}`}
          icon={DollarSign}
          color="green"
          size="large"
        />
        <KPICard
          title="Revenue YTD"
          value={formatCurrency(data.revenue.ytd.total)}
          subtitle={`Sub: ${formatCurrency(data.revenue.ytd.subscription)} | Trans: ${formatCurrency(data.revenue.ytd.transport)}`}
          icon={TrendingUp}
          color="blue"
          size="large"
        />
        <KPICard
          title="Warehouse Usage"
          value={`${data.warehouse.usagePercent.toFixed(1)}%`}
          subtitle={`${formatCbm(data.warehouse.usedCbm)} / ${formatCbm(data.warehouse.limitCbm)}`}
          icon={Package}
          color={data.warehouse.usagePercent > 90 ? 'red' : data.warehouse.usagePercent > 70 ? 'yellow' : 'green'}
          size="large"
        />
        <KPICard
          title="Avg Processing Time"
          value={`${data.performance.avgProcessingTimeHours.toFixed(1)}h`}
          subtitle="Reception → Shipment"
          icon={TrendingUp}
          color="purple"
          size="large"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
        <KPICard
          title="Subscriptions MTD"
          value={formatCurrency(data.revenue.mtd.subscription)}
          icon={Euro}
          color="blue"
        />
        <KPICard
          title="Transport MTD"
          value={formatCurrency(data.revenue.mtd.transport)}
          icon={Package}
          color="green"
        />
        <KPICard
          title="Operations MTD"
          value={formatCurrency(data.revenue.mtd.operations)}
          icon={Settings}
          color="purple"
        />
        <KPICard
          title="Over-space Revenue"
          value={formatCurrency(0)}
          subtitle="Auto-calculated"
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Alert Banner */}
      <div className="mb-8 space-y-3">
        {data.warehouse.usagePercent > 90 && (
          <AlertBanner
            type="error"
            title={`Over-capacity Alert: ${data.warehouse.usagePercent.toFixed(1)}% warehouse usage`}
            message={`${data.warehouse.overCapacityClients} clients over limit. Consider expansion or client limits.`}
            action={{
              label: 'View clients',
              onClick: () => window.location.href = '/superadmin/clients'
            }}
          />
        )}
        {data.alerts.overdueInvoices > 0 && (
          <AlertBanner
            type="error"
            title={`${data.alerts.overdueInvoices} invoices overdue > 7 days`}
            message="Review and send payment reminders."
            action={{
              label: 'View invoices',
              onClick: () => window.location.href = '/admin/invoices'
            }}
          />
        )}
        {data.alerts.pendingShipments24h > 0 && (
          <AlertBanner
            type="warning"
            title={`${data.alerts.pendingShipments24h} shipments pending client decision > 24h`}
            message="Consider following up with clients."
            action={{
              label: 'View shipments',
              onClick: () => window.location.href = '/admin/shipments'
            }}
          />
        )}
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Transport Pricing */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transport Pricing</h2>
            <Link
              href="/superadmin/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              Manage Pricing →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">Pallet Pricing (by count)</div>
              <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                {pricingRules
                  .filter(r => r.transportType === 'PALLET' && r.isActive)
                  .sort((a, b) => b.priority - a.priority)
                  .slice(0, 3)
                  .map((rule: any) => (
                    <div key={rule.id}>
                      {rule.palletCountMin || 1}-{rule.palletCountMax || '∞'} pallets: €{rule.priceEur.toFixed(2)}
                      {(rule.weightMinKg || rule.weightMaxKg) && (
                        <span className="text-gray-500">
                          {' '}({rule.weightMinKg || 0}-{rule.weightMaxKg || '∞'} kg)
                        </span>
                      )}
                    </div>
                  ))}
                {pricingRules.filter(r => r.transportType === 'PALLET' && r.isActive).length === 0 && (
                  <div className="text-gray-400">No active pallet pricing rules</div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">Package Pricing (by m³ + kg)</div>
              <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                {pricingRules
                  .filter(r => r.transportType === 'PACKAGE' && r.isActive)
                  .sort((a, b) => b.priority - a.priority)
                  .slice(0, 3)
                  .map((rule: any) => (
                    <div key={rule.id}>
                      {rule.volumeMinCbm || 0}-{rule.volumeMaxCbm || '∞'} m³: €{rule.priceEur.toFixed(2)}
                      {(rule.weightMinKg || rule.weightMaxKg) && (
                        <span className="text-gray-500">
                          {' '}({rule.weightMinKg || 0}-{rule.weightMaxKg || '∞'} kg)
                        </span>
                      )}
                    </div>
                  ))}
                {pricingRules.filter(r => r.transportType === 'PACKAGE' && r.isActive).length === 0 && (
                  <div className="text-gray-400">No active package pricing rules</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
            <Link
              href="/superadmin/settings"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Configure →
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dimension buffer:</span>
              <span className="font-medium">+5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Default client limit:</span>
              <span className="font-medium">5.0 m³</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Translation service:</span>
              <span className="font-medium">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Photo retention:</span>
              <span className="font-medium">90 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/superadmin/pricing"
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Euro className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Pricing</span>
          </Link>
          <Link
            href="/superadmin/users"
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Users</span>
          </Link>
          <Link
            href="/superadmin/settings"
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <Link
            href="/superadmin/logs"
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Logs</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

