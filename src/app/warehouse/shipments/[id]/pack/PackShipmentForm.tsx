'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, Package, Palette } from 'lucide-react'
import { calculateVolumeCbm } from '@/lib/warehouse-calculations'

interface PalletData {
  type: 'PALLET'
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
}

interface PackageData {
  type: 'PACKAGE'
  widthCm: number
  lengthCm: number
  heightCm: number
  weightKg: number
}

interface PackShipmentFormProps {
  shipmentId: string
  warehouseOrderIds: string[]
}

export default function PackShipmentForm({ shipmentId, warehouseOrderIds }: PackShipmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shipmentType, setShipmentType] = useState<'PALLET' | 'PACKAGE'>('PALLET')
  const [pallets, setPallets] = useState<PalletData[]>([
    { type: 'PALLET', widthCm: 0, lengthCm: 0, heightCm: 0, weightKg: 0 }
  ])
  const [packages, setPackages] = useState<PackageData[]>([
    { type: 'PACKAGE', widthCm: 0, lengthCm: 0, heightCm: 0, weightKg: 0 }
  ])
  const [notes, setNotes] = useState('')

  const addPallet = () => {
    setPallets([...pallets, { type: 'PALLET', widthCm: 0, lengthCm: 0, heightCm: 0, weightKg: 0 }])
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

  const totalPallets = pallets.length
  const totalPalletWeight = pallets.reduce((sum, p) => sum + (p.weightKg || 0), 0)
  const totalPalletVolume = pallets.reduce((sum, p) => {
    if (p.widthCm > 0 && p.lengthCm > 0 && p.heightCm > 0) {
      return sum + calculateVolumeCbm(p.widthCm, p.lengthCm, p.heightCm)
    }
    return sum
  }, 0)

  const totalPackageVolume = packages.reduce((sum, p) => {
    if (p.widthCm > 0 && p.lengthCm > 0 && p.heightCm > 0) {
      return sum + calculateVolumeCbm(p.widthCm, p.lengthCm, p.heightCm)
    }
    return sum
  }, 0)
  const totalPackageWeight = packages.reduce((sum, p) => sum + (p.weightKg || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const items = shipmentType === 'PALLET' 
        ? pallets.map(p => ({
            type: 'PALLET',
            widthCm: p.widthCm,
            lengthCm: p.lengthCm,
            heightCm: p.heightCm,
            weightKg: p.weightKg,
          }))
        : packages.map(p => ({
            type: 'PACKAGE',
            widthCm: p.widthCm,
            lengthCm: p.lengthCm,
            heightCm: p.heightCm,
            weightKg: p.weightKg,
          }))

      const res = await fetch('/api/warehouse/pack-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId,
          warehouseOrderIds,
          shipmentType,
          items,
          notes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to pack shipment')
      }

      router.push('/warehouse/shipments?packed=success')
    } catch (err: any) {
      setError(err.message || 'Failed to pack shipment')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Formularz pakowania</h2>

      {/* Shipment Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Typ wysyłki</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="PALLET"
              checked={shipmentType === 'PALLET'}
              onChange={(e) => setShipmentType(e.target.value as 'PALLET')}
              className="mr-2"
            />
            <Palette className="w-5 h-5 mr-2 text-gray-600" />
            Palety
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="PACKAGE"
              checked={shipmentType === 'PACKAGE'}
              onChange={(e) => setShipmentType(e.target.value as 'PACKAGE')}
              className="mr-2"
            />
            <Package className="w-5 h-5 mr-2 text-gray-600" />
            Paczki
          </label>
        </div>
      </div>

      {/* Pallets Input */}
      {shipmentType === 'PALLET' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Palety</label>
            <button
              type="button"
              onClick={addPallet}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Dodaj paletę
            </button>
          </div>
          <div className="space-y-4">
            {pallets.map((pallet, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Paleta {index + 1}</h3>
                  {pallets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePallet(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Szerokość (cm)</label>
                    <input
                      type="number"
                      value={pallet.widthCm || ''}
                      onChange={(e) => updatePallet(index, 'widthCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Długość (cm)</label>
                    <input
                      type="number"
                      value={pallet.lengthCm || ''}
                      onChange={(e) => updatePallet(index, 'lengthCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Wysokość (cm)</label>
                    <input
                      type="number"
                      value={pallet.heightCm || ''}
                      onChange={(e) => updatePallet(index, 'heightCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Waga (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pallet.weightKg || ''}
                      onChange={(e) => updatePallet(index, 'weightKg', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="0"
                    />
                  </div>
                </div>
                {pallet.widthCm > 0 && pallet.lengthCm > 0 && pallet.heightCm > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Objętość: {calculateVolumeCbm(pallet.widthCm, pallet.lengthCm, pallet.heightCm).toFixed(3)} m³
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Liczba palet:</span>
                <span className="font-medium">{totalPallets}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Łączna waga:</span>
                <span className="font-medium">{totalPalletWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Łączna objętość:</span>
                <span className="font-medium">{totalPalletVolume.toFixed(3)} m³</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Input */}
      {shipmentType === 'PACKAGE' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Paczki</label>
            <button
              type="button"
              onClick={addPackage}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Dodaj paczkę
            </button>
          </div>
          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Paczka {index + 1}</h3>
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Szerokość (cm)</label>
                    <input
                      type="number"
                      value={pkg.widthCm || ''}
                      onChange={(e) => updatePackage(index, 'widthCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Długość (cm)</label>
                    <input
                      type="number"
                      value={pkg.lengthCm || ''}
                      onChange={(e) => updatePackage(index, 'lengthCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Wysokość (cm)</label>
                    <input
                      type="number"
                      value={pkg.heightCm || ''}
                      onChange={(e) => updatePackage(index, 'heightCm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Waga (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pkg.weightKg || ''}
                      onChange={(e) => updatePackage(index, 'weightKg', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      min="0"
                    />
                  </div>
                </div>
                {pkg.widthCm > 0 && pkg.lengthCm > 0 && pkg.heightCm > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Objętość: {calculateVolumeCbm(pkg.widthCm, pkg.lengthCm, pkg.heightCm).toFixed(3)} m³
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Liczba paczek:</span>
                <span className="font-medium">{packages.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Łączna waga:</span>
                <span className="font-medium">{totalPackageWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Łączna objętość:</span>
                <span className="font-medium">{totalPackageVolume.toFixed(3)} m³</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notatki</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Dodatkowe informacje o pakowaniu..."
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Link
          href="/warehouse/shipments"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Anuluj
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Pakowanie...' : 'Zapisz i przekaż do transportu'}
        </button>
      </div>
    </form>
  )
}

