'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Percent, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Plan {
  id: string
  name: string
  operationsRateEur: number
  spaceLimitCbm: number
  deliveriesPerMonth: number
}

interface SubscriptionManagerProps {
  clientId: string
  currentPlanId: string | null
  subscriptionDiscount?: number | null
  additionalServicesDiscount?: number | null
  isSuperAdmin: boolean
  onUpdate?: () => void
}

export default function SubscriptionManager({
  clientId,
  currentPlanId,
  subscriptionDiscount = 0,
  additionalServicesDiscount = 0,
  isSuperAdmin,
  onUpdate,
}: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || '')
  const [subDiscount, setSubDiscount] = useState(subscriptionDiscount || 0)
  const [addServicesDiscount, setAddServicesDiscount] = useState(additionalServicesDiscount || 0)
  const [skipPayment, setSkipPayment] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    // Validation
    if (!selectedPlanId) {
      setError('Please select a plan')
      setSaving(false)
      return
    }

    if (!isSuperAdmin) {
      if (subDiscount < 0 || subDiscount > 35) {
        setError('Subscription discount must be between 0% and 35%')
        setSaving(false)
        return
      }
      if (addServicesDiscount < 0 || addServicesDiscount > 40) {
        setError('Additional services discount must be between 0% and 40%')
        setSaving(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          skipPayment: skipPayment && isSuperAdmin,
          subscriptionDiscount: subDiscount || 0,
          additionalServicesDiscount: addServicesDiscount || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update subscription')
        return
      }

      setSuccess('Subscription updated successfully')
      if (onUpdate) {
        onUpdate()
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error updating subscription:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this subscription?')) {
      return
    }

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/subscription`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to remove subscription')
        return
      }

      setSuccess('Subscription removed successfully')
      setSelectedPlanId('')
      setSubDiscount(0)
      setAddServicesDiscount(0)
      if (onUpdate) {
        onUpdate()
      }

      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error removing subscription:', err)
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const basePrice = selectedPlan?.operationsRateEur || 0
  const discountedPrice = basePrice * (1 - (subDiscount || 0) / 100)

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">Loading plans...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Subscription Management</h3>
        {isSuperAdmin && (
          <span className="ml-auto text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
            SUPERADMIN
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Plan
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No plan (remove subscription)</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - €{plan.operationsRateEur.toFixed(2)}/month
              </option>
            ))}
          </select>
        </div>

        {/* Superadmin: Skip Payment */}
        {isSuperAdmin && selectedPlanId && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipPayment"
              checked={skipPayment}
              onChange={(e) => setSkipPayment(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="skipPayment" className="text-sm text-gray-700">
              Assign without payment (manual activation)
            </label>
          </div>
        )}

        {/* Discounts */}
        {selectedPlanId && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-900">Discounts</h4>
              </div>

              {/* Subscription Discount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Discount
                  {!isSuperAdmin && <span className="text-gray-500"> (max 30%)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={isSuperAdmin ? 100 : 30}
                    step="0.1"
                    value={subDiscount}
                    onChange={(e) => setSubDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {selectedPlan && subDiscount > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    Base: €{basePrice.toFixed(2)} → Discounted: €{discountedPrice.toFixed(2)}/month
                  </p>
                )}
              </div>

              {/* Additional Services Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Services Discount
                  {!isSuperAdmin && <span className="text-gray-500"> (max 40%)</span>}
                  <span className="text-xs text-gray-500 ml-1">(excludes outbound transport)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={isSuperAdmin ? 100 : 40}
                    step="0.1"
                    value={addServicesDiscount}
                    onChange={(e) => setAddServicesDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Applies to: over-space storage, extra deliveries, extra dispatches
                </p>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          {selectedPlanId ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Subscription'}
            </button>
          ) : (
            currentPlanId && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Removing...' : 'Remove Subscription'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

