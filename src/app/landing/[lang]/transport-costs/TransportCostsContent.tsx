'use client'

import React, { useState } from 'react'
import MainNavigation from '@/components/navigation/MainNavigation'
import type { Language } from '@/lib/i18n'

interface TransportCostsContentProps {
  lang: Language
  translations: Record<string, string>
}

type PaletteSize = 'standard' | 'large'

interface PricingData {
  country: string
  '1-4': { net: string; gross: string }
  '5+': { net: string; gross: string }
  note?: string
}

interface VolumePricing {
  direction: string
  net: string
  gross: string
}

const standardPrices: PricingData[] = [
  {
    country: 'germany',
    '1-4': { net: '100–140 €', gross: '123–172 €' },
    '5+': { net: '80–120 €', gross: '98–148 €' },
  },
  {
    country: 'netherlands',
    '1-4': { net: '130–180 €', gross: '160–221 €' },
    '5+': { net: '110–150 €', gross: '135–184 €' },
  },
  {
    country: 'france',
    '1-4': { net: '150–210 €', gross: '184–258 €' },
    '5+': { net: '130–180 €', gross: '160–221 €' },
  },
  {
    country: 'uk',
    '1-4': { net: '280–350 €', gross: '344–430 €' },
    '5+': { net: '240–300 €', gross: '295–369 €' },
    note: 'uk_note',
  },
  {
    country: 'ireland',
    '1-4': { net: '310–390 €', gross: '381–480 €' },
    '5+': { net: '270–360 €', gross: '332–443 €' },
  },
  {
    country: 'scandinavia',
    '1-4': { net: '170–260 €', gross: '209–320 €' },
    '5+': { net: '140–220 €', gross: '172–271 €' },
    note: 'scandinavia_note',
  },
]

const halfTruckPrices: VolumePricing[] = [
  { direction: 'germany', net: '1000–1500 €', gross: '1230–1845 €' },
  { direction: 'netherlands', net: '1300–1900 €', gross: '1599–2337 €' },
  { direction: 'france', net: '1600–2500 €', gross: '1968–3075 €' },
  { direction: 'uk', net: '1800–2600 €', gross: '2214–3198 €' },
  { direction: 'ireland', net: '2600–3400 €', gross: '3198–4182 €' },
]

const fullTruckPrices: VolumePricing[] = [
  { direction: 'germany', net: '1800–2400 €', gross: '2214–2952 €' },
  { direction: 'netherlands', net: '2200–3000 €', gross: '2706–3690 €' },
  { direction: 'france', net: '2600–3800 €', gross: '3198–4674 €' },
  { direction: 'uk', net: '3200–4200 €', gross: '3936–5166 €' },
  { direction: 'ireland', net: '4500–5500 €', gross: '5535–6765 €' },
]

function calculatePriceWithMultiplier(priceRange: string, multiplier: number): string {
  const [min, max] = priceRange.split('–').map((p) => parseFloat(p.replace(/[^\d.]/g, '')))
  const newMin = Math.round(min * multiplier)
  const newMax = Math.round(max * multiplier)
  return `${newMin}–${newMax} €`
}

function calculateGrossPrice(netRange: string): string {
  const [min, max] = netRange.split('–').map((p) => parseFloat(p.replace(/[^\d.]/g, '')))
  const grossMin = Math.round(min * 1.23)
  const grossMax = Math.round(max * 1.23)
  return `${grossMin}–${grossMax} €`
}

