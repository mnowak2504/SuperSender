'use client'

import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    condition: 'NO_REMARKS',
    warehouseLocation: '',
    warehouseInternalNumber: '',
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
      formDataToSend.append('warehouseInternalNumber', formData.warehouseInternalNumber || '')
      formDataToSend.append('notes', formData.notes || '')
      formDataToSend.append('items', JSON.stringify(items.map(item => ({
        type: item.type,
        widthCm: item.widthCm,
        lengthCm: item.lengthCm,
        heightCm: item.heightCm,
        weightKg: item.weightKg,
        volumeCbm: calculateItemVolume(item),
      }))))


      const response = await fetch('/api/warehouse/receive-delivery', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy przyjmowaniu dostawy')
      }

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
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
            Stan opakowań *
          </label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="NO_REMARKS">Bez uwag</option>
            <option value="MINOR_DAMAGE">Uszkodzenie opakowania nie zagrażające zawartości</option>
            <option value="MODERATE_DAMAGE">Poważniejsze uszkodzenie opakowania - zawartość do weryfikacji</option>
            <option value="SEVERE_DAMAGE">Poważne uszkodzenie</option>
          </select>
          
          {formData.condition !== 'NO_REMARKS' && (
            <div className="mt-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Ważna informacja o uszkodzonej przesyłce
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="mb-2">
                      <strong>W obecnych czasach nie ma możliwości odmowy przyjęcia uszkodzonej przesyłki.</strong>
                    </p>
                    <p className="mb-2">
                      Uszkodzenie zostało udokumentowane w systemie. Klient musi skontaktować się niezwłocznie z dostawcą w sprawie uszkodzenia.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Jeśli klient chce zlecić nam obsługę kontaktu z dostawcą, prosimy o kontakt z przedstawicielem handlowym.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          <label htmlFor="warehouseInternalNumber" className="block text-sm font-medium text-gray-700">
            Numer wewnętrzny magazynu *
          </label>
          <input
            type="text"
            id="warehouseInternalNumber"
            value={formData.warehouseInternalNumber}
            onChange={(e) => setFormData({ ...formData, warehouseInternalNumber: e.target.value })}
            placeholder="Wpisz numer z naklejki"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Wpisz numer z naklejki, którą nakleisz na zamówienie po umieszczeniu w lokalizacji
          </p>
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

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Informacja o zdjęciach
          </p>
          <p className="text-sm text-blue-700">
            Zdjęcia uszkodzonych przesyłek należy wysłać mailowo na specjalny adres e-mail. Zdjęcia będą zapisane na naszym dysku i udostępnione gdy zajdzie potrzeba.
          </p>
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
