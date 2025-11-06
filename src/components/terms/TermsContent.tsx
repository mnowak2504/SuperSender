'use client'

import { useLanguage } from '@/lib/use-language'

export default function TermsContent() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {t('terms_title')}
      </h1>

      <div className="prose prose-lg max-w-none">
        {/* Company Information */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_effective_date')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_company_name')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_registered_office')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_warehouse_address')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>NIP:</strong> {t('terms_nip')}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_eu_vat')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_email')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_website')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('terms_business_hours')}</strong>
          </p>
          <p className="text-sm text-gray-700">
            <strong>{t('terms_transport_license')}</strong>
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. {t('terms_section1_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>MAK / We / Us</strong> – {t('terms_section1_mak')}</p>
            <p><strong>Supersender</strong> – {t('terms_section1_supersender')}</p>
            <p><strong>Client / You</strong> – {t('terms_section1_client')}</p>
            <p><strong>Warehouse</strong> – {t('terms_section1_warehouse')}</p>
            <p><strong>Delivery (Inbound)</strong> – {t('terms_section1_delivery')}</p>
            <p><strong>Dispatch (Outbound)</strong> – {t('terms_section1_dispatch')}</p>
            <p><strong>Transport by MAK</strong> – {t('terms_section1_transport_mak')}</p>
            <p><strong>Client-organized Transport</strong> – {t('terms_section1_transport_client')}</p>
            <p><strong>Subscription / Plan</strong> – {t('terms_section1_subscription')}</p>
            <p><strong>Cubic Volume (m³)</strong> – {t('terms_section1_cubic')}</p>
            <p><strong>Pallet Space</strong> – {t('terms_section1_pallet')}</p>
            <p><strong>Overlimit Storage</strong> – {t('terms_section1_overlimit')}</p>
            <p><strong>Prohibited Goods</strong> – {t('terms_section1_prohibited')}</p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. {t('terms_section2_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section2_p1')}</p>
            <p>{t('terms_section2_p2')}</p>
            <p>{t('terms_section2_p3')}</p>
            <p>{t('terms_section2_p4')}</p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. {t('terms_section3_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section3_p1')}</p>
            <p>{t('terms_section3_p2')}</p>
            <div className="bg-gray-50 p-4 rounded my-4 font-mono text-sm whitespace-pre-line">
              {t('terms_section3_address')}
            </div>
            <p>{t('terms_section3_p3')}</p>
            <p>{t('terms_section3_p4')}</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. {t('terms_section4_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section4_p1')}</p>
            <p>{t('terms_section4_p2')}</p>
            <p>{t('terms_section4_p3')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section4_list1')}</li>
              <li>{t('terms_section4_list2')}</li>
              <li>{t('terms_section4_list3')}</li>
              <li>{t('terms_section4_list4')}</li>
            </ul>
            <p>{t('terms_section4_p4')}</p>
            <p>{t('terms_section4_p5')}</p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. {t('terms_section5_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section5_p1')}</p>
            <p>{t('terms_section5_p2')}</p>
            <p>{t('terms_section5_p3')}</p>
            <p>{t('terms_section5_p4')}</p>
            <p>{t('terms_section5_p5')}</p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. {t('terms_section6_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section6_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section6_list1')}</li>
              <li>{t('terms_section6_list2')}</li>
              <li>{t('terms_section6_list3')}</li>
              <li>{t('terms_section6_list4')}</li>
            </ul>
            <p><strong>{t('terms_section6_prep_times')}</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section6_time1')}</li>
              <li>{t('terms_section6_time2')}</li>
            </ul>
            <p>{t('terms_section6_p2')}</p>
            <p><strong>{t('terms_section6_pricing')}</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section6_price1')}</li>
              <li>{t('terms_section6_price2')}</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. {t('terms_section7_title')}</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">A. {t('terms_section7a_title')}</h3>
              <p>{t('terms_section7a_p1')}</p>
              <p>{t('terms_section7a_p2')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('terms_section7a_list1')}</li>
                <li>{t('terms_section7a_list2')}</li>
                <li>{t('terms_section7a_list3')}</li>
              </ul>
              <p>{t('terms_section7a_p3')}</p>
              <p>{t('terms_section7a_p4')}</p>
              <p>{t('terms_section7a_p5')}</p>
              <p>{t('terms_section7a_p6')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">B. {t('terms_section7b_title')}</h3>
              <p>{t('terms_section7b_p1')}</p>
              <p>{t('terms_section7b_p2')}</p>
              <p>{t('terms_section7b_p3')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('terms_section7b_list1')}</li>
                <li>{t('terms_section7b_list2')}</li>
                <li>{t('terms_section7b_list3')}</li>
              </ul>
              <p>{t('terms_section7b_p4')}</p>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. {t('terms_section8_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section8_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section8_list1')}</li>
              <li>{t('terms_section8_list2')}</li>
              <li>{t('terms_section8_list3')}</li>
              <li>{t('terms_section8_list4')}</li>
              <li>{t('terms_section8_list5')}</li>
            </ul>
            <p>{t('terms_section8_p2')}</p>
            <p>{t('terms_section8_p3')}</p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. {t('terms_section9_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section9_p1')}</p>
            <p>{t('terms_section9_p2')}</p>
            <p>{t('terms_section9_p3')}</p>
            <p>{t('terms_section9_p4')}</p>
            <p>{t('terms_section9_p5')}</p>
            <p>{t('terms_section9_p6')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section9_list1')}</li>
              <li>{t('terms_section9_list2')}</li>
              <li>{t('terms_section9_list3')}</li>
            </ul>
            <p>{t('terms_section9_p7')}</p>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. {t('terms_section10_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section10_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section10_list1')}</li>
              <li>{t('terms_section10_list2')}</li>
              <li>{t('terms_section10_list3')}</li>
              <li>{t('terms_section10_list4')}</li>
              <li>{t('terms_section10_list5')}</li>
              <li>{t('terms_section10_list6')}</li>
              <li>{t('terms_section10_list7')}</li>
            </ul>
            <p>{t('terms_section10_p2')}</p>
          </div>
        </section>

        {/* Section 11 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. {t('terms_section11_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section11_p1')}</p>
            <p>{t('terms_section11_p2')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section11_list1')}</li>
              <li>{t('terms_section11_list2')}</li>
              <li>{t('terms_section11_list3')}</li>
            </ul>
          </div>
        </section>

        {/* Section 12 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. {t('terms_section12_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section12_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms_section12_list1')}</li>
              <li>{t('terms_section12_list2')}</li>
              <li>{t('terms_section12_list3')}</li>
              <li>{t('terms_section12_list4')}</li>
            </ul>
            <p>{t('terms_section12_p2')}</p>
            <p>{t('terms_section12_p3')}</p>
            <p>{t('terms_section12_p4')}</p>
          </div>
        </section>

        {/* Section 13 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">13. {t('terms_section13_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section13_p1')}</p>
            <p>{t('terms_section13_p2')}</p>
            <p>{t('terms_section13_p3')}</p>
            <p>{t('terms_section13_p4')}</p>
          </div>
        </section>

        {/* Section 14 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">14. {t('terms_section14_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section14_p1')}</p>
            <p>{t('terms_section14_p2')}</p>
          </div>
        </section>

        {/* Section 15 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">15. {t('terms_section15_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section15_p1')}</p>
            <p>{t('terms_section15_p2')}</p>
            <p>{t('terms_section15_p3')}</p>
          </div>
        </section>

        {/* Section 16 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">16. {t('terms_section16_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section16_p1')}</p>
            <p>{t('terms_section16_p2')}</p>
          </div>
        </section>

        {/* Section 17 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">17. {t('terms_section17_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section17_p1')}</p>
            <p>{t('terms_section17_p2')}</p>
          </div>
        </section>

        {/* Section 18 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">18. {t('terms_section18_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section18_p1')}</p>
          </div>
        </section>

        {/* Section 19 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">19. {t('terms_section19_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section19_p1')}</p>
            <p>{t('terms_section19_p2')}</p>
          </div>
        </section>

        {/* Section 20 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">20. {t('terms_section20_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p>{t('terms_section20_p1')}</p>
            <p>{t('terms_section20_p2')}</p>
            <p>{t('terms_section20_p3')}</p>
          </div>
        </section>

        {/* Annex A */}
        <section className="mb-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms_annex_title')}</h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>{t('terms_annex_warehouse')}</strong></p>
            <div className="bg-white p-4 rounded font-mono text-sm my-4 whitespace-pre-line">
              {t('terms_annex_address')}
            </div>
            <p><strong>{t('terms_annex_storage')}</strong></p>
            <p><strong>{t('terms_annex_dispatch')}</strong></p>
            <p><strong>{t('terms_annex_hours')}</strong></p>
            <p><strong>{t('terms_annex_transport_mak')}</strong></p>
            <p><strong>{t('terms_annex_transport_client')}</strong></p>
            <p><strong>{t('terms_annex_payments')}</strong></p>
            <p><strong>{t('terms_annex_invoices')}</strong></p>
            <p><strong>{t('terms_annex_prohibited')}</strong></p>
            <p><strong>{t('terms_annex_claims')}</strong></p>
          </div>
        </section>
      </div>
    </div>
  )
}

