'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Check, AlertCircle } from 'lucide-react'
import { adminTranslations } from '@/lib/admin-translations'

interface SystemSettings {
  dimensionBufferPercent: number
  defaultClientLimitCbm: number
  translationServiceEnabled: boolean
  photoRetentionDays: number
}

export default function SuperAdminSettingsContent() {
  const [settings, setSettings] = useState<SystemSettings>({
    dimensionBufferPercent: 5.0,
    defaultClientLimitCbm: 5.0,
    translationServiceEnabled: true,
    photoRetentionDays: 90,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/superadmin/system-settings')
      
      if (!res.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Nie udało się załadować ustawień')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setError('')

    try {
      const res = await fetch('/api/superadmin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save settings' }))
        throw new Error(errorData.error || 'Failed to save settings')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać ustawień')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-500">{adminTranslations.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia Systemu</h1>
        <p className="mt-1 text-sm text-gray-500">Zarządzaj globalnymi ustawieniami systemu</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Dimension Buffer */}
          <div>
            <label htmlFor="dimensionBuffer" className="block text-sm font-medium text-gray-900 mb-2">
              Bufor wymiarów (Dimension Buffer)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Procent dodawany do obliczonej objętości (m³) przy obliczaniu zajętości magazynu
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="dimensionBuffer"
                min="0"
                max="100"
                step="0.1"
                value={settings.dimensionBufferPercent}
                onChange={(e) => setSettings({ ...settings, dimensionBufferPercent: parseFloat(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>

          {/* Default Client Limit */}
          <div>
            <label htmlFor="defaultLimit" className="block text-sm font-medium text-gray-900 mb-2">
              Domyślny limit klienta (Default Client Limit)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Domyślna pojemność magazynowa (m³) przypisywana nowym klientom bez planu
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="defaultLimit"
                min="0"
                step="0.1"
                value={settings.defaultClientLimitCbm}
                onChange={(e) => setSettings({ ...settings, defaultClientLimitCbm: parseFloat(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">m³</span>
            </div>
          </div>

          {/* Translation Service */}
          <div>
            <label htmlFor="translationService" className="block text-sm font-medium text-gray-900 mb-2">
              Usługa tłumaczeń (Translation Service)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Włącz/wyłącz automatyczne tłumaczenie notatek i komentarzy
            </p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="translationService"
                checked={settings.translationServiceEnabled}
                onChange={(e) => setSettings({ ...settings, translationServiceEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="translationService" className="text-sm text-gray-700 cursor-pointer">
                {settings.translationServiceEnabled ? 'Włączona' : 'Wyłączona'}
              </label>
            </div>
          </div>

          {/* Photo Retention */}
          <div>
            <label htmlFor="photoRetention" className="block text-sm font-medium text-gray-900 mb-2">
              Okres przechowywania zdjęć (Photo Retention)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Liczba dni, przez które zdjęcia są przechowywane przed automatycznym usunięciem
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="photoRetention"
                min="1"
                max="3650"
                value={settings.photoRetentionDays}
                onChange={(e) => setSettings({ ...settings, photoRetentionDays: parseInt(e.target.value) || 90 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">dni</span>
            </div>
          </div>
        </div>

        {/* Footer with Save button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span>Ustawienia zapisane pomyślnie</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {adminTranslations.save}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

