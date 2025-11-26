'use client'

import React, { useState } from 'react'

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
    country: 'Niemcy',
    '1-4': { net: '100–140 €', gross: '123–172 €' },
    '5+': { net: '80–120 €', gross: '98–148 €' },
  },
  {
    country: 'Holandia / Belgia',
    '1-4': { net: '130–180 €', gross: '160–221 €' },
    '5+': { net: '110–150 €', gross: '135–184 €' },
  },
  {
    country: 'Francja',
    '1-4': { net: '150–210 €', gross: '184–258 €' },
    '5+': { net: '130–180 €', gross: '160–221 €' },
  },
  {
    country: 'Wielka Brytania (UK)',
    '1-4': { net: '280–350 €', gross: '344–430 €' },
    '5+': { net: '240–300 €', gross: '295–369 €' },
    note: 'Ceny nie obejmują odpraw celnych w PL i UK.',
  },
  {
    country: 'Irlandia',
    '1-4': { net: '310–390 €', gross: '381–480 €' },
    '5+': { net: '270–360 €', gross: '332–443 €' },
  },
  {
    country: 'Skandynawia (DK / SE / FI / NO)',
    '1-4': { net: '170–260 €', gross: '209–320 €' },
    '5+': { net: '140–220 €', gross: '172–271 €' },
    note: 'Ostateczna cena zależy od regionu, promów i mostów.',
  },
]

const halfTruckPrices: VolumePricing[] = [
  { direction: 'Niemcy', net: '1000–1500 €', gross: '1230–1845 €' },
  { direction: 'NL / BE', net: '1300–1900 €', gross: '1599–2337 €' },
  { direction: 'Francja', net: '1600–2500 €', gross: '1968–3075 €' },
  { direction: 'UK', net: '1800–2600 €', gross: '2214–3198 €' },
  { direction: 'Irlandia', net: '2600–3400 €', gross: '3198–4182 €' },
]

