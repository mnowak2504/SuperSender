'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, MapPin, CreditCard, Bell, Lock } from 'lucide-react'
import ProfileTab from './ProfileTab'
import AddressesTab from './AddressesTab'
import BillingTab from './BillingTab'
import NotificationsTab from './NotificationsTab'
import SecurityTab from './SecurityTab'

export default function SettingsTabs() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams?.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  useEffect(() => {
    // Update active tab when URL changes
    const tab = searchParams?.get('tab') || 'profile'
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div className="max-w-3xl">
            <ProfileTab />
          </div>
        )}
        {activeTab === 'addresses' && (
          <div className="max-w-4xl">
            <AddressesTab />
          </div>
        )}
        {activeTab === 'billing' && (
          <div className="max-w-3xl">
            <BillingTab />
          </div>
        )}
        {activeTab === 'notifications' && (
          <div className="max-w-3xl">
            <NotificationsTab />
          </div>
        )}
        {activeTab === 'security' && (
          <div className="max-w-3xl">
            <SecurityTab />
          </div>
        )}
      </div>
    </div>
  )
}

