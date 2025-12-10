'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import MainNavigation from '@/components/navigation/MainNavigation'
import type { Language } from '@/lib/i18n'
import { trackPageVisit, cleanupAnalytics } from '@/lib/analytics'
import { 
  Package, 
  Shield, 
  TrendingDown, 
  Award, 
  AlertCircle, 
  Truck, 
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TransportCostsContentProps {
  lang: Language
  translations: Record<string, string>
}

type PaletteSize = 'standard' | 'large'

interface PricingData {
  country: string
  flag: string
  '1-4': { net: string; gross: string }
  '5+': { net: string; gross: string }
  note?: string
  isMain?: boolean
}

interface VolumePricing {
  direction: string
  flag: string
  net: string
  gross: string
}

const standardPrices: PricingData[] = [
  {
    country: 'ireland',
    flag: '🇮🇪',
    '1-4': { net: '310–390 €', gross: '381–480 €' },
    '5+': { net: '270–360 €', gross: '332–443 €' },
    isMain: true,
  },
  {
    country: 'germany',
    flag: '🇩🇪',
    '1-4': { net: '100–140 €', gross: '123–172 €' },
    '5+': { net: '80–120 €', gross: '98–148 €' },
    isMain: true,
  },
  {
    country: 'netherlands',
    flag: '🇳🇱',
    '1-4': { net: '130–180 €', gross: '160–221 €' },
    '5+': { net: '110–150 €', gross: '135–184 €' },
    isMain: true,
  },
  {
    country: 'france',
    flag: '🇫🇷',
    '1-4': { net: '150–210 €', gross: '184–258 €' },
    '5+': { net: '130–180 €', gross: '160–221 €' },
    isMain: true,
  },
]

const halfTruckPrices: VolumePricing[] = [
  { direction: 'ireland', flag: '🇮🇪', net: '2600–3400 €', gross: '3198–4182 €' },
  { direction: 'germany', flag: '🇩🇪', net: '1000–1500 €', gross: '1230–1845 €' },
  { direction: 'netherlands', flag: '🇳🇱', net: '1300–1900 €', gross: '1599–2337 €' },
  { direction: 'france', flag: '🇫🇷', net: '1600–2500 €', gross: '1968–3075 €' },
]

const fullTruckPrices: VolumePricing[] = [
  { direction: 'ireland', flag: '🇮🇪', net: '4500–5500 €', gross: '5535–6765 €' },
  { direction: 'germany', flag: '🇩🇪', net: '1800–2400 €', gross: '2214–2952 €' },
  { direction: 'netherlands', flag: '🇳🇱', net: '2200–3000 €', gross: '2706–3690 €' },
  { direction: 'france', flag: '🇫🇷', net: '2600–3800 €', gross: '3198–4674 €' },
]

function calculatePriceWithMultiplier(priceRange: string, multiplier: number): string {
  const [min, max] = priceRange.split('–').map((p) => parseFloat(p.replace(/[^\d.]/g, '')))
  const newMin = Math.round(min * multiplier)
  const newMax = Math.round(max * multiplier)
  return `${newMin}–${newMax} €`
}

export default function TransportCostsContent({ lang, translations }: TransportCostsContentProps) {
  const [paletteSize, setPaletteSize] = useState<PaletteSize>('standard')
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [showVolumes, setShowVolumes] = useState(false)
  const pathname = usePathname()
  const t = translations

  useEffect(() => {
    trackPageVisit(pathname || '/', lang)
    
    return () => {
      cleanupAnalytics()
    }
  }, [pathname, lang])

  const getCountryName = (countryKey: string): string => {
    return t[`transport_costs_country_${countryKey}`] || countryKey
  }

  const getPrices = (): PricingData[] => {
    const prices = paletteSize === 'standard' 
      ? standardPrices 
      : standardPrices.map((price) => ({
          ...price,
          '1-4': {
            net: calculatePriceWithMultiplier(price['1-4'].net, 1.15),
            gross: calculatePriceWithMultiplier(price['1-4'].gross, 1.15),
          },
          '5+': {
            net: calculatePriceWithMultiplier(price['5+'].net, 1.15),
            gross: calculatePriceWithMultiplier(price['5+'].gross, 1.15),
          },
        }))
    
    return showAllCountries ? prices : prices.filter(p => p.isMain)
  }

  const mainCountries = standardPrices.filter(p => p.isMain)
  const otherCountries = standardPrices.filter(p => !p.isMain)

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation currentLang={lang} useLanguageContext={false} />
      
      {/* Hero Section with USP */}
      <section data-section-id="transport-costs-hero" className="bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.transport_costs_hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-6">
              {t.transport_costs_hero_subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>{t.transport_costs_hero_tagline.split(' • ')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <span>{t.transport_costs_hero_tagline.split(' • ')[1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>{t.transport_costs_hero_tagline.split(' • ')[2]}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                {t.transport_costs_cta_get_started}
              </Link>
              <Link
                href={`/landing/${lang}#pricing`}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
              >
                {t.transport_costs_cta_request_quote}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Why Supersender Section */}
        <section data-section-id="transport-costs-why" className="mb-12 bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            {t.transport_costs_why_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_why_consolidation}</h3>
              <p className="text-sm text-gray-600">{t.transport_costs_why_consolidation_desc}</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_why_transparency}</h3>
              <p className="text-sm text-gray-600">{t.transport_costs_why_transparency_desc}</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_why_security}</h3>
              <p className="text-sm text-gray-600">{t.transport_costs_why_security_desc}</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_why_experience}</h3>
              <p className="text-sm text-gray-600">{t.transport_costs_why_experience_desc}</p>
            </div>
          </div>
        </section>

        <div className="bg-white shadow rounded-lg p-6 md:p-8">
          {/* Quick Intro */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-lg text-gray-700 mb-4">{t.transport_costs_intro_short}</p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {t.transport_costs_intro_benefits_title}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t.transport_costs_intro_li1}</li>
                <li>{t.transport_costs_intro_li2}</li>
                <li>{t.transport_costs_intro_li3}</li>
              </ul>
            </div>
          </section>

          {/* Important Pricing Info - Compact */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_pricing_title}</h3>
                  <p className="text-gray-700 text-sm">{t.transport_costs_pricing_short}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Own Transport - Compact */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              {t.transport_costs_own_title}
            </h3>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r mb-4">
              <p className="font-semibold text-gray-900 text-sm">
                {t.transport_costs_own_warning}
              </p>
            </div>
            <p className="text-sm text-gray-700 mb-2">{t.transport_costs_own_p2}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
              <li>{t.transport_costs_own_li1}</li>
              <li>{t.transport_costs_own_li2}</li>
              <li>{t.transport_costs_own_li3}</li>
            </ul>
          </section>

          {/* Palette Selection */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">{t.transport_costs_palette_title}</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center cursor-pointer bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                <input
                  type="radio"
                  name="palette"
                  value="standard"
                  checked={paletteSize === 'standard'}
                  onChange={(e) => setPaletteSize(e.target.value as PaletteSize)}
                  className="mr-2"
                />
                <span className="text-gray-700 font-medium">{t.transport_costs_palette_standard}</span>
              </label>
              <label className="flex items-center cursor-pointer bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                <input
                  type="radio"
                  name="palette"
                  value="large"
                  checked={paletteSize === 'large'}
                  onChange={(e) => setPaletteSize(e.target.value as PaletteSize)}
                  className="mr-2"
                />
                <span className="text-gray-700 font-medium">{t.transport_costs_palette_large}</span>
              </label>
            </div>
            <p className="text-sm text-gray-600">{t.transport_costs_palette_note}</p>
          </section>

          {/* Pricing Tables */}
          <section data-section-id="transport-costs-pricing" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.transport_costs_europe_title}</h2>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
              >
                {t.transport_costs_cta_request_quote}
              </Link>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_range}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_net}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transport_costs_table_gross}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPrices().map((price, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 sm:px-6 py-3 font-semibold text-gray-900">
                            <span className="text-xl mr-2">{price.flag}</span>
                            {getCountryName(price.country)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                            {t.transport_costs_europe_li1}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                            {price['1-4'].net}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                            {price['1-4'].gross}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                            {t.transport_costs_europe_li2}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                            {price['5+'].net}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                            {price['5+'].gross}
                          </td>
                        </tr>
                        {price.note && (
                          <tr>
                            <td colSpan={3} className="px-4 sm:px-6 py-2 text-xs text-gray-600 italic bg-yellow-50">
                              {t[`transport_costs_country_${price.note}`] || ''}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {otherCountries.length > 0 && !showAllCountries && (
              <button
                onClick={() => setShowAllCountries(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                <span>{t.transport_costs_show_more.replace('{count}', otherCountries.length.toString())}</span>
                <ChevronDown className="w-5 h-5" />
              </button>
            )}

            {showAllCountries && otherCountries.length > 0 && (
              <button
                onClick={() => setShowAllCountries(false)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                <span>{t.transport_costs_show_less}</span>
                <ChevronUp className="w-5 h-5" />
              </button>
            )}
          </section>

          {/* Larger Volumes - Accordion */}
          <section className="mb-8">
            <button
              onClick={() => setShowVolumes(!showVolumes)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <h2 className="text-2xl font-bold text-gray-900">{t.transport_costs_volumes_title}</h2>
              {showVolumes ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {showVolumes && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {t.transport_costs_half_truck_title}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {t.transport_costs_table_direction}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {t.transport_costs_table_net}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.transport_costs_table_gross}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {halfTruckPrices.map((price, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                              <span className="text-lg mr-2">{price.flag}</span>
                              {getCountryName(price.direction)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                              {price.net}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                              {price.gross}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {t.transport_costs_full_truck_title}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {t.transport_costs_table_direction}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {t.transport_costs_table_net}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.transport_costs_table_gross}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fullTruckPrices.map((price, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                              <span className="text-lg mr-2">{price.flag}</span>
                              {getCountryName(price.direction)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                              {price.net}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                              {price.gross}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* FAQ - Compact */}
          <section data-section-id="transport-costs-faq" className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.transport_costs_faq_title}</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_faq_q1}</h3>
                <p className="text-sm text-gray-700">{t.transport_costs_faq_a1}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_faq_q2}</h3>
                <p className="text-sm text-gray-700">{t.transport_costs_faq_a2}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t.transport_costs_faq_q3}</h3>
                <p className="text-sm text-gray-700">{t.transport_costs_faq_a3}</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-8 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.transport_costs_cta_ready}</h2>
            <p className="text-gray-700 mb-6">{t.transport_costs_cta_subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                {t.transport_costs_cta_get_started}
              </Link>
              <Link
                href={`/landing/${lang}#pricing`}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
              >
                {t.transport_costs_cta_request_quote}
              </Link>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r">
              <p className="text-sm text-gray-700">
                {t.transport_costs_disclaimer}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
