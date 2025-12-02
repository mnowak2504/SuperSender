'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Package, Palette } from 'lucide-react'
import { calculateVolumeCbm, formatVolumeCbm } from '@/lib/warehouse-calculations'
import { useLanguage } from '@/lib/use-language'

type ShipmentType = 'PALLET' | 'PACKAGE'

interface PackageItem {
  type: 'PACKAGE' | 'PALLET'
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
}

interface PackShipmentFormProps {
  shipmentId: string
  warehouseOrders: Array<{
    id: string
    internalTrackingNumber?: string
    warehouseLocation?: string
    sourceDelivery?: {
      deliveryNumber?: string
      supplierName?: string
      goodsDescription?: string
    }
  }>
}

export default function PackShipmentForm({ shipmentId, warehouseOrders }: PackShipmentFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shipmentType, setShipmentType] = useState<ShipmentType>('PACKAGE')
  const [items, setItems] = useState<PackageItem[]>([
    {
      type: 'PACKAGE',
      widthCm: 0,
      lengthCm: 0,
      heightCm: 0,
      weightKg: 0,
    }
  ])
  const [notes, setNotes] = useState('')

  const addItem = () => {
    if (items.length >= 20) {
      setError('Maksymalna liczba paczek/palet w jednej wysyłce to 20')
      return
    }
    setItems([...items, {
      type: shipmentType,
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

  const updateItem = (index: number, field: keyof PackageItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const calculateItemVolume = (item: PackageItem): number => {
    if (item.type === 'PALLET') {
      // For pallets, we don't calculate volume (they use pallet spaces)
      return 0
    }
    if (item.widthCm > 0 && item.lengthCm > 0 && item.heightCm > 0) {
      return calculateVolumeCbm(item.widthCm, item.lengthCm, item.heightCm)
    }
    return 0
  }

  const totalVolume = items.reduce((sum, item) => sum + calculateItemVolume(item), 0)
  const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0), 0)
  const totalPallets = items.filter(item => item.type === 'PALLET').length
  const totalPackages = items.filter(item => item.type === 'PACKAGE').length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate items
      if (items.length === 0) {
        throw new Error('Musisz dodać co najmniej jedną paczkę lub paletę')
      }

      if (items.length > 20) {
        throw new Error('Maksymalna liczba paczek/palet w jednej wysyłce to 20')
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.weightKg || item.weightKg <= 0) {
          throw new Error(`${item.type === 'PALLET' ? 'Paleta' : 'Paczka'} ${i + 1}: Waga musi być większa od zera`)
        }
        if (item.type === 'PACKAGE') {
          if (!item.widthCm || !item.lengthCm || !item.heightCm) {
            throw new Error(`Paczka ${i + 1}: Wszystkie wymiary są wymagane`)
          }
          if (item.widthCm <= 0 || item.lengthCm <= 0 || item.heightCm <= 0) {
            throw new Error(`Paczka ${i + 1}: Wymiary muszą być większe od zera`)
          }
        }
      }

      // Prepare items for API
      const itemsToSend = items.map(item => ({
        type: item.type,
        widthCm: item.type === 'PACKAGE' ? item.widthCm : 0,
        lengthCm: item.type === 'PACKAGE' ? item.lengthCm : 0,
        heightCm: item.type === 'PACKAGE' ? item.heightCm : 0,
        weightKg: item.weightKg,
      }))

      const warehouseOrderIds = warehouseOrders.map(wo => wo.id)

      const response = await fetch('/api/warehouse/pack-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId,
          warehouseOrderIds,
          shipmentType,
          items: itemsToSend,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy pakowaniu zlecenia')
      }

      router.push('/warehouse/orders?status=PACKED')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setLoading(false)
    }
  }

  // Update item types when shipment type changes
  useEffect(() => {
    setItems(items.map(item => ({ ...item, type: shipmentType })))
  }, [shipmentType])

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Formularz pakowania zlecenia</h2>

      {/* Warehouse Orders Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Zamówienia do spakowania:</h3>
        <ul className="space-y-2">
          {warehouseOrders.map((wo) => (
            <li key={wo.id} className="text-sm text-gray-700 bg-white p-2 rounded border">
              <div className="font-medium">
                Nr wewnętrzny: {wo.internalTrackingNumber || wo.id.slice(-8)}
              </div>
              {wo.warehouseLocation && (
                <div>Lokalizacja: {wo.warehouseLocation}</div>
              )}
              {wo.sourceDelivery && (
                <>
                  <div>Dostawa: {wo.sourceDelivery.deliveryNumber || 'Brak numeru'}</div>
                  <div>Dostawca: {wo.sourceDelivery.supplierName || 'Brak'}</div>
                  {wo.sourceDelivery.goodsDescription && (
                    <div className="text-gray-500">Opis: {wo.sourceDelivery.goodsDescription}</div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipment Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Typ wysyłki
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shipmentType"
                value="PALLET"
                checked={shipmentType === 'PALLET'}
                onChange={(e) => setShipmentType(e.target.value as ShipmentType)}
                className="w-4 h-4 text-blue-600"
              />
              <Palette className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">
                {t('pallet') || 'Paleta'}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shipmentType"
                value="PACKAGE"
                checked={shipmentType === 'PACKAGE'}
                onChange={(e) => setShipmentType(e.target.value as ShipmentType)}
                className="w-4 h-4 text-blue-600"
              />
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">
                {t('package') || 'Paczka'}
              </span>
            </label>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {shipmentType === 'PALLET' ? 'Palety' : 'Paczki'} ({items.length}/20)
            </label>
            {items.length < 20 && (
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Dodaj kolejną {shipmentType === 'PALLET' ? 'paletę' : 'paczkę'}
              </button>
            )}
          </div>

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
                      {item.type === 'PALLET' ? 'Paleta' : 'Paczka'} {index + 1}
                    </h3>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                      title={`Usuń ${item.type === 'PALLET' ? 'paletę' : 'paczkę'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {item.type === 'PACKAGE' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                )}

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

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Podsumowanie</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {shipmentType === 'PALLET' ? (
              <>
                <div>
                  <span className="text-gray-600">Łączna ilość palet:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalPallets}</span>
                </div>
                <div>
                  <span className="text-gray-600">Łączna waga:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-gray-600">Łączna objętość:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatVolumeCbm(totalVolume)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Łączna waga:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-gray-600">Liczba paczek:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalPackages}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Uwagi dotyczące pakowania
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Dodatkowe uwagi dotyczące pakowania..."
          />
        </div>

        <div className="flex items-center justify-end space-x-3">
          <a
            href="/warehouse/orders?status=TO_PACK"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </a>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : 'Spakowane'}
          </button>
        </div>
      </form>
    </div>
  )
}

