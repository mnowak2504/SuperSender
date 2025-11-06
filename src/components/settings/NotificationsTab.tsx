'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface NotificationPreferences {
  deliveryReceived: boolean
  shipmentReady: boolean
  invoiceIssued: boolean
  paymentReminder: boolean
  overStorageAlert: boolean
  newsletter: boolean
}

export default function NotificationsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    deliveryReceived: true,
    shipmentReady: true,
    invoiceIssued: true,
    paymentReminder: true,
    overStorageAlert: true,
    newsletter: false,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/client/notifications')
      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setPreferences({ ...preferences, ...data.preferences })
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/client/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!res.ok) throw new Error('Failed to save preferences')

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] })
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const notificationOptions = [
    {
      key: 'deliveryReceived' as keyof NotificationPreferences,
      label: 'Delivery Received',
      description: 'Get notified when a delivery is received at the warehouse (with photos)',
    },
    {
      key: 'shipmentReady' as keyof NotificationPreferences,
      label: 'Shipment Ready for Approval',
      description: 'Receive notifications when shipment quotes are ready for your approval',
    },
    {
      key: 'invoiceIssued' as keyof NotificationPreferences,
      label: 'Invoice Issued',
      description: 'Get notified when new invoices are issued',
    },
    {
      key: 'paymentReminder' as keyof NotificationPreferences,
      label: 'Payment Reminder',
      description: 'Receive reminders for upcoming or overdue payments',
    },
    {
      key: 'overStorageAlert' as keyof NotificationPreferences,
      label: 'Over-Storage Alert',
      description: 'Get alerts when you exceed your storage limit',
    },
    {
      key: 'newsletter' as keyof NotificationPreferences,
      label: 'Newsletter & System Updates',
      description: 'Receive updates about new features and system announcements',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Notification Preferences</h2>
        <p className="text-sm text-gray-500">Choose which notifications you want to receive via email</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id={option.key}
                checked={preferences[option.key]}
                onChange={() => togglePreference(option.key)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor={option.key} className="block text-sm font-medium text-gray-900 cursor-pointer">
                {option.label}
              </label>
              <p className="mt-1 text-xs text-gray-500">{option.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              <span>Preferences saved successfully</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

