'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

export default function ProfileTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [client, setClient] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    country: '',
  })

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      const [profileRes, invoicesRes] = await Promise.all([
        fetch('/api/client/profile'),
        fetch('/api/client/invoices'),
      ])
      
      if (profileRes.ok) {
        const data = await profileRes.json()
        
        if (data.client) {
          setClient(data.client)
          setFormData({
            displayName: data.client.displayName || '',
            email: data.client.email || '',
            phone: data.client.phone || '',
            country: data.client.country || '',
          })
        } else if (profileRes.status === 404) {
          // Client not found - might be a new user, show a message
          console.warn('Client profile not found')
        }
      } else if (profileRes.status === 404) {
        // Client not found
        console.warn('Client profile not found')
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save')

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await fetchClientData()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Client account not found. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Profile & Account</h2>
        <p className="text-sm text-gray-500">Manage your company information and account details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Account Code</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">{client.clientCode || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Account Type</dt>
              <dd className="mt-1 text-sm text-gray-900">Client</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Sales Representative</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {client.salesOwnerCode || 'N/A'}
                {client.caretakerName && ` (${client.caretakerName})`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {client.status || 'Active'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Company / Personal Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Company / Personal Information</h3>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name / Full Name *
            </label>
            <input
              type="text"
              id="displayName"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              id="country"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select country</option>
              <option value="IE">Ireland</option>
              <option value="PL">Poland</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IT">Italy</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
            </select>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Billing Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Billing Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.displayName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Country</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.country || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Total Invoices</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{invoices.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Outstanding Balance</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                €{invoices
                  .filter((inv) => inv.status !== 'PAID')
                  .reduce((sum, inv) => sum + (inv.amountEur || 0), 0)
                  .toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span>Changes saved successfully</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fetchClientData()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

