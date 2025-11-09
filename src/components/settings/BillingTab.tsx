'use client'

import { useEffect, useState } from 'react'
import { CreditCard, TrendingUp, Calendar, Receipt, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function BillingTab() {
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const [profileRes, invoicesRes] = await Promise.all([
        fetch('/api/client/profile'),
        fetch('/api/client/invoices'),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setClient(profileData.client)
        
        if (profileData.client?.planId) {
          // Fetch plan details
          try {
            const planRes = await fetch(`/api/client/plan/${profileData.client.planId}`)
            if (planRes.ok) {
              const planData = await planRes.json()
              setPlan(planData.plan)
            }
          } catch (error) {
            console.error('Error fetching plan:', error)
          }
        }
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices?.slice(0, 5) || [])
      } else {
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Billing & Subscription</h2>
        <p className="text-sm text-gray-500">Manage your subscription plan and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              <p className="text-sm text-gray-500">{plan?.name || 'No plan assigned'}</p>
            </div>
          </div>
          <Link
            href="/client/upgrade"
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 inline-block"
          >
            Upgrade Plan
          </Link>
        </div>

        {plan && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Storage Limit</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{plan.spaceLimitCbm} CBM</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Receipt className="w-4 h-4" />
                <span>Deliveries Included</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{plan.deliveriesPerMonth} / month</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Billing Cycle</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">Monthly</p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Information */}
      {plan && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pricing Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Operations Rate</dt>
              <dd className="text-sm font-medium text-gray-900">€{plan.operationsRateEur.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Over-Space Rate</dt>
              <dd className="text-sm font-medium text-gray-900">€{plan.overSpaceRateEur.toFixed(2)} / CBM</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Invoices</h3>
          <Link
            href="/client/invoices"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
          >
            View All
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No invoices yet</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">€{invoice.amountEur.toFixed(2)}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          View Pricing
        </button>
        <Link
          href="/client/invoices"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Receipt className="w-4 h-4" />
          Billing History
        </Link>
      </div>
    </div>
  )
}

