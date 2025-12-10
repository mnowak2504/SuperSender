'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import AlertBanner from '@/components/dashboard/AlertBanner'

interface PricingRule {
  id: string
  name: string
  type: 'FIXED_PER_UNIT' | 'DYNAMIC_M3_WEIGHT'
  weightMinKg?: number
  weightMaxKg?: number
  volumeMinCbm?: number
  volumeMaxCbm?: number
  priceEur: number
  transportType: string
  isActive: boolean
  priority: number
  palletCountMin?: number
  palletCountMax?: number
}

export default function TransportPricingManager() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/superadmin/pricing')
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (rule: Partial<PricingRule>) => {
    try {
      const method = rule.id ? 'PUT' : 'POST'
      const url = rule.id ? `/api/superadmin/pricing/${rule.id}` : '/api/superadmin/pricing'
      
      // For pallet rules, clear weight fields (pricing is based on positions only)
      const ruleToSave = rule.transportType === 'PALLET' 
        ? { ...rule, weightMinKg: undefined, weightMaxKg: undefined }
        : rule
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleToSave),
      })

      if (res.ok) {
        setSuccess(rule.id ? 'Rule updated successfully' : 'Rule created successfully')
        setEditingId(null)
        setShowAddForm(false)
        fetchRules()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save rule')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save rule')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return

    try {
      const res = await fetch(`/api/superadmin/pricing/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Rule deleted successfully')
        fetchRules()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      setError('Failed to delete rule')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleToggleActive = async (rule: PricingRule) => {
    await handleSave({ ...rule, isActive: !rule.isActive })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">Loading pricing rules...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transport Pricing</h1>
        <p className="mt-2 text-sm text-gray-600">Manage pricing rules for pallets and packages</p>
      </div>

      {error && (
        <AlertBanner type="error" title={error} dismissible onDismiss={() => setError(null)} />
      )}
      {success && (
        <AlertBanner type="info" title={success} dismissible onDismiss={() => setSuccess(null)} />
      )}

      {/* Pallet Pricing */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pallet Pricing (by positions)</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallet Positions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules
                .filter(r => r.transportType === 'PALLET')
                .sort((a, b) => b.priority - a.priority)
                .map((rule) => (
                  <PricingRow
                    key={rule.id}
                    rule={rule}
                    editingId={editingId}
                    onEdit={setEditingId}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Pricing */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Package Pricing (by m³ + weight)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume Range (m³)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Range (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules
                .filter(r => r.transportType === 'PACKAGE')
                .sort((a, b) => b.priority - a.priority)
                .map((rule) => (
                  <PricingRow
                    key={rule.id}
                    rule={rule}
                    editingId={editingId}
                    onEdit={setEditingId}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <PricingForm
          rule={null}
          onSave={(rule) => {
            handleSave(rule)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

function PricingRow({
  rule,
  editingId,
  onEdit,
  onSave,
  onDelete,
  onToggleActive,
}: {
  rule: PricingRule
  editingId: string | null
  onEdit: (id: string | null) => void
  onSave: (rule: Partial<PricingRule>) => void
  onDelete: (id: string) => void
  onToggleActive: (rule: PricingRule) => void
}) {
  if (editingId === rule.id) {
    return (
      <tr>
        <td colSpan={rule.transportType === 'PALLET' ? 6 : 7} className="px-6 py-4">
          <PricingForm
            rule={rule}
            onSave={(updated) => {
              onSave(updated)
              onEdit(null)
            }}
            onCancel={() => onEdit(null)}
          />
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {rule.transportType === 'PALLET' ? (
          rule.palletCountMin !== undefined || rule.palletCountMax !== undefined
            ? `${rule.palletCountMin || '1'}-${rule.palletCountMax || '∞'} positions`
            : 'Any'
        ) : (
          rule.volumeMinCbm !== undefined || rule.volumeMaxCbm !== undefined
            ? `${rule.volumeMinCbm || '0'}-${rule.volumeMaxCbm || '∞'} m³`
            : 'Any'
        )}
      </td>
      {rule.transportType === 'PACKAGE' && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {rule.weightMinKg !== undefined || rule.weightMaxKg !== undefined
            ? `${rule.weightMinKg || '0'}-${rule.weightMaxKg || '∞'} kg`
            : 'Any'}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">€{rule.priceEur.toFixed(2)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.priority}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleActive(rule)}
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            rule.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {rule.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onClick={() => onEdit(rule.id)} className="text-blue-600 hover:text-blue-900">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(rule.id)} className="text-red-600 hover:text-red-900">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

function PricingForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: PricingRule | null
  onSave: (rule: Partial<PricingRule>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<PricingRule>>({
    name: rule?.name || '',
    type: rule?.type || 'FIXED_PER_UNIT',
    transportType: rule?.transportType || 'PALLET',
    weightMinKg: rule?.weightMinKg,
    weightMaxKg: rule?.weightMaxKg,
    volumeMinCbm: rule?.volumeMinCbm,
    volumeMaxCbm: rule?.volumeMaxCbm,
    palletCountMin: rule?.palletCountMin,
    palletCountMax: rule?.palletCountMax,
    priceEur: rule?.priceEur || 0,
    priority: rule?.priority || 0,
    isActive: rule?.isActive ?? true,
  })

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transport Type</label>
          <select
            value={formData.transportType}
            onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          >
            <option value="PALLET">Pallet</option>
            <option value="PACKAGE">Package</option>
          </select>
        </div>
        {formData.transportType === 'PALLET' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pallet Positions Min</label>
              <input
                type="number"
                step="0.5"
                value={formData.palletCountMin || ''}
                onChange={(e) => setFormData({ ...formData, palletCountMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                placeholder="e.g., 0.5 for half pallet"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum pallet positions (120x80cm base). 0.5 = half pallet (60x80cm)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pallet Positions Max</label>
              <input
                type="number"
                step="0.5"
                value={formData.palletCountMax || ''}
                onChange={(e) => setFormData({ ...formData, palletCountMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                placeholder="Leave empty for unlimited"
              />
              <p className="mt-1 text-xs text-gray-500">Maximum pallet positions. Leave empty for unlimited (∞)</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume Min (m³)</label>
              <input
                type="number"
                step="0.1"
                value={formData.volumeMinCbm || ''}
                onChange={(e) => setFormData({ ...formData, volumeMinCbm: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume Max (m³)</label>
              <input
                type="number"
                step="0.1"
                value={formData.volumeMaxCbm || ''}
                onChange={(e) => setFormData({ ...formData, volumeMaxCbm: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Min (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weightMinKg || ''}
                onChange={(e) => setFormData({ ...formData, weightMinKg: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Max (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weightMaxKg || ''}
                onChange={(e) => setFormData({ ...formData, weightMaxKg: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.priceEur}
            onChange={(e) => setFormData({ ...formData, priceEur: parseFloat(e.target.value) || 0 })}
            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher = checked first)</label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...formData, id: rule?.id })}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 inline mr-2" />
          Save
        </button>
      </div>
    </div>
  )
}

