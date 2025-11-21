'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Building2, Loader2, ArrowLeft, Check, X } from 'lucide-react'
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

interface SetupFee {
  suggestedAmountEur: number
  currentAmountEur: number
  validUntil: string | null
  isPromotional: boolean
}

type PaymentMethod = 'online' | 'bank_transfer'
type SubscriptionPeriod = '1' | '3' | '6'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [setupFee, setSetupFee] = useState<SetupFee | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<SubscriptionPeriod>('1')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [voucherError, setVoucherError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (planId) {
      fetchData()
    } else {
      setError('No plan selected')
      setLoading(false)
    }
  }, [planId])

  const fetchData = async () => {
    try {
      const [planRes, setupFeeRes] = await Promise.all([
        fetch(`/api/client/plan/${planId}`),
        fetch('/api/client/setup-fee'),
      ])

      if (planRes.ok) {
        const planData = await planRes.json()
        setPlan(planData.plan)
      } else {
        setError('Plan not found')
      }

      if (setupFeeRes.ok) {
        const setupFeeData = await setupFeeRes.json()
        setSetupFee(setupFeeData.setupFee)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load checkout data')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code')
      return
    }

    setVoucherError('')
    try {
      const res = await fetch('/api/client/voucher/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid voucher code')
      }

      setVoucherApplied(true)
      setVoucherDiscount(data.voucher.amountEur)
    } catch (error) {
      setVoucherError(error instanceof Error ? error.message : 'Failed to validate voucher')
      setVoucherApplied(false)
      setVoucherDiscount(0)
    }
  }

  const calculateTotal = () => {
    if (!plan || !setupFee) return 0

    // Base subscription amount
    let subscriptionAmount = plan.operationsRateEur

    // Apply period discount
    if (subscriptionPeriod === '3') {
      subscriptionAmount = subscriptionAmount * 3 * 0.9 // 10% discount
    } else if (subscriptionPeriod === '6') {
      subscriptionAmount = subscriptionAmount * 6 * 0.85 // 15% discount
    } else {
      subscriptionAmount = subscriptionAmount * 1 // 1 month
    }

    // Add setup fee
    const total = subscriptionAmount + setupFee.currentAmountEur

    // Apply voucher discount
    return Math.max(0, total - voucherDiscount)
  }

  const handleCheckout = async () => {
    if (!plan) return

    setProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/client/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          subscriptionPeriod,
          paymentMethod,
          voucherCode: voucherApplied ? voucherCode : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process checkout')
      }

      if (paymentMethod === 'online' && data.paymentLink) {
        window.location.href = data.paymentLink
      } else if (paymentMethod === 'bank_transfer') {
        // Redirect to invoice page with bank transfer instructions
        router.push(`/client/invoices?invoiceId=${data.invoiceId}`)
      } else {
        router.push('/client/invoices')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      setError(error instanceof Error ? error.message : 'Failed to process checkout')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <ClientLayout>
        <ClientPageHeader title="Checkout" showBackButton={true} backButtonHref="/client/upgrade" backButtonLabel="Back to Plans" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Loading checkout...</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error && !plan) {
    return (
      <ClientLayout>
        <ClientPageHeader title="Checkout" showBackButton={true} backButtonHref="/client/upgrade" backButtonLabel="Back to Plans" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <Link
              href="/client/upgrade"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </Link>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const total = calculateTotal()
  const subscriptionAmount = plan ? (subscriptionPeriod === '3' 
    ? plan.operationsRateEur * 3 * 0.9 
    : subscriptionPeriod === '6' 
    ? plan.operationsRateEur * 6 * 0.85 
    : plan.operationsRateEur) : 0

  return (
    <ClientLayout>
      <ClientPageHeader title="Checkout" showBackButton={true} backButtonHref="/client/upgrade" backButtonLabel="Back to Plans" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {plan && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{plan.name} Plan</p>
                        <p className="text-sm text-gray-500">
                          {subscriptionPeriod === '3' && '3 months (10% discount)'}
                          {subscriptionPeriod === '6' && '6 months (15% discount)'}
                          {subscriptionPeriod === '1' && '1 month'}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">€{subscriptionAmount.toFixed(2)}</p>
                    </div>

                    {setupFee && (
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">Setup Fee</p>
                          {setupFee.isPromotional && (
                            <p className="text-xs text-gray-500">
                              <span className="line-through">€{setupFee.suggestedAmountEur.toFixed(2)}</span>
                              {' '}Special price
                            </p>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">€{setupFee.currentAmountEur.toFixed(2)}</p>
                      </div>
                    )}

                    {voucherApplied && (
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div>
                          <p className="font-medium text-green-600">Voucher Discount</p>
                          <p className="text-xs text-gray-500">Code: {voucherCode}</p>
                        </div>
                        <p className="font-medium text-green-600">-€{voucherDiscount.toFixed(2)}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                      <p className="text-lg font-semibold text-gray-900">Total</p>
                      <p className="text-lg font-semibold text-gray-900">€{total.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription Period */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Period</h2>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setSubscriptionPeriod('1')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      subscriptionPeriod === '1'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">1 Month</p>
                    <p className="text-sm text-gray-500 mt-1">€{plan?.operationsRateEur.toFixed(2)}/month</p>
                  </button>
                  <button
                    onClick={() => setSubscriptionPeriod('3')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      subscriptionPeriod === '3'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">3 Months</p>
                    <p className="text-sm text-green-600 mt-1">10% OFF</p>
                    <p className="text-xs text-gray-500 mt-1">
                      €{(plan ? plan.operationsRateEur * 3 * 0.9 : 0).toFixed(2)} total
                    </p>
                  </button>
                  <button
                    onClick={() => setSubscriptionPeriod('6')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      subscriptionPeriod === '6'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">6 Months</p>
                    <p className="text-sm text-green-600 mt-1">15% OFF</p>
                    <p className="text-xs text-gray-500 mt-1">
                      €{(plan ? plan.operationsRateEur * 6 * 0.85 : 0).toFixed(2)} total
                    </p>
                  </button>
                </div>
              </div>

              {/* Voucher Code */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Voucher Code</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value)
                      setVoucherApplied(false)
                      setVoucherError('')
                    }}
                    placeholder="Enter voucher code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={voucherApplied}
                  />
                  {voucherApplied ? (
                    <button
                      onClick={() => {
                        setVoucherCode('')
                        setVoucherApplied(false)
                        setVoucherDiscount(0)
                        setVoucherError('')
                      }}
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyVoucher}
                      className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {voucherError && (
                  <p className="text-sm text-red-600 mt-2">{voucherError}</p>
                )}
                {voucherApplied && (
                  <p className="text-sm text-green-600 mt-2">Voucher applied successfully!</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'online'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'online' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'online' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                      </div>
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Pay Online</p>
                        <p className="text-sm text-gray-500">Credit card, debit card, or Revolut</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'bank_transfer' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                      </div>
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Bank Transfer</p>
                        <p className="text-sm text-gray-500">Pay via bank transfer (instructions will be provided)</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Purchase</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">€{(subscriptionAmount + (setupFee?.currentAmountEur || 0)).toFixed(2)}</span>
                  </div>
                  {voucherApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">-€{voucherDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">€{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Complete Purchase
                    </>
                  )}
                </button>

                <Link
                  href="/client/upgrade"
                  className="mt-4 block text-center text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back to Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

