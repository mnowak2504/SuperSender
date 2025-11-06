'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReceiveDeliveryPage() {
  const router = useRouter()
  const params = useParams()
  const deliveryId = params.id as string

  const [delivery, setDelivery] = useState<any>(null)
  const [formData, setFormData] = useState({
    packagesCount: '',
    condition: 'ok',
    notes: '',
    location: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDelivery()
  }, [])

  const fetchDelivery = async () => {
    const res = await fetch(`/api/warehouse/deliveries/${deliveryId}`)
    const data = await res.json()
    setDelivery(data)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setPhotos([...photos, ...files])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (photos.length < 2) {
      setError('Please upload at least 2 photos')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('packagesCount', formData.packagesCount)
      formDataToSend.append('condition', formData.condition)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('location', formData.location)
      photos.forEach((photo) => {
        formDataToSend.append('photos', photo)
      })

      const res = await fetch(`/api/warehouse/deliveries/${deliveryId}/receive`, {
        method: 'POST',
        body: formDataToSend,
      })

      if (!res.ok) {
        throw new Error('Failed to receive delivery')
      }

      router.push('/warehouse/expected')
    } catch (err) {
      setError('Failed to receive delivery. Please try again.')
      setLoading(false)
    }
  }

  if (!delivery) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              Przyjmij dostawę
            </h1>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Wstecz
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Szczegóły dostawy</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Klient:</strong> {delivery.client?.displayName}
              </p>
              <p>
                <strong>Dostawca:</strong> {delivery.supplierName}
              </p>
              <p>
                <strong>Opis:</strong> {delivery.goodsDescription}
              </p>
              {delivery.orderNumber && (
                <p>
                  <strong>Numer zamówienia:</strong> {delivery.orderNumber}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="packagesCount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Liczba paczek
                </label>
                <input
                  type="number"
                  id="packagesCount"
                  required
                  min="1"
                  value={formData.packagesCount}
                  onChange={(e) =>
                    setFormData({ ...formData, packagesCount: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Stan
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ok">OK</option>
                  <option value="damaged">Uszkodzone</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Lokalizacja na magazynie
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Uwagi
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                  Zdjęcia (min. 2) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photos.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Wybrano {photos.length} zdjęć {photos.length < 2 && '(wymagane min. 2)'}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={loading || photos.length < 2}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Przyjmowanie...' : 'Przyjmij dostawę'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

