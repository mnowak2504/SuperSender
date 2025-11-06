'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Package, Palette } from 'lucide-react'
import { calculateVolumeCbm, formatVolumeCbm, calculateTotalVolumeCbm } from '@/lib/warehouse-calculations'

interface WarehouseItem {
  type: 'PACKAGE' | 'PALLET'
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
}

interface ReceiveDeliveryFormProps {
  deliveryId: string
  receivedById: string
  clientId: string
}

export default function ReceiveDeliveryForm({
  deliveryId,
  receivedById,
  clientId,
}: ReceiveDeliveryFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [items, setItems] = useState<WarehouseItem[]>([
    {
      type: 'PALLET',
      widthCm: 0,
      lengthCm: 0,
      heightCm: 0,
      weightKg: 0,
    }
  ])
  const [formData, setFormData] = useState({
    condition: 'OK',
    warehouseLocation: '',
    notes: '',
  })

  const addItem = () => {
    setItems([...items, {
      type: 'PALLET',
      widthCm: 0,
      lengthCm: 0,
      heightCm: 0,
      weightKg: 0,
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof WarehouseItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const calculateItemVolume = (item: WarehouseItem): number => {
    if (item.widthCm > 0 && item.lengthCm > 0 && item.heightCm > 0) {
      return calculateVolumeCbm(item.widthCm, item.lengthCm, item.heightCm)
    }
    return 0
  }

  const totalVolume = calculateTotalVolumeCbm(
    items.map(item => ({ widthCm: item.widthCm, lengthCm: item.lengthCm, heightCm: item.heightCm }))
  )
  const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0), 0)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setPhotos(files)
      const urls = files.map(file => URL.createObjectURL(file))
      setPreviewUrls(urls)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)
    URL.revokeObjectURL(previewUrls[index])
    setPhotos(newPhotos)
    setPreviewUrls(newUrls)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate all items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.widthCm || !item.lengthCm || !item.heightCm || !item.weightKg) {
          throw new Error(`Pozycja ${i + 1}: Wszystkie wymiary i waga są wymagane`)
        }
        if (item.widthCm <= 0 || item.lengthCm <= 0 || item.heightCm <= 0 || item.weightKg <= 0) {
          throw new Error(`Pozycja ${i + 1}: Wymiary i waga muszą być większe od zera`)
        }
      }

      // Create FormData
      const formDataToSend = new FormData()
      formDataToSend.append('deliveryId', deliveryId)
      formDataToSend.append('receivedById', receivedById)
      formDataToSend.append('clientId', clientId)
      formDataToSend.append('condition', formData.condition)
      formDataToSend.append('warehouseLocation', formData.warehouseLocation || '')
      formDataToSend.append('notes', formData.notes || '')
      formDataToSend.append('items', JSON.stringify(items.map(item => ({
        type: item.type,
        widthCm: item.widthCm,
        lengthCm: item.lengthCm,
        heightCm: item.heightCm,
        weightKg: item.weightKg,
        volumeCbm: calculateItemVolume(item),
      }))))

      photos.forEach((photo) => {
        formDataToSend.append(`photos`, photo)
      })

      const response = await fetch('/api/warehouse/receive-delivery', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy przyjmowaniu dostawy')
      }

      previewUrls.forEach(url => URL.revokeObjectURL(url))

      router.push('/warehouse/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Rejestracja przyjęcia</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Items List */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jednostki dostawy (paczki/palety) *
          </label>
          {items.map((item, index) => {
            const volume = calculateItemVolume(item)
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {item.type === 'PALLET' ? (
                      <Palette className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Package className="w-5 h-5 text-green-600" />
                    )}
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pozycja {index + 1} - {item.type === 'PALLET' ? 'Paleta' : 'Paczka'}
                    </h3>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Usuń pozycję"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(index, 'type', e.target.value as 'PACKAGE' | 'PALLET')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="PALLET">Paleta</option>
                      <option value="PACKAGE">Paczka</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Szerokość (cm) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.widthCm || ''}
                      onChange={(e) => updateItem(index, 'widthCm', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Długość (cm) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.lengthCm || ''}
                      onChange={(e) => updateItem(index, 'lengthCm', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wysokość (cm) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.heightCm || ''}
                      onChange={(e) => updateItem(index, 'heightCm', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waga (kg) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.weightKg || ''}
                      onChange={(e) => updateItem(index, 'weightKg', parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {volume > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Objętość: {formatVolumeCbm(volume)}</span>
                    <span className="text-gray-400 ml-2">(z buforem 5%)</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Dodaj kolejną pozycję
        </button>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Podsumowanie przyjęcia</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Łączna objętość:</span>
              <span className="ml-2 font-semibold text-gray-900">{formatVolumeCbm(totalVolume)}</span>
            </div>
            <div>
              <span className="text-gray-600">Łączna waga:</span>
              <span className="ml-2 font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</span>
            </div>
            <div>
              <span className="text-gray-600">Liczba pozycji:</span>
              <span className="ml-2 font-semibold text-gray-900">{items.length}</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
            Stan opakowań
          </label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="OK">OK</option>
            <option value="DAMAGED">Uszkodzone</option>
          </select>
        </div>

        <div>
          <label htmlFor="warehouseLocation" className="block text-sm font-medium text-gray-700">
            Lokalizacja magazynowa (np. A3-07)
          </label>
          <input
            type="text"
            id="warehouseLocation"
            value={formData.warehouseLocation}
            onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
            placeholder="A3-07"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Dodatkowe uwagi dotyczące przyjęcia..."
          />
        </div>

        <div>
          <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-2">
            Zdjęcia dostawy (opcjonalne)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="photos"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            Możesz dodać zdjęcia dokumentujące stan dostawy przy przyjęciu (maksymalnie 10 zdjęć)
          </p>
          
          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 text-xs"
                    title="Usuń zdjęcie"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3">
          <a
            href="/warehouse/expected-deliveries"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : 'Potwierdź przyjęcie'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Uwaga:</strong> Po potwierdzeniu przyjęcia:
        </p>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>System automatycznie obliczy objętość (m³) z buforem 5% dla każdej pozycji</li>
          <li>Zaktualizuje zajętość magazynu klienta</li>
          <li>Status dostawy zmieni się na "Przyjęto"</li>
          <li>Zostanie utworzone zamówienie magazynowe</li>
          <li>Klient otrzyma powiadomienie o przyjęciu dostawy</li>
        </ul>
      </div>
    </div>
  )
}
