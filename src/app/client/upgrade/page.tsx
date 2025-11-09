'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Check, Loader2, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import ClientLayout from '@/components/ClientLayout'
import ClientPageHeader from '@/components/ClientPageHeader'

interface Plan {
  id: string
  name: string
  deliveriesPerMonth: number
  spaceLimitCbm: number
  overSpaceRateEur: number
  operationsRateEur: number
}

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, profileRes] = await Promise.all([
        fetch('/api/client/plans'),
        fetch('/api/client/profile'),
      ])

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setCurrentPlanId(profileData.client?.planId || null)
        if (profileData.client?.planId) {
          setSelectedPlanId(profileData.client.planId)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load plans. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlanId) {
      setError('Please select a plan')
      return
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    if (selectedPlan?.name.toLowerCase() === 'enterprise') {
      window.location.href = 'mailto:contact@makconsulting.com?subject=Enterprise Plan Inquiry'
      return
    }

    if (selectedPlanId === currentPlanId) {
      setError('This is your current plan')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/client/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upgrade subscription')
      }

      // Redirect to payment if payment link is available
      if (data.paymentLink) {
        window.location.href = data.paymentLink
      } else {
        // Redirect to invoices page
        router.push('/client/invoices')
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      setError(error instanceof Error ? error.message : 'Failed to upgrade subscription')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <ClientPageHeader title="Upgrade Plan" showBackButton={true} backButtonHref="/client/settings?tab=billing" backButtonLabel="Back to Settings" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Loading plans...</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <ClientPageHeader title="Upgrade Plan" showBackButton={true} backButtonHref="/client/settings?tab=billing" backButtonLabel="Back to Settings" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
            <p className="text-gray-600">Select a subscription plan that fits your needs</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId
              const isSelected = plan.id === selectedPlanId
              const isEnterprise = plan.name.toLowerCase() === 'enterprise'
              const isUnlimitedDeliveries = plan.deliveriesPerMonth >= 999
              const isUnlimitedStorage = plan.spaceLimitCbm >= 999

              return (
                <div
                  key={plan.id}
                  onClick={() => !isEnterprise && setSelectedPlanId(plan.id)}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all
                    ${isEnterprise 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 cursor-default'
                      : isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-lg cursor-pointer'
                      : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                    }
                    ${isCurrent ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {isSelected && !isCurrent && !isEnterprise && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {isEnterprise && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Custom
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    {isEnterprise ? (
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-900">Custom Pricing</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">€{plan.operationsRateEur.toFixed(2)}</span>
                        <span className="text-gray-500 ml-2">/month</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>
                        {isUnlimitedDeliveries ? 'Unlimited' : plan.deliveriesPerMonth} deliveries per month
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>
                        {isUnlimitedStorage 
                          ? 'Unlimited' 
                          : isEnterprise
                            ? '50+ CBM'
                            : plan.name === 'Professional' 
                              ? '15 CBM (6 pallets) + 5 CBM buffer'
                              : plan.spaceLimitCbm === 2.5
                                ? '2.5 CBM (1 pallet space)'
                                : plan.spaceLimitCbm === 5.0
                                  ? '5 CBM (2 pallet spaces)'
                                  : `${plan.spaceLimitCbm} CBM`
                        } storage limit
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>€{plan.overSpaceRateEur.toFixed(2)} / CBM over limit</span>
                    </div>
                    {isEnterprise && (
                      <>
                        <div className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>Dedicated account manager</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>Priority support</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>Custom integrations</span>
                        </div>
                      </>
                    )}
                  </div>

                  {isEnterprise && (
                    <a
                      href="mailto:contact@makconsulting.com?subject=Enterprise Plan Inquiry"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-4 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Us
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No plans available at the moment</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              href="/client/settings?tab=billing"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={processing || !selectedPlanId || selectedPlanId === currentPlanId}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Continue to Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

