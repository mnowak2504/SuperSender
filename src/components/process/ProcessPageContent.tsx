'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Package, Truck, Box, Settings, CreditCard, FileText, ArrowRight, UserPlus, ClipboardList, Warehouse, Send, Globe } from 'lucide-react'
import MainNavigation from '@/components/navigation/MainNavigation'
import { useLanguage } from '@/lib/use-language'

export default function ProcessPageContent() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MainNavigation useLanguageContext={true} />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('process_hero_title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              {t('process_hero_subtitle')}
            </p>
            
            {/* Visual suggestion: Icon chain */}
            <div className="flex justify-center items-center gap-4 mb-8 flex-wrap">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Supplier</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                  <Warehouse className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="text-sm text-gray-600">Supersender</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Truck className="w-8 h-8 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Delivery</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                {t('process_hero_cta_start')}
              </Link>
              <Link
                href="/landing/en#pricing"
                className="inline-block bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
              >
                {t('process_hero_cta_pricing')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Create Your Account */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <UserPlus className="w-8 h-8 text-blue-600" />
                Create Your Account
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('process_step1_text')}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('process_step1_address_label')}</p>
                <div className="bg-white rounded p-4 border border-gray-200 font-mono text-sm whitespace-pre-line text-gray-800">
                  {t('process_step1_address')}
                </div>
              </div>
              
              <div className="space-y-3 text-gray-700">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step1_note1')}</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step1_note2')}</span>
                </p>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">{t('process_step1_tip')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Report an Incoming Delivery */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-blue-600" />
                Report an Incoming Delivery
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('process_step2_text')}
              </p>
              
              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-3">{t('process_step2_enter')}</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_supplier')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_product')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_order')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-3">{t('process_step2_warehouse')}</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_confirm')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_measure')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step2_mark')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-gray-700">{t('process_step2_photos')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Storage & Management */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Warehouse className="w-8 h-8 text-blue-600" />
                Storage & Management
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('process_step3_text')}
              </p>
              
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step3_volume')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step3_space')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step3_photos')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('process_step3_details')}</span>
                </li>
              </ul>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">{t('process_step3_overlimit')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4: Request a Dispatch */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              4
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Send className="w-8 h-8 text-blue-600" />
                Request a Dispatch
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('process_step4_text')}
              </p>
              
              <div className="mb-6">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {t('process_step4_text')}
                </p>
                <p className="font-semibold text-gray-900 mb-3">{t('process_step4_text').includes('.') ? t('process_step4_text').split('.')[0] + '.' : t('process_step4_text')}</p>
                <p className="font-semibold text-gray-900 mb-3 mt-4">Our team will:</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_consolidate')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_pack')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_measure')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_upload')}</span>
                  </li>
                </ul>
                
                <p className="font-semibold text-gray-900 mb-3">{t('process_step4_ready')}</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_dimensions')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_space_used')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step4_price')}</span>
                  </li>
                </ul>
                
                <p className="font-semibold text-gray-900 mb-3">{t('process_step4_choose')}</p>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>{t('process_step4_accept')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">💬</span>
                    <span>{t('process_step4_custom')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">🚚</span>
                    <span>{t('process_step4_own')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{t('process_step4_timeline')}</p>
                <p>{t('process_step4_basic')}</p>
                <p>{t('process_step4_pro')}</p>
                <p className="text-yellow-700 font-medium">{t('process_step4_pickup')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 5: Transport & Delivery */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              5
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-600" />
                Transport & Delivery
              </h2>
              
              <div className="mb-6">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {t('process_step5_text')}
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step5_handle')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step5_costs')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step5_updates')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-3">{t('process_step5_own_title')}</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step5_own_data')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step5_own_pickup')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-gray-700">{t('process_step5_archive')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 6: Subscription & Billing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              6
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
                {t('process_step6_title')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('process_step6_text')}
              </p>
              
              <div className="mb-6">
                <p className="font-semibold text-gray-900 mb-3">{t('process_step6_payments')}</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step6_subscription')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step6_additional')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{t('process_step6_transport')}</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-gray-700 mb-4">{t('process_step6_invoice')}</p>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">{t('process_step6_tip')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('process_why_title')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('process_why_clarity_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('process_why_clarity_desc')}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('process_why_control_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('process_why_control_desc')}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('process_why_reliability_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('process_why_reliability_desc')}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('process_why_reach_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('process_why_reach_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            {t('process_faq_title')}
          </h2>
          
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition">
                {t('process_faq_q1')}
              </summary>
              <p className="mt-4 text-gray-700 leading-relaxed">
                {t('process_faq_a1')}
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition">
                {t('process_faq_q2')}
              </summary>
              <p className="mt-4 text-gray-700 leading-relaxed">
                {t('process_faq_a2')}
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition">
                {t('process_faq_q3')}
              </summary>
              <p className="mt-4 text-gray-700 leading-relaxed">
                {t('process_faq_a3')}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('process_cta_title')}
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            {t('process_cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-blue-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              {t('process_cta_button1')}
            </Link>
            <Link
              href="mailto:info@makconsulting.pl"
              className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition"
            >
              {t('process_cta_button2')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

