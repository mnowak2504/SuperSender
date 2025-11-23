'use client'

import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, Loader2, Package, FileImage, Users, Building2, Receipt } from 'lucide-react'

interface DataStats {
  deliveries: number
  warehouseOrders: number
  shipmentOrders: number
  invoices: number
  media: number
  clients: number
  users: number
}

export default function SuperAdminDataManagementContent() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      
      const res = await fetch('/api/superadmin/data-management/stats')
      
      if (!res.ok) {
        throw new Error('Failed to fetch data statistics')
      }
      
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load data statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOldData = async (entityType: string, beforeDate?: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć stare dane typu "${entityType}"? Ta operacja jest nieodwracalna!`)) {
      return
    }

    // Additional confirmation for dangerous operations
    const confirmMessage = `Wpisz "DELETE" aby potwierdzić usunięcie danych typu ${entityType}`
    const userConfirm = prompt(confirmMessage)
    
    if (userConfirm !== 'DELETE') {
      setError('Operacja anulowana - nie wpisano "DELETE"')
      return
    }

    try {
      setDeleting(entityType)
      setError('')
      setSuccess('')

      const url = beforeDate 
        ? `/api/superadmin/data-management/delete?entityType=${entityType}&beforeDate=${beforeDate}`
        : `/api/superadmin/data-management/delete?entityType=${entityType}`

      const res = await fetch(url, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete data' }))
        throw new Error(errorData.error || errorData.details || 'Failed to delete data')
      }

      const data = await res.json()
      setSuccess(`Usunięto ${data.deletedCount || 0} rekordów typu ${entityType}`)
      
      // Refresh stats
      await fetchStats()
    } catch (err) {
      console.error('Error deleting data:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete data')
    } finally {
      setDeleting(null)
      setConfirmText('')
    }
  }

  const handleDeleteTestData = async () => {
    if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane testowe? Ta operacja jest nieodwracalna!')) {
      return
    }

    const userConfirm = prompt('Wpisz "DELETE ALL TEST DATA" aby potwierdzić')
    
    if (userConfirm !== 'DELETE ALL TEST DATA') {
      setError('Operacja anulowana')
      return
    }

    try {
      setDeleting('test')
      setError('')
      setSuccess('')

      const res = await fetch('/api/superadmin/data-management/delete-test-data', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete test data' }))
        throw new Error(errorData.error || errorData.details || 'Failed to delete test data')
      }

      const data = await res.json()
      setSuccess(`Usunięto dane testowe: ${JSON.stringify(data.deletedCounts)}`)
      
      // Refresh stats
      await fetchStats()
    } catch (err) {
      console.error('Error deleting test data:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete test data')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-500">Ładowanie statystyk...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zarządzanie danymi</h1>
        <p className="mt-1 text-sm text-gray-500">Zarządzaj i czyszcz stare dane w systemie</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dostawy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveries}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Zamówienia magazynowe</p>
                <p className="text-2xl font-bold text-gray-900">{stats.warehouseOrders}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Zdjęcia</p>
                <p className="text-2xl font-bold text-gray-900">{stats.media}</p>
              </div>
              <FileImage className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Faktury</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
              </div>
              <Receipt className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Uwaga!</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Usuwanie danych jest operacją nieodwracalną. Upewnij się, że masz kopię zapasową przed usunięciem danych.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Test Data */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usuń dane testowe</h2>
        <p className="text-sm text-gray-600 mb-4">
          Usuwa wszystkie dane oznaczone jako testowe (klienci z email zawierającym "test", dostawy testowe, etc.)
        </p>
        <button
          onClick={handleDeleteTestData}
          disabled={deleting === 'test'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting === 'test' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Usuwanie...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Usuń wszystkie dane testowe
            </>
          )}
        </button>
      </div>

      {/* Cleanup Old Photos */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Czyszczenie starych zdjęć</h2>
        <p className="text-sm text-gray-600 mb-4">
          Usuwa zdjęcia starsze niż 2 miesiące od momentu dostarczenia przesyłki. Zdjęcia są przechowywane przez 2 miesiące po dostarczeniu, aby umożliwić rozpatrzenie ewentualnych reklamacji.
        </p>
        <button
          onClick={async () => {
            if (!confirm('Czy na pewno chcesz wyczyścić stare zdjęcia (starsze niż 2 miesiące od dostarczenia)?')) {
              return
            }
            try {
              setDeleting('photos')
              setError('')
              setSuccess('')
              const res = await fetch('/api/superadmin/data-management/cleanup-old-photos', { method: 'POST' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || data.details || 'Failed to cleanup photos')
              setSuccess(`Wyczyszczono ${data.deletedCount || 0} starych zdjęć`)
              await fetchStats()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to cleanup photos')
            } finally {
              setDeleting(null)
            }
          }}
          disabled={deleting === 'photos'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting === 'photos' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Czyszczenie...
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4" />
              Wyczyść stare zdjęcia (2+ miesiące)
            </>
          )}
        </button>
      </div>

      {/* Delete Old Data by Type */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usuń stare dane</h2>
        <p className="text-sm text-gray-600 mb-4">
          Usuwa dane starsze niż określona data. Pozostawia tylko aktywne rekordy.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data graniczna (opcjonalnie)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Jeśli nie wybrano daty, zostaną usunięte tylko dane testowe
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => handleDeleteOldData('deliveries', selectedDate)}
              disabled={!!deleting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {deleting === 'deliveries' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Usuń stare dostawy
                </>
              )}
            </button>

            <button
              onClick={() => handleDeleteOldData('warehouseOrders', selectedDate)}
              disabled={!!deleting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {deleting === 'warehouseOrders' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Usuń stare zamówienia magazynowe
                </>
              )}
            </button>

            <button
              onClick={() => handleDeleteOldData('media', selectedDate)}
              disabled={!!deleting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {deleting === 'media' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  Usuń stare zdjęcia
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