export default function TransportCostsContent({ lang, translations }: TransportCostsContentProps) {
  const [paletteSize, setPaletteSize] = useState<PaletteSize>('standard')
  const t = translations

  const getCountryName = (countryKey: string): string => {
    return t[`transport_costs_country_${countryKey}`] || countryKey
  }

  const getPrices = (): PricingData[] => {
    if (paletteSize === 'standard') {
      return standardPrices
    }
    // For large pallets, add 15% to prices
    return standardPrices.map((price) => ({
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
  }

  return (
    <div className="min-h-screen bg-white">
      <MainNavigation currentLang={lang} useLanguageContext={false} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.transport_costs_title}</h1>

          {/* 1. Wprowadzenie */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_intro_title}</h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>{t.transport_costs_intro_p1}</p>
              <p>{t.transport_costs_intro_p2}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t.transport_costs_intro_li1}</li>
                <li>{t.transport_costs_intro_li2}</li>
                <li>{t.transport_costs_intro_li3}</li>
              </ul>
              <p>{t.transport_costs_intro_p3}</p>
              <p>{t.transport_costs_intro_p4}</p>
            </div>
          </section>

          {/* 2. Ważna informacja o wycenie */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.transport_costs_pricing_title}
            </h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-gray-700">{t.transport_costs_pricing_p1}</p>
              <p className="text-gray-700 mt-2">{t.transport_costs_pricing_p2}</p>
            </div>
          </section>

          {/* 3. Własny transport */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_own_title}</h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>{t.transport_costs_own_p1}</p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="font-semibold text-gray-900 mb-2">
                  {t.transport_costs_own_warning}
                </p>
              </div>
              <p>{t.transport_costs_own_p2}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t.transport_costs_own_li1}</li>
                <li>{t.transport_costs_own_li2}</li>
                <li>{t.transport_costs_own_li3}</li>
              </ul>
              <p>{t.transport_costs_own_p3}</p>
            </div>
          </section>

          {/* 4. Wybór rodzaju palety */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_palette_title}</h2>
            <div className="flex items-center gap-4 mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="palette"
                  value="standard"
                  checked={paletteSize === 'standard'}
                  onChange={(e) => setPaletteSize(e.target.value as PaletteSize)}
                  className="mr-2"
                />
                <span className="text-gray-700">{t.transport_costs_palette_standard}</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="palette"
                  value="large"
                  checked={paletteSize === 'large'}
                  onChange={(e) => setPaletteSize(e.target.value as PaletteSize)}
                  className="mr-2"
                />
                <span className="text-gray-700">{t.transport_costs_palette_large}</span>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              {t.transport_costs_palette_note}
            </p>
          </section>

          {/* 5. Cennik palet – Europa */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_europe_title}</h2>
            <p className="text-gray-700 mb-4">
              {t.transport_costs_europe_note}
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>{t.transport_costs_europe_li1}</li>
              <li>{t.transport_costs_europe_li2}</li>
              <li>{t.transport_costs_europe_li3}</li>
              <li>{t.transport_costs_europe_li4}</li>
            </ul>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      {t.transport_costs_table_range}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      {t.transport_costs_table_net}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.transport_costs_table_gross}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPrices().map((price, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-3 font-semibold text-gray-900">
                          {idx + 1}. {getCountryName(price.country)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {t.transport_costs_europe_li1}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {price['1-4'].net}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{price['1-4'].gross}</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {t.transport_costs_europe_li2}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {price['5+'].net}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{price['5+'].gross}</td>
                      </tr>
                      {price.note && (
                        <tr>
                          <td colSpan={3} className="px-6 py-2 text-xs text-gray-600 italic bg-yellow-50">
                            {t[`transport_costs_country_${price.note}`] || ''}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Transport większych wolumenów */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.transport_costs_volumes_title}
            </h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t.transport_costs_half_truck_title}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_direction}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_net}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transport_costs_table_gross}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {halfTruckPrices.map((price, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {getCountryName(price.direction)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {price.net}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{price.gross}</td>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_direction}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        {t.transport_costs_table_net}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transport_costs_table_gross}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fullTruckPrices.map((price, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {getCountryName(price.direction)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                          {price.net}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{price.gross}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 7. FAQ */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_faq_title}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.transport_costs_faq_q1}
                </h3>
                <p className="text-gray-700">
                  {t.transport_costs_faq_a1}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.transport_costs_faq_q2}
                </h3>
                <p className="text-gray-700">
                  {t.transport_costs_faq_a2}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.transport_costs_faq_q3}
                </h3>
                <p className="text-gray-700">
                  {t.transport_costs_faq_a3}
                </p>
              </div>
            </div>
          </section>

          {/* 8. Disclaimer */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.transport_costs_disclaimer_title}</h2>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
              <p className="text-gray-700">
                {t.transport_costs_disclaimer}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

