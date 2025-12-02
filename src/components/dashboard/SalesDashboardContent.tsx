'use client'

import { useEffect, useState } from 'react'
import { Users, Truck, MessageSquare, CreditCard, AlertCircle, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import CustomerOverview from './sales/CustomerOverview'
import CustomQuotesSection from './sales/CustomQuotesSection'
import DeliveryAlertsSection from './sales/DeliveryAlertsSection'
import SubscriptionsSection from './sales/SubscriptionsSection'
import { adminTranslations } from '@/lib/admin-translations'

interface SalesKPI {
  myAccounts: number
  pendingDeliveries7d: number
  quotesAwaitingAction: {
    total: number
    over24h: number
    over48h: number
  }
  activeSubscriptions: {
    total: number
    paidOnTimePercent: number
  }
  localCollectionQuotesPending: number
}

export default function SalesDashboardContent() {
  const [kpi, setKpi] = useState<SalesKPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'quotes' | 'deliveries' | 'subscriptions'>('overview')

  useEffect(() => {
    fetchKPI()
    const interval = setInterval(fetchKPI, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchKPI = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/sales-kpi')
      if (res.ok) {
        const data = await res.json()
        setKpi(data)
      }
    } catch (error) {
      console.error('Error fetching sales KPI:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{adminTranslations.loading}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Accounts */}
        <Link
          href="/admin/customers"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{adminTranslations.my_accounts}</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{kpi?.myAccounts || 0}</p>
            <p className="text-sm text-gray-600 mt-1">{adminTranslations.assigned_clients}</p>
          </div>
        </Link>

        {/* Pending Deliveries >7d */}
        <Link
          href="/admin/customers?section=deliveries"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{adminTranslations.pending_deliveries} &gt;7d</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{kpi?.pendingDeliveries7d || 0}</p>
            <p className="text-sm text-gray-600 mt-1">{adminTranslations.deliveries_not_received}</p>
          </div>
        </Link>

        {/* Quotes Awaiting Action */}
        <Link
          href="/admin/customers?section=quotes"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{adminTranslations.quotes_pending}</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{kpi?.quotesAwaitingAction?.total || 0}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-600">
                {kpi?.quotesAwaitingAction?.over24h || 0} &gt;24h
              </span>
              {(kpi?.quotesAwaitingAction?.over48h || 0) > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  {kpi?.quotesAwaitingAction?.over48h || 0} &gt;48h
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{adminTranslations.subscriptions}</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{kpi?.activeSubscriptions?.total || 0}</p>
            <p className="text-sm text-gray-600 mt-1">
              {kpi?.activeSubscriptions?.paidOnTimePercent || 0}% {adminTranslations.paid_on_time}
            </p>
          </div>
        </div>

        {/* Local Collection Quotes Pending */}
        <Link
          href="/admin/local-collection-quotes?status=REQUESTED"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Transporty lokalne</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{kpi?.localCollectionQuotesPending || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Oczekujące na wycenę</p>
          </div>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {adminTranslations.overview}
            </button>
            <button
              onClick={() => setActiveSection('quotes')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'quotes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {adminTranslations.quotes}
            </button>
            <button
              onClick={() => setActiveSection('deliveries')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'deliveries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {adminTranslations.deliveries}
            </button>
            <button
              onClick={() => setActiveSection('subscriptions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {adminTranslations.subscriptions}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeSection === 'overview' && <CustomerOverview />}
          {activeSection === 'quotes' && <CustomQuotesSection />}
          {activeSection === 'deliveries' && <DeliveryAlertsSection />}
          {activeSection === 'subscriptions' && <SubscriptionsSection />}
        </div>
      </div>
    </div>
  )
}