const fullTruckPrices: VolumePricing[] = [
  { direction: 'Niemcy', net: '1800–2400 €', gross: '2214–2952 €' },
  { direction: 'NL / BE', net: '2200–3000 €', gross: '2706–3690 €' },
  { direction: 'Francja', net: '2600–3800 €', gross: '3198–4674 €' },
  { direction: 'UK', net: '3200–4200 €', gross: '3936–5166 €' },
  { direction: 'Irlandia', net: '4500–5500 €', gross: '5535–6765 €' },
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

export default function TransportCostsContent() {
  const [paletteSize, setPaletteSize] = useState<PaletteSize>('standard')

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CENNIK DOSTAW</h1>

        {/* 1. Wprowadzenie */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Wprowadzenie</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              Poniższy cennik przedstawia orientacyjne ceny netto za transport. Do stawek należy
              doliczyć 23% VAT – w tabelach pokazujemy wartości netto i brutto.
            </p>
            <p>
              Możesz zlecić nam transport zgodnie z poniższymi stawkami. W wielu przypadkach jesteśmy
              w stanie zaproponować niższą cenę, jeżeli:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>paleta jest lekka,</li>
              <li>ładunek zajmuje mniej miejsca,</li>
              <li>transport możemy skonsolidować z innymi przesyłkami.</li>
            </ul>
            <p>
              Po spakowaniu zamówienia podajemy dokładne wymiary, wagę i zdjęcia palety/paczek, dzięki
              czemu możesz także zorganizować transport we własnym zakresie.
            </p>
            <p>
              Wszystkie przesyłki są objęte standardowym ubezpieczeniem przewoźnika zgodnie z konwencją
              CMR.
            </p>
          </div>
        </section>

        {/* 2. Ważna informacja o wycenie */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Ważna informacja o wycenie
          </h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-gray-700">
              Przewoźnicy stosują do wyceny rzeczywisty obrys przesyłki. Jeśli towar wystaje poza
              paletę (np. drzwi, okna, szkło, konstrukcje), koszt transportu obliczany jest według
              najdalszych punktów obrysu, a nie wymiarów samej palety.
            </p>
            <p className="text-gray-700 mt-2">
              Ostateczna cena może zostać skorygowana po pomiarze gotowej do wysyłki palety.
            </p>
          </div>
        </section>

        {/* 3. Własny transport */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Własny transport</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>Możesz podstawić własnego przewoźnika lub kuriera. Dla bezpieczeństwa towaru stosujemy następujące zasady:</p>
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="font-semibold text-gray-900 mb-2">
                Nie wydajemy towaru, jeśli numer rejestracyjny ciężarówki nie został zgłoszony lub nie zgadza się z danymi wprowadzonymi do systemu.
              </p>
            </div>
            <p>Twój spedytor powinien przekazać:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>numer rejestracyjny pojazdu,</li>
              <li>dane kierowcy,</li>
              <li>planowaną godzinę załadunku.</li>
            </ul>
            <p>
              Przy wysyłkach kurierskich prosimy o przesłanie etykiety / labela do Twojego opiekuna –
              wydrukujemy ją i przekażemy właściwemu kurierowi.
            </p>
          </div>
        </section>

        {/* 4. Wybór rodzaju palety */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Wybór rodzaju palety</h2>
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
              <span className="text-gray-700">Paleta 120×80 (standard)</span>
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
              <span className="text-gray-700">Paleta 120×120 (duża – ceny +15%)</span>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            Po zmianie rozmiaru system automatycznie przelicza ceny netto i brutto.
          </p>
        </section>

        {/* 5. Cennik palet – Europa */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cennik palet – Europa</h2>
          <p className="text-gray-700 mb-4">
            Każda tabela zawiera:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>1–4 palety</li>
            <li>5+ palet</li>
            <li>ceny netto</li>
            <li>ceny brutto (z 23% VAT)</li>
          </ul>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Zakres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Cena netto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena brutto (23% VAT)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPrices().map((price, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-3 font-semibold text-gray-900">
                        {idx + 1}. {price.country}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        1–4 palety
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        {price['1-4'].net}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{price['1-4'].gross}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        5+ palet
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        {price['5+'].net}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{price['5+'].gross}</td>
                    </tr>
                    {price.note && (
                      <tr>
                        <td colSpan={3} className="px-6 py-2 text-xs text-gray-600 italic bg-yellow-50">
                          {price.note}
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
            6. Transport większych wolumenów
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              6.1. 1/2 ciężarówki (ok. 15–18 palet)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Kierunek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Cena netto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cena brutto (23% VAT)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {halfTruckPrices.map((price, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        {price.direction}
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
              6.2. Cały zestaw (33 palety)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Kierunek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Cena netto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cena brutto (23% VAT)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fullTruckPrices.map((price, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-300">
                        {price.direction}
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy podane ceny są ostateczne?
              </h3>
              <p className="text-gray-700">
                Nie. To ceny orientacyjne, które mogą ulec korekcie po określeniu rzeczywistych
                wymiarów, wagi oraz wybranego przewoźnika.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy ceny można negocjować?
              </h3>
              <p className="text-gray-700">
                Tak. Przy lekkich paletach, mniejszej wysokości lub stałej współpracy możemy
                zaproponować korzystniejszą stawkę.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy mogę zorganizować własny transport?
              </h3>
              <p className="text-gray-700">
                Tak. Otrzymasz komplet wymiarów i wagę. Wydanie towaru następuje wyłącznie po
                weryfikacji numeru rejestracyjnego i danych kierowcy.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Disclaimer */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer</h2>
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
            <p className="text-gray-700">
              Cennik ma charakter orientacyjny i może ulec zmianie w zależności od sezonu, cen paliwa,
              dostępności floty oraz parametrów ładunku. Supersender zastrzega możliwość aktualizacji
              cen bez wcześniejszego powiadomienia.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

