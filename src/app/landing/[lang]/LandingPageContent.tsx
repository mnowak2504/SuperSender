'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { languages, type Language } from '@/lib/i18n'
import MainNavigation from '@/components/navigation/MainNavigation'
import { trackPageVisit, cleanupAnalytics } from '@/lib/analytics'

interface LandingPageContentProps {
  lang: Language
  translations: Record<string, string>
}

interface Plan {
  id: string
  name: string
  operationsRateEur: number
  promotionalPriceEur?: number | null | undefined
}

interface SetupFee {
  suggestedAmountEur: number
  currentAmountEur: number
  isPromotional: boolean
  validUntil: string | null
}

export default function LandingPageContent({ lang, translations }: LandingPageContentProps) {
  const pathname = usePathname()
  const [plans, setPlans] = useState<Plan[]>([])
  const [setupFee, setSetupFee] = useState<SetupFee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Save language preference to localStorage when on landing page
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang)
    }
    
    trackPageVisit(pathname || '/', lang)
    
    return () => {
      cleanupAnalytics()
    }
  }, [pathname, lang])

  useEffect(() => {
    // Fetch pricing data
    fetch('/api/landing/pricing')
      .then((res) => res.json())
      .then((data) => {
        console.log('[LandingPage] Pricing data received:', data)
        if (data.plans) {
          console.log('[LandingPage] Plans:', data.plans.map((p: Plan) => ({
            name: p.name,
            operationsRateEur: p.operationsRateEur,
            promotionalPriceEur: p.promotionalPriceEur,
          })))
          setPlans(data.plans)
        }
        if (data.setupFee) {
          console.log('[LandingPage] Setup fee:', data.setupFee)
          setSetupFee(data.setupFee)
        }
      })
      .catch((error) => {
        console.error('Error fetching pricing data:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Helper function to get plan price display
  const getPlanPrice = (plan: Plan) => {
    const originalPrice = plan.operationsRateEur
    const promotionalPrice = plan.promotionalPriceEur
    
    // Check if promotional price exists and is valid (not null, not undefined, not 0)
    // Show promotional price if it's different from original (can be higher or lower)
    if (promotionalPrice != null && promotionalPrice > 0 && promotionalPrice !== originalPrice) {
      return {
        original: originalPrice,
        promotional: promotionalPrice,
        isPromotional: true,
      }
    }
    
    return {
      original: originalPrice,
      promotional: null,
      isPromotional: false,
    }
  }

  // Helper function to get plan name key for translations
  const getPlanTranslationKey = (planName: string) => {
    const nameMap: Record<string, string> = {
      'Basic': 'basic',
      'Standard': 'standard',
      'Professional': 'pro',
      'Enterprise': 'enterprise',
    }
    return nameMap[planName] || planName.toLowerCase()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MainNavigation currentLang={lang} useLanguageContext={false} />

      {/* Hero Section */}
      <section data-section-id="hero" className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {translations.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {translations.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                {translations.hero_cta_primary}
              </Link>
              <a
                href="#about"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
              >
                {translations.hero_cta_secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-section-id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {translations.about_title}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {translations.about_subtitle}
            </p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {translations.about_description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.features_warehouse_title}
              </h3>
              <p className="text-gray-600">
                {translations.features_warehouse_desc}
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.features_digital_title}
              </h3>
              <p className="text-gray-600">
                {translations.features_digital_desc}
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.features_flexible_title}
              </h3>
              <p className="text-gray-600">
                {translations.features_flexible_desc}
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition">
              <div className="text-4xl mb-4">👩‍💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.features_support_title}
              </h3>
              <p className="text-gray-600">
                {translations.features_support_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" data-section-id="process" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {translations.process_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {translations.process_step1_title}
              </h3>
              <p className="text-gray-600 text-sm">
                {translations.process_step1_desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {translations.process_step2_title}
              </h3>
              <p className="text-gray-600 text-sm">
                {translations.process_step2_desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {translations.process_step3_title}
              </h3>
              <p className="text-gray-600 text-sm">
                {translations.process_step3_desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {translations.process_step4_title}
              </h3>
              <p className="text-gray-600 text-sm">
                {translations.process_step4_desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                5
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {translations.process_step5_title}
              </h3>
              <p className="text-gray-600 text-sm">
                {translations.process_step5_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" data-section-id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {translations.pricing_title}
            </h2>
            <p className="text-xl text-gray-600">
              {translations.pricing_subtitle}
            </p>
            <p className="text-lg text-gray-600 mt-2">
              {translations.pricing_subtitle_note}
            </p>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {loading ? (
              <div className="col-span-4 text-center py-8 text-gray-500">Loading pricing...</div>
            ) : (
              plans.map((plan) => {
                const planKey = getPlanTranslationKey(plan.name)
                const priceInfo = getPlanPrice(plan)
                const planTranslations = {
                  name: translations[`pricing_${planKey}_name`] || plan.name,
                  storage: translations[`pricing_${planKey}_storage`] || '',
                  deliveries: translations[`pricing_${planKey}_deliveries`] || '',
                  dispatches: translations[`pricing_${planKey}_dispatches`] || '',
                  notes: translations[`pricing_${planKey}_notes`] || '',
                  popular: translations[`pricing_${planKey}_popular`] || null,
                  localPickupDiscount: translations[`pricing_${planKey}_local_pickup_discount`] || null,
                }
                
                const isPro = plan.name === 'Professional'
                const isEnterprise = plan.name === 'Enterprise'
                
                return (
                  <div
                    key={plan.id}
                    className={`${
                      isPro
                        ? 'bg-blue-600 border-2 border-blue-600 transform scale-105 relative'
                        : 'bg-white border-2 border-gray-200'
                    } rounded-lg p-6 hover:shadow-xl transition`}
                  >
                    {planTranslations.popular && (
                      <div className={`${isPro ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'} text-xs font-semibold px-2 py-1 rounded-full inline-block mb-3 absolute top-4 right-4`}>
                        {planTranslations.popular}
                      </div>
                    )}
                    <h3 className={`text-xl font-bold mb-3 ${isPro ? 'text-white' : 'text-gray-900'}`}>
                      {planTranslations.name}
                    </h3>
                    <div className={`text-3xl font-bold mb-2 ${isPro ? 'text-white' : 'text-blue-600'}`}>
                      {priceInfo.isPromotional ? (
                        <div className="flex flex-col">
                          <span className={`line-through ${isPro ? 'text-blue-200' : 'text-gray-400'} text-xl mb-1`}>
                            €{priceInfo.original.toFixed(0)}/month
                          </span>
                          <span className={`${isPro ? 'text-white' : 'text-green-600'} text-3xl font-bold`}>
                            €{priceInfo.promotional!.toFixed(0)}/month
                          </span>
                        </div>
                      ) : isEnterprise ? (
                        <span>{translations.pricing_enterprise_price}</span>
                      ) : (
                        <span>€{priceInfo.original.toFixed(0)}/month</span>
                      )}
                    </div>
                    {setupFee && !isEnterprise && (
                      <div className={`text-sm mb-4 ${isPro ? 'text-blue-100' : 'text-gray-600'}`}>
                        {setupFee.isPromotional ? (
                          <>
                            <span className="line-through mr-2">Setup: €{setupFee.suggestedAmountEur.toFixed(0)}</span>
                            <span className="font-semibold">Setup: €{setupFee.currentAmountEur.toFixed(0)}</span>
                          </>
                        ) : (
                          <span>Setup: €{setupFee.currentAmountEur.toFixed(0)}</span>
                        )}
                      </div>
                    )}
                    <ul className={`space-y-3 mb-6 text-sm ${isPro ? 'text-white' : ''}`}>
                      <li className="flex items-start">
                        <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${isPro ? 'text-green-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isPro ? 'text-white' : 'text-gray-600'}>{planTranslations.storage}</span>
                      </li>
                      <li className="flex items-start">
                        <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${isPro ? 'text-green-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isPro ? 'text-white' : 'text-gray-600'}>{planTranslations.deliveries}</span>
                      </li>
                      <li className="flex items-start">
                        <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${isPro ? 'text-green-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isPro ? 'text-white' : 'text-gray-600'}>{planTranslations.dispatches}</span>
                      </li>
                      {planTranslations.localPickupDiscount && (
                        <li className="flex items-start">
                          <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${isPro ? 'text-green-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className={isPro ? 'text-white' : 'text-gray-600'}>{planTranslations.localPickupDiscount}</span>
                        </li>
                      )}
                    </ul>
                    <p className={`text-xs mb-4 italic ${isPro ? 'text-blue-100' : 'text-gray-500'}`}>
                      {planTranslations.notes}
                    </p>
                    <Link
                      href={isEnterprise && translations.pricing_enterprise_cta ? "#contact" : "/auth/signup"}
                      className={`block w-full text-center px-4 py-2 rounded-lg transition font-semibold text-sm ${
                        isPro
                          ? 'bg-white text-blue-600 hover:bg-gray-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isEnterprise && translations.pricing_enterprise_cta
                        ? translations.pricing_enterprise_cta
                        : translations.nav_signup}
                    </Link>
                  </div>
                )
              })
            )}
          </div>

          {/* Additional Services */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {translations.pricing_additional_title}
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">{translations.pricing_overstorage}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">{translations.pricing_extra_delivery}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">{translations.pricing_extra_dispatch}</span>
                </div>
                <div className="pt-3">
                  <p className="font-medium text-gray-700 mb-2">{translations.pricing_local_pickup_title}</p>
                  <div className="ml-4 space-y-1 text-gray-600">
                    {translations.pricing_local_pickup_10km && <div>{translations.pricing_local_pickup_10km}</div>}
                    {translations.pricing_local_pickup_20km && <div>{translations.pricing_local_pickup_20km}</div>}
                    {translations.pricing_local_pickup_30km && <div>{translations.pricing_local_pickup_30km}</div>}
                    {translations.pricing_local_pickup_50km && <div>{translations.pricing_local_pickup_50km}</div>}
                    {translations.pricing_local_pickup_100km && <div>{translations.pricing_local_pickup_100km}</div>}
                    {!translations.pricing_local_pickup_10km && (
                      <>
                        <div>→ up to 10 km: €20</div>
                        <div>→ up to 20 km: €35</div>
                        <div>→ up to 30 km: €45</div>
                        <div>→ up to 50 km: €60</div>
                        <div>→ up to 100 km: €110</div>
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-500 italic">{translations.pricing_local_pickup_note}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch Process Notes */}
          <div className="mb-16 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              {translations.pricing_dispatch_note_title}
            </h3>
            <p className="text-sm text-gray-600 italic text-center">
              {translations.pricing_dispatch_note}
            </p>
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{translations.pricing_basic_name}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{translations.pricing_standard_name}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{translations.pricing_pro_name}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{translations.pricing_enterprise_name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Monthly price (incl. VAT)</td>
                  {loading ? (
                    <>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                    </>
                  ) : (
                      plans.map((plan, index) => {
                      // Shift values one column to the left: Basic shows Standard's price, etc.
                      const nextPlanIndex = index + 1
                      const nextPlan = plans[nextPlanIndex]
                      
                      // For Enterprise (last column), show "Custom pricing"
                      if (plan.name === 'Enterprise') {
                        return (
                          <td key={plan.id} className="px-4 py-3 text-sm text-center text-gray-900">
                            {translations.pricing_enterprise_price}
                          </td>
                        )
                      }
                      
                      // For other plans, show the next plan's price
                      if (nextPlan) {
                        const priceInfo = getPlanPrice(nextPlan)
                        return (
                          <td key={plan.id} className="px-4 py-3 text-sm text-center text-gray-900">
                            {priceInfo.isPromotional ? (
                              <div className="flex flex-col items-center">
                                <span className="line-through text-gray-400 text-xs mb-1">
                                  €{priceInfo.original.toFixed(0)}/month
                                </span>
                                <span className="font-semibold text-green-600">€{priceInfo.promotional!.toFixed(0)}/month</span>
                              </div>
                            ) : (
                              `€${priceInfo.original.toFixed(0)}/month`
                            )}
                          </td>
                        )
                      }
                      
                      // Fallback (shouldn't happen)
                      return (
                        <td key={plan.id} className="px-4 py-3 text-sm text-center text-gray-900">-</td>
                      )
                    })
                  )}
                </tr>
                {setupFee && (
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Setup fee (one-time)</td>
                    {loading ? (
                      <>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">...</td>
                      </>
                    ) : (
                      plans.map((plan, index) => {
                        // Shift values one column to the left: Basic shows Standard's fee, etc.
                        const nextPlanIndex = index + 1
                        const nextPlan = plans[nextPlanIndex]
                        
                        // For Enterprise (last column), show "-"
                        if (plan.name === 'Enterprise') {
                          return (
                            <td key={plan.id} className="px-4 py-3 text-sm text-center text-gray-900">
                              -
                            </td>
                          )
                        }
                        
                        // For other plans, show the setup fee (same for all non-Enterprise plans)
                        return (
                          <td key={plan.id} className="px-4 py-3 text-sm text-center text-gray-900">
                            {setupFee.isPromotional ? (
                              <>
                                <span className="line-through text-gray-400 mr-2">
                                  €{setupFee.suggestedAmountEur.toFixed(0)}
                                </span>
                                <span className="font-semibold">€{setupFee.currentAmountEur.toFixed(0)}</span>
                              </>
                            ) : (
                              `€${setupFee.currentAmountEur.toFixed(0)}`
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Storage volume</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_basic_storage}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_standard_storage}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_pro_storage}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_enterprise_storage}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Deliveries per month</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_basic_deliveries}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_standard_deliveries}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_pro_deliveries}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_enterprise_deliveries}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Dispatches per month</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_basic_dispatches}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_standard_dispatches}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_pro_dispatches}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{translations.pricing_enterprise_dispatches}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Included photo documentation</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Dedicated account manager</td>
                  <td className="px-4 py-3 text-center text-gray-400">–</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Online dashboard access</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Real-time inventory tracking</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Priority packing</td>
                  <td className="px-4 py-3 text-center text-gray-400">–</td>
                  <td className="px-4 py-3 text-center text-gray-400">–</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Custom pricing / SLA</td>
                  <td className="px-4 py-3 text-center text-gray-400">–</td>
                  <td className="px-4 py-3 text-center text-gray-400">–</td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-4 py-3 text-center"><svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why MAK Consulting Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {translations.why_mak_title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-white hover:shadow-lg transition">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.why_mak_location_title}
              </h3>
              <p className="text-gray-600">
                {translations.why_mak_location_desc}
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white hover:shadow-lg transition">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.why_mak_pricing_title}
              </h3>
              <p className="text-gray-600">
                {translations.why_mak_pricing_desc}
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white hover:shadow-lg transition">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.why_mak_reliability_title}
              </h3>
              <p className="text-gray-600">
                {translations.why_mak_reliability_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {translations.cta_title}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {translations.cta_subtitle}
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            {translations.cta_button}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">{translations.footer_company}</h3>
              <p className="text-sm whitespace-pre-line">{translations.footer_registered_office}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">{translations.footer_address_title}</h4>
              <p className="text-sm">
                📞 {translations.footer_phone}
                <br />
                ✉ {translations.footer_email}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    {translations.footer_links_about}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    {translations.footer_links_terms}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    {translations.footer_links_privacy}
                  </Link>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition">
                    {translations.footer_links_contact}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">{translations.nav_contact}</h4>
              <p className="text-sm whitespace-pre-line">
                {translations.footer_warehouse_address}
                <br />
                <br />
                {translations.footer_office_address}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© {new Date().getFullYear()} {translations.footer_company} | {translations.footer_rights}</p>
            <p className="mt-2">
              <Link href="/about" className="hover:text-white transition mr-4">{translations.footer_links_about}</Link>
              <Link href="/terms" className="hover:text-white transition mr-4">{translations.footer_links_terms}</Link>
              <Link href="/privacy" className="hover:text-white transition mr-4">{translations.footer_links_privacy}</Link>
              <a href="#contact" className="hover:text-white transition">{translations.footer_links_contact}</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

