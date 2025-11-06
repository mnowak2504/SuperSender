'use client'

import { useLanguage } from '@/lib/use-language'

export default function PrivacyContent() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {t('privacy_title')}
      </h1>

      <div className="prose prose-lg max-w-none">
        {/* Company Information */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_effective_date')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_company')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_registered_address')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_warehouse_address')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_nip')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_eu_vat')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_email')}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{t('privacy_phone')}</strong>
          </p>
          <p className="text-sm text-gray-700">
            <strong>{t('privacy_website')}</strong>
          </p>
        </div>

        {/* Section 1: Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section1_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section1_p1')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section1_p2')}
          </p>
        </section>

        {/* Section 2: Data Controller */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section2_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section2_p1')}
          </p>
          <div className="bg-gray-50 p-4 rounded my-4 font-mono text-sm whitespace-pre-line">
            {t('privacy_section2_address')}
          </div>
          <p className="text-gray-700">
            {t('privacy_section2_p2')}
          </p>
        </section>

        {/* Section 3: Scope */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section3_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section3_p1')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{t('privacy_section3_list1')}</li>
            <li>{t('privacy_section3_list2')}</li>
            <li>{t('privacy_section3_list3')}</li>
            <li>{t('privacy_section3_list4')}</li>
          </ul>
        </section>

        {/* Section 4: Types of Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section4_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section4_p1')}
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            {t('privacy_section4a_title')}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>{t('privacy_section4a_list1')}</li>
            <li>{t('privacy_section4a_list2')}</li>
            <li>{t('privacy_section4a_list3')}</li>
            <li>{t('privacy_section4a_list4')}</li>
            <li>{t('privacy_section4a_list5')}</li>
            <li>{t('privacy_section4a_list6')}</li>
            <li>{t('privacy_section4a_list7')}</li>
            <li>{t('privacy_section4a_list8')}</li>
            <li>{t('privacy_section4a_list9')}</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            {t('privacy_section4b_title')}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>{t('privacy_section4b_list1')}</li>
            <li>{t('privacy_section4b_list2')}</li>
            <li>{t('privacy_section4b_list3')}</li>
            <li>{t('privacy_section4b_list4')}</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            {t('privacy_section4c_title')}
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{t('privacy_section4c_list1')}</li>
            <li>{t('privacy_section4c_list2')}</li>
            <li>{t('privacy_section4c_list3')}</li>
          </ul>
        </section>

        {/* Section 5: Purpose and Legal Basis */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section5_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section5_p1')}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">{t('privacy_section5_table_purpose')}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{t('privacy_section5_table_basis')}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{t('privacy_section5_table_details')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row1_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row1_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row1_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row2_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row2_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row2_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row3_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row3_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row3_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row4_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row4_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row4_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row5_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row5_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row5_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row6_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row6_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row6_details')}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row7_purpose')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row7_basis')}</td>
                  <td className="border border-gray-300 px-4 py-2">{t('privacy_section5_row7_details')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6: Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section6_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section6_p1')}
          </p>
          <p className="text-gray-700 mb-4">
            <strong>{t('privacy_section6_p2')}</strong>
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>{t('privacy_section6_list1')}</li>
            <li>{t('privacy_section6_list2')}</li>
            <li>{t('privacy_section6_list3')}</li>
            <li>{t('privacy_section6_list4')}</li>
          </ul>
          <p className="text-gray-700">
            {t('privacy_section6_p3')}
          </p>
        </section>

        {/* Section 7: Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section7_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section7_p1')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>{t('privacy_section7_list1')}</li>
            <li>{t('privacy_section7_list2')}</li>
            <li>{t('privacy_section7_list3')}</li>
            <li>{t('privacy_section7_list4')}</li>
            <li>{t('privacy_section7_list5')}</li>
          </ul>
          <p className="text-gray-700">
            {t('privacy_section7_p2')}
          </p>
        </section>

        {/* Section 8: International Data Transfers */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section8_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section8_p1')}
          </p>
          <p className="text-gray-700 mb-4">
            {t('privacy_section8_p2')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{t('privacy_section8_list1')}</li>
            <li>{t('privacy_section8_list2')}</li>
          </ul>
        </section>

        {/* Section 9: Data Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section9_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section9_p1')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>{t('privacy_section9_list1')}</li>
            <li>{t('privacy_section9_list2')}</li>
            <li>{t('privacy_section9_list3')}</li>
            <li>{t('privacy_section9_list4')}</li>
            <li>{t('privacy_section9_list5')}</li>
          </ul>
          <p className="text-gray-700 mb-4">
            {t('privacy_section9_p2')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section9_p3')}
          </p>
        </section>

        {/* Section 10: Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section10_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section10_p1')}
          </p>
          <p className="text-gray-700 mb-4">
            <strong>{t('privacy_section10_p2')}</strong>
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>{t('privacy_section10_list1')}</li>
            <li>{t('privacy_section10_list2')}</li>
            <li>{t('privacy_section10_list3')}</li>
            <li>{t('privacy_section10_list4')}</li>
          </ul>
          <p className="text-gray-700 mb-4">
            {t('privacy_section10_p3')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section10_p4')}
          </p>
        </section>

        {/* Section 11: Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section11_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section11_p1')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>{t('privacy_section11_list1_title')}</strong> – {t('privacy_section11_list1_desc')}</li>
            <li><strong>{t('privacy_section11_list2_title')}</strong> – {t('privacy_section11_list2_desc')}</li>
            <li><strong>{t('privacy_section11_list3_title')}</strong> – {t('privacy_section11_list3_desc')}</li>
            <li><strong>{t('privacy_section11_list4_title')}</strong> – {t('privacy_section11_list4_desc')}</li>
            <li><strong>{t('privacy_section11_list5_title')}</strong> – {t('privacy_section11_list5_desc')}</li>
            <li><strong>{t('privacy_section11_list6_title')}</strong> – {t('privacy_section11_list6_desc')}</li>
            <li><strong>{t('privacy_section11_list7_title')}</strong> – {t('privacy_section11_list7_desc')}</li>
          </ul>
          <p className="text-gray-700 mb-4">
            {t('privacy_section11_p2')}
          </p>
          <p className="text-gray-700 mb-4">
            {t('privacy_section11_p3')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section11_p4')}
          </p>
        </section>

        {/* Section 12: Children's Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section12_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section12_p1')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section12_p2')}
          </p>
        </section>

        {/* Section 13: Third-Party Links */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section13_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section13_p1')}
          </p>
          <p className="text-gray-700 mb-4">
            {t('privacy_section13_p2')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section13_p3')}
          </p>
        </section>

        {/* Section 14: Automated Decision-Making */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section14_title')}
          </h2>
          <p className="text-gray-700">
            {t('privacy_section14_p1')}
          </p>
        </section>

        {/* Section 15: Updates */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section15_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section15_p1')}
          </p>
          <p className="text-gray-700 mb-4">
            {t('privacy_section15_p2')}
          </p>
          <p className="text-gray-700">
            {t('privacy_section15_p3')}
          </p>
        </section>

        {/* Section 16: Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section16_title')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('privacy_section16_p1')}
          </p>
          <div className="bg-gray-50 p-4 rounded my-4 font-mono text-sm whitespace-pre-line">
            {t('privacy_section16_address')}
          </div>
        </section>

        {/* Section 17: Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('privacy_section17_title')}
          </h2>
          <p className="text-gray-700">
            {t('privacy_section17_p1')}
          </p>
        </section>
      </div>
    </div>
  )
}

