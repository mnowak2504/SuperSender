'use client'

import { useEffect, useState } from 'react'
import { Euro, Save, Plus, X, Calendar, Tag } from 'lucide-react'

interface SetupFee {
  id: string
  suggestedAmountEur: number
  currentAmountEur: number
  validUntil: string | null
}

interface Voucher {
  id: string
  code: string
  amountEur: number
  isOneTime: boolean
  usedByClientId: string | null
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

export default function PricingManagementContent() {
  const [setupFee, setSetupFee] = useState<SetupFee | null>(null)
  const [setupFeeForm, setSetupFeeForm] = useState({
    currentAmountEur: 99.0,
    validUntil: '',
  })
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    amountEur: 0,
    expiresAt: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [setupFeeRes, vouchersRes] = await Promise.all([
        fetch('/api/superadmin/setup-fee'),
        fetch('/api/superadmin/vouchers'),
      ])

      if (setupFeeRes.ok) {
        const setupFeeData = await setupFeeRes.json()
        setSetupFee(setupFeeData.setupFee)
        if (setupFeeData.setupFee) {
          setSetupFeeForm({
            currentAmountEur: setupFeeData.setupFee.currentAmountEur,
            validUntil: setupFeeData.setupFee.validUntil
              ? new Date(setupFeeData.setupFee.validUntil).toISOString().split('T')[0]
              : '',
          })
        }
      }

      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json()
        setVouchers(vouchersData.vouchers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSetupFee = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/superadmin/setup-fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmountEur: parseFloat(setupFeeForm.currentAmountEur.toString()),
          validUntil: setupFeeForm.validUntil || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save setup fee')
      }

      setSuccess('Setup fee updated successfully')
      await fetchData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save setup fee')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateVoucher = async () => {
    if (!voucherForm.code.trim() || voucherForm.amountEur <= 0) {
      setError('Please enter a valid voucher code and amount')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/superadmin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherForm.code.trim().toUpperCase(),
          amountEur: parseFloat(voucherForm.amountEur.toString()),
          expiresAt: voucherForm.expiresAt || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create voucher')
      }

      setSuccess('Voucher created successfully')
      setVoucherForm({ code: '', amountEur: 0, expiresAt: '' })
      await fetchData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create voucher')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5" />
          Setup Fee Management
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {setupFee && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Setup Fee
              </label>
              <div className="text-lg font-semibold text-gray-900">
                €{setupFee.suggestedAmountEur.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">This is the standard setup fee</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Promotional Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={setupFeeForm.currentAmountEur}
                onChange={(e) =>
                  setSetupFeeForm({ ...setupFeeForm, currentAmountEur: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set to {setupFee.suggestedAmountEur.toFixed(2)} to remove promotion. Current: €{setupFee.currentAmountEur.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until (Optional)
              </label>
              <input
                type="date"
                value={setupFeeForm.validUntil}
                onChange={(e) => setSetupFeeForm({ ...setupFeeForm, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no expiration. After this date, the suggested amount will be used.
              </p>
            </div>

            <button
              onClick={handleSaveSetupFee}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Setup Fee'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Voucher Management
        </h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Voucher</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Code
              </label>
              <input
                type="text"
                value={voucherForm.code}
                onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g., BOOK20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Amount (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={voucherForm.amountEur}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, amountEur: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At (Optional)
              </label>
              <input
                type="date"
                value={voucherForm.expiresAt}
                onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleCreateVoucher}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create Voucher'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-gray-900">{voucher.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{voucher.amountEur.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {voucher.usedByClientId ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Used
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voucher.createdBy?.name || voucher.createdBy?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(voucher.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vouchers created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

