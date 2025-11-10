'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, Handshake, Package, Settings, Globe, Users, Mail, CheckCircle } from 'lucide-react'
import MainNavigation from '@/components/navigation/MainNavigation'
import { useLanguage } from '@/lib/use-language'

export default function AboutUsContent() {
  const { t } = useLanguage()
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MainNavigation useLanguageContext={true} />
      
      {/* Hero Section - WHY */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 pt-16">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        
        {/* Background image placeholder - można dodać prawdziwe zdjęcie */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 z-0"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {t('about_hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            {t('about_hero_subtitle')}
          </p>
          <p className="text-lg md:text-xl text-white mb-12 font-semibold whitespace-pre-line">
            We don&apos;t just move goods.
            {'\n'}
            We connect people, ideas, and opportunities — across borders.
          </p>
          <button
            onClick={() => scrollToSection('story')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            {t('about_hero_cta')}
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('about_story_title')}
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  {t('about_story_text1')}
                </p>
                <p>
                  {t('about_story_text2')}
                </p>
                <p>
                  {t('about_story_text3')}
                </p>
                <p className="font-semibold text-gray-900">
                  {t('about_story_text4')}
                </p>
              </div>
            </div>
            <div className="relative">
              {/* Warehouse Photo */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Our warehouse</p>
                <div className="aspect-[4/3] rounded-lg shadow-xl overflow-hidden relative bg-gray-100">
                  <Image
                    src="/warehouse.jpg"
                    alt="Our warehouse in Siemianowice Śląskie, Poland"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              
              {/* Timeline */}
              <div className="mt-8 relative">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-semibold text-gray-900">2021</p>
                    <p className="text-xs text-gray-600">Start</p>
                  </div>
                  <div className="flex-1 h-0.5 bg-blue-200 mx-2"></div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-semibold text-gray-900">2022</p>
                    <p className="text-xs text-gray-600">ImportFromPoland</p>
                  </div>
                  <div className="flex-1 h-0.5 bg-blue-200 mx-2"></div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-semibold text-gray-900">2024</p>
                    <p className="text-xs text-gray-600">PolandMaterialsTours</p>
                  </div>
                  <div className="flex-1 h-0.5 bg-blue-200 mx-2"></div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-semibold text-gray-900">2025</p>
                    <p className="text-xs text-gray-600">Supersender</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('about_how_title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about_how_partner_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about_how_partner_desc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about_how_storage_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about_how_storage_desc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about_how_transparent_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about_how_transparent_desc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about_how_expertise_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about_how_expertise_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('about_what_title')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            {/* MAK Consulting */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('about_what_mak_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('about_what_mak_desc')}
              </p>
            </div>

            {/* ImportFromPoland */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('about_what_import_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('about_what_import_desc')}
              </p>
            </div>

            {/* Supersender */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('about_what_supersender_title')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {t('about_what_supersender_desc')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Why Us Section - Vision & Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('about_why_title')}</h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              {t('about_why_why_desc')}
            </p>
          </div>

          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-6 text-center">{t('about_why_vision')}</h3>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto text-center leading-relaxed">
              {t('about_why_vision_desc')}
            </p>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">{t('about_why_values')}</h3>
            <p className="text-lg text-blue-100">
              {t('about_why_values_desc')}
            </p>
          </div>
        </div>
      </section>


      {/* CTA Footer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('about_cta_title')}
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            {t('about_cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-blue-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              {t('about_cta_button')}
            </Link>
            <Link
              href="mailto:info@supersender.eu"
              className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition"
            >
              {t('about_cta_button2')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

