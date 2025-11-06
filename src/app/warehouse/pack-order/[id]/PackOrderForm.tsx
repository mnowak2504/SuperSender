'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Package, Palette } from 'lucide-react'
import { calculateVolumeCbm, formatVolumeCbm, calculateTotalVolumeCbm } from '@/lib/warehouse-calculations'

type ShipmentType = 'PALLET' | 'PACKAGE'

interface PalletData {
  type: 'PALLET'
  count: number
  totalWeightKg: number
}

interface PackageData {
  type: 'PACKAGE'
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
}

type PackedItem = PalletData | PackageData

interface PackOrderFormProps {
  orderId: string
  currentStatus: string
}

export default function PackOrderForm({ orderId, currentStatus }: PackOrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shipmentType, setShipmentType] = useState<ShipmentType>('PALLET')
  const [pallets, setPallets] = useState<PalletData[]>([
    { type: 'PALLET', count: 1, totalWeightKg: 0 }
  ])
  const [packages, setPackages] = useState<PackageData[]>([
    {
      type: 'PACKAGE',
      widthCm: 0,
      lengthCm: 0,
      heightCm: 0,
      weightKg: 0,
    }
  ])
  const [notes, setNotes] = useState('')

  const addPallet = () => {
    setPallets([...pallets, { type: 'PALLET', count: 1, totalWeightKg: 0 }])
  }

  const removePallet = (index: number) => {
    if (pallets.length > 1) {
      setPallets(pallets.filter((_, i) => i !== index))
    }
  }

  const updatePallet = (index: number, field: keyof PalletData, value: any) => {
    const updated = [...pallets]
    updated[index] = { ...updated[index], [field]: value }
    setPallets(updated)
  }

  const addPackage = () => {
    setPackages([...packages, {
      type: 'PACKAGE',
      widthCm: 0,
      lengthCm: 0,
      heightCm: 0,
      weightKg: 0,
    }])
  }

  const removePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index))
    }
  }

  const updatePackage = (index: number, field: keyof PackageData, value: any) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const calculatePackageVolume = (pkg: PackageData): number => {
    if (pkg.widthCm > 0 && pkg.lengthCm > 0 && pkg.heightCm > 0) {
      return calculateVolumeCbm(pkg.widthCm, pkg.lengthCm, pkg.heightCm)
    }
    return 0
  }

  const totalPallets = pallets.reduce((sum, p) => sum + (p.count || 0), 0)
  const totalPalletWeight = pallets.reduce((sum, p) => sum + (p.totalWeightKg || 0), 0)
  const totalPackageVolume = calculateTotalVolumeCbm(
    packages.map(p => ({ widthCm: p.widthCm, lengthCm: p.lengthCm, heightCm: p.heightCm }))
  )
  const totalPackageWeight = packages.reduce((sum, p) => sum + (p.weightKg || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let items: PackedItem[] = []

      if (shipmentType === 'PALLET') {
        // Validate pallets
        for (let i = 0; i < pallets.length; i++) {
          const pallet = pallets[i]
          if (!pallet.count || pallet.count <= 0) {
            throw new Error(`Paleta ${i + 1}: Ilość musi być większa od zera`)
          }
          if (!pallet.totalWeightKg || pallet.totalWeightKg <= 0) {
            throw new Error(`Paleta ${i + 1}: Waga musi być większa od zera`)
          }
        }
        items = pallets
      } else {
        // Validate packages
        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i]
          if (!pkg.widthCm || !pkg.lengthCm || !pkg.heightCm || !pkg.weightKg) {
            throw new Error(`Paczka ${i + 1}: Wszystkie wymiary i waga są wymagane`)
          }
          if (pkg.widthCm <= 0 || pkg.lengthCm <= 0 || pkg.heightCm <= 0 || pkg.weightKg <= 0) {
            throw new Error(`Paczka ${i + 1}: Wymiary i waga muszą być większe od zera`)
          }
        }
        items = packages
      }

      const response = await fetch('/api/warehouse/pack-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          shipmentType,
          items: shipmentType === 'PALLET' 
            ? pallets 
            : packages.map(pkg => ({
                type: pkg.type,
                widthCm: pkg.widthCm,
                lengthCm: pkg.lengthCm,
                heightCm: pkg.heightCm,
                weightKg: pkg.weightKg,
                volumeCbm: calculatePackageVolume(pkg),
              })),
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy pakowaniu zamówienia')
      }

      router.push('/warehouse/orders')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Formularz pakowania</h2>

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
                onChange={(e) => {
                  setShipmentType(e.target.value as ShipmentType)
                  if (e.target.value === 'PALLET' && pallets.length === 0) {
                    setPallets([{ type: 'PALLET', count: 1, totalWeightKg: 0 }])
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <Palette className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Palety</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shipmentType"
                value="PACKAGE"
                checked={shipmentType === 'PACKAGE'}
                onChange={(e) => {
                  setShipmentType(e.target.value as ShipmentType)
                  if (e.target.value === 'PACKAGE' && packages.length === 0) {
                    setPackages([{
                      type: 'PACKAGE',
                      widthCm: 0,
                      lengthCm: 0,
                      heightCm: 0,
                      weightKg: 0,
                    }])
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Paczki</span>
            </label>
          </div>
        </div>

        {/* Pallet Form */}
        {shipmentType === 'PALLET' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palety
            </label>
            {pallets.map((pallet, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Paleta {index + 1}
                    </h3>
                  </div>
                  {pallets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePallet(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Usuń paletę"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ilość palet *
            </label>
            <input
              type="number"
              min="1"
              step="1"
                      value={pallet.count || ''}
                      onChange={(e) => updatePallet(index, 'count', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waga całkowita (kg) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={pallet.totalWeightKg || ''}
                      onChange={(e) => updatePallet(index, 'totalWeightKg', parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPallet}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Dodaj kolejną paletę
            </button>

            {/* Pallet Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Podsumowanie</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Łączna ilość palet:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalPallets}</span>
                </div>
                <div>
                  <span className="text-gray-600">Łączna waga:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalPalletWeight.toFixed(2)} kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Package Form */}
        {shipmentType === 'PACKAGE' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paczki
            </label>
            {packages.map((pkg, index) => {
              const volume = calculatePackageVolume(pkg)
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Paczka {index + 1}
                      </h3>
                    </div>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Usuń paczkę"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Szerokość (cm) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={pkg.widthCm || ''}
                        onChange={(e) => updatePackage(index, 'widthCm', parseInt(e.target.value) || 0)}
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
                        value={pkg.lengthCm || ''}
                        onChange={(e) => updatePackage(index, 'lengthCm', parseInt(e.target.value) || 0)}
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
                        value={pkg.heightCm || ''}
                        onChange={(e) => updatePackage(index, 'heightCm', parseInt(e.target.value) || 0)}
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
                        value={pkg.weightKg || ''}
                        onChange={(e) => updatePackage(index, 'weightKg', parseFloat(e.target.value) || 0)}
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

            <button
              type="button"
              onClick={addPackage}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Dodaj kolejną paczkę
            </button>

            {/* Package Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Podsumowanie</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Łączna objętość:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatVolumeCbm(totalPackageVolume)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Łączna waga:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalPackageWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-gray-600">Liczba paczek:</span>
                  <span className="ml-2 font-semibold text-gray-900">{packages.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
            href="/warehouse/orders"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : 'Zapisz i przekaż do transportu'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Uwaga:</strong> Po zapisaniu pakowania:
        </p>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          {shipmentType === 'PALLET' ? (
            <>
              <li>System przekaże dane: ilość palet i wagę</li>
              <li>Wycena transportu będzie oparta o liczbę miejsc paletowych</li>
            </>
          ) : (
            <>
              <li>System automatycznie obliczy objętość (m³) z buforem 5%</li>
              <li>Wycena transportu będzie oparta o objętość i wagę</li>
            </>
          )}
          <li>Status zamówienia zmieni się na "Gotowe do transportu"</li>
          <li>Klient otrzyma powiadomienie z wyceną transportu</li>
        </ul>
      </div>
    </div>
  )
}
