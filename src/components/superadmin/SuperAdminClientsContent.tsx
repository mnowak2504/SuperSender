'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Edit,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  Package,
  Euro,
  FileText,
  Truck,
  X,
  Save,
  Building,
  Globe,
  CreditCard,
  Trash2,
} from 'lucide-react'

interface Client {
  id: string
  displayName: string
  email: string
  phone: string | null
  country: string
  clientCode: string
  status: string
  planId: string | null
  plan: {
    id: string
    name: string
    operationsRateEur: number
  } | null
  subscriptionDiscount: number
  additionalServicesDiscount: number
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  salesOwner: {
    id: string
    name: string
    email: string
  } | null
  salesOwnerId: string | null
  usedCbm: number
  limitCbm: number
  usagePercent: number
  isOverLimit: boolean
  users: Array<{
    id: string
    email: string
    name: string | null
    phone: string | null
    role: string
    clientId: string | null
  }>
  invoices: {
    total: number
    paid: number
    outstanding: number
    overdue: number
    count: number
  }
  deliveries: {
    total: number
    received: number
    expected: number
  }
  shipments: {
    total: number
    delivered: number
    inTransit: number
  }
  createdAt: string
  updatedAt: string
}

interface Plan {
  id: string
  name: string
  operationsRateEur: number
}

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  clientId: string | null
}

export default function SuperAdminClientsContent() {
  const [clients, setClients] = useState<Client[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [salesOwners, setSalesOwners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [planFilter, setPlanFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [countries, setCountries] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Form data
  const [clientFormData, setClientFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    country: '',
    status: 'ACTIVE',
    planId: '',
    subscriptionDiscount: 0,
    additionalServicesDiscount: 0,
    salesOwnerId: '',
    invoiceName: '',
    businessName: '',
    vatNumber: '',
    invoiceAddress: '',
    individualCbm: null as number | null,
    individualDeliveriesPerMonth: null as number | null,
    individualShipmentsPerMonth: null as number | null,
    individualOperationsRateEur: null as number | null,
    individualOverSpaceRateEur: null as number | null,
    individualAdditionalServicesRateEur: null as number | null,
  })
  const [userFormData, setUserFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'CLIENT' as User['role'],
    clientId: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [skipPayment, setSkipPayment] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [countryFilter, statusFilter, planFilter, sortBy, sortOrder])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (countryFilter !== 'ALL') queryParams.append('country', countryFilter)
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter)
      if (planFilter !== 'ALL') queryParams.append('planId', planFilter)
      queryParams.append('sortBy', sortBy)
      queryParams.append('sortOrder', sortOrder)

      const res = await fetch(`/api/superadmin/clients?${queryParams.toString()}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch clients')
      }
      const data = await res.json()
      setClients(data.clients || [])
      setCountries(data.filters?.countries || [])
      setPlans(data.filters?.plans || [])

      // Fetch all users for user editing
      const usersRes = await fetch('/api/superadmin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setAllUsers(usersData.users || [])
        // Filter sales owners (ADMIN and SUPERADMIN)
        setSalesOwners(
          (usersData.users || []).filter(
            (u: User) => u.role === 'ADMIN' || u.role === 'SUPERADMIN'
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientFormData({
      displayName: client.displayName || '',
      email: client.email || '',
      phone: client.phone || '',
      country: client.country || '',
      status: client.status || 'ACTIVE',
      planId: client.planId || '',
      subscriptionDiscount: client.subscriptionDiscount || 0,
      additionalServicesDiscount: client.additionalServicesDiscount || 0,
      salesOwnerId: client.salesOwnerId || '',
      invoiceName: (client as any).invoiceName || '',
      businessName: (client as any).businessName || '',
      vatNumber: (client as any).vatNumber || '',
      invoiceAddress: (client as any).invoiceAddress || '',
      individualCbm: (client as any).individualCbm || null,
      individualDeliveriesPerMonth: (client as any).individualDeliveriesPerMonth || null,
      individualShipmentsPerMonth: (client as any).individualShipmentsPerMonth || null,
      individualOperationsRateEur: (client as any).individualOperationsRateEur || null,
      individualOverSpaceRateEur: (client as any).individualOverSpaceRateEur || null,
      individualAdditionalServicesRateEur: (client as any).individualAdditionalServicesRateEur || null,
    })
    setSaveError(null)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      email: user.email || '',
      name: user.name || '',
      phone: user.phone || '',
      role: (user.role as User['role']) || 'CLIENT',
      clientId: user.clientId || '',
    })
    setSaveError(null)
  }

  const handleSaveClient = async () => {
    if (!editingClient) return

    setSaving(true)
    setSaveError(null)

    try {
      // If plan is being changed, use subscription endpoint
      const planChanged = clientFormData.planId !== editingClient.planId
      const discountsChanged = 
        clientFormData.subscriptionDiscount !== (editingClient.subscriptionDiscount || 0) ||
        clientFormData.additionalServicesDiscount !== (editingClient.additionalServicesDiscount || 0)
      
      // Use subscription endpoint if plan changed or if we need to update discounts with skipPayment
      if (planChanged || (skipPayment && discountsChanged)) {
        const subRes = await fetch(`/api/admin/clients/${editingClient.id}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: clientFormData.planId || editingClient.planId, // Use new plan or keep current
            skipPayment: skipPayment && planChanged, // Only skip payment when changing plan
            subscriptionDiscount: clientFormData.subscriptionDiscount || 0,
            additionalServicesDiscount: clientFormData.additionalServicesDiscount || 0,
          }),
        })

        if (!subRes.ok) {
          const errorData = await subRes.json()
          throw new Error(errorData.error || 'Failed to update subscription')
        }
      }

      // Update client data
      const res = await fetch(`/api/superadmin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: clientFormData.displayName,
          email: clientFormData.email,
          phone: clientFormData.phone || null,
          country: clientFormData.country,
          status: clientFormData.status,
          planId: clientFormData.planId || null,
          subscriptionDiscount: clientFormData.subscriptionDiscount || null,
          additionalServicesDiscount: clientFormData.additionalServicesDiscount || null,
          salesOwnerId: clientFormData.salesOwnerId || null,
          invoiceName: clientFormData.invoiceName || null,
          businessName: clientFormData.businessName || null,
          vatNumber: clientFormData.vatNumber || null,
          invoiceAddress: clientFormData.invoiceAddress || null,
          individualCbm: clientFormData.individualCbm || null,
          individualDeliveriesPerMonth: clientFormData.individualDeliveriesPerMonth || null,
          individualShipmentsPerMonth: clientFormData.individualShipmentsPerMonth || null,
          individualOperationsRateEur: clientFormData.individualOperationsRateEur || null,
          individualOverSpaceRateEur: clientFormData.individualOverSpaceRateEur || null,
          individualAdditionalServicesRateEur: clientFormData.individualAdditionalServicesRateEur || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update client')
      }

      await fetchData()
      setEditingClient(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error updating client:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userFormData.email,
          name: userFormData.name || null,
          phone: userFormData.phone || null,
          role: userFormData.role,
          clientId: userFormData.role === 'CLIENT' ? (userFormData.clientId || null) : null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      await fetchData()
      setEditingUser(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error updating user:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć klienta "${clientName}"? Ta operacja jest nieodwracalna i usunie również wszystkich powiązanych użytkowników.`)) {
      return
    }

    setDeletingClientId(clientId)
    try {
      const res = await fetch(`/api/superadmin/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete client')
      }

      await fetchData()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error deleting client:', err)
    } finally {
      setDeletingClientId(null)
    }
  }

  const filteredClients = clients.filter((client) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        client.displayName.toLowerCase().includes(search) ||
        client.clientCode.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search)
      )
    }
    return true
  })

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      CLIENT: 'bg-blue-100 text-blue-800',
      WAREHOUSE: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      SUPERADMIN: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Ładowanie klientów...</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">Błąd: {error}</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Klientami</h1>
            <p className="text-sm text-gray-500 mt-1">Zarządzaj wszystkimi klientami systemu</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj po nazwie, kodzie, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Wszystkie kraje</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="ACTIVE">Aktywni</option>
            <option value="INACTIVE">Nieaktywni</option>
            <option value="SUSPENDED">Zawieszeni</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Wszystkie plany</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} (€{plan.operationsRateEur.toFixed(2)}/miesiąc)
              </option>
            ))}
            <option value="NO_PLAN">Bez planu</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-')
              setSortBy(newSortBy)
              setSortOrder(newSortOrder as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt-desc">Sortuj: Data utworzenia (najnowsze)</option>
            <option value="createdAt-asc">Sortuj: Data utworzenia (najstarsze)</option>
            <option value="subscriptionEndDate-asc">Sortuj: Wygaśnięcie subskrypcji (najbliższe)</option>
            <option value="subscriptionEndDate-desc">Sortuj: Wygaśnięcie subskrypcji (najdalsze)</option>
            <option value="displayName-asc">Sortuj: Nazwa (A-Z)</option>
            <option value="displayName-desc">Sortuj: Nazwa (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">Nie znaleziono klientów</p>
            <p className="text-sm text-gray-400 mt-2">Spróbuj zmienić filtry wyszukiwania</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <div key={client.id} className="hover:bg-gray-50">
                {/* Client Row */}
                <div
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.displayName}</div>
                        <div className="text-xs text-gray-500">{client.clientCode}</div>
                        <div className="text-xs text-gray-400 mt-1">{client.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Kraj</div>
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {client.country || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Plan</div>
                        <div className="text-sm text-gray-900">
                          {client.plan ? (
                            <span>
                              {client.plan.name} (€{client.plan.operationsRateEur.toFixed(2)}/miesiąc)
                            </span>
                          ) : (
                            <span className="text-gray-400">Brak planu</span>
                          )}
                        </div>
                        {client.subscriptionDiscount > 0 && (
                          <div className="text-xs text-green-600">
                            Zniżka: {client.subscriptionDiscount}%
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Wygaśnięcie subskrypcji</div>
                        {client.subscriptionEndDate ? (
                          <div className="text-sm text-gray-900">
                            {new Date(client.subscriptionEndDate).toLocaleDateString('pl-PL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {(() => {
                              const endDate = new Date(client.subscriptionEndDate)
                              const now = new Date()
                              const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                              if (daysUntilExpiry < 0) {
                                return <div className="text-xs text-red-600 mt-1">Wygasła</div>
                              } else if (daysUntilExpiry <= 30) {
                                return <div className="text-xs text-yellow-600 mt-1">Wygasa za {daysUntilExpiry} dni</div>
                              }
                              return null
                            })()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Brak daty</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        {getStatusBadge(client.status)}
                        {client.isOverLimit && (
                          <div className="text-xs text-red-600 mt-1">⚠️ Przekroczony limit</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Magazyn</div>
                        <div className="text-sm text-gray-900">
                          {client.usedCbm.toFixed(2)} / {client.limitCbm.toFixed(2)} CBM
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.usagePercent.toFixed(0)}% wykorzystane
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClient(client)
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edytuj
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClient(client.id, client.displayName)
                        }}
                        disabled={deletingClientId === client.id}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 text-sm disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingClientId === client.id ? 'Usuwanie...' : 'Usuń'}
                      </button>
                      {expandedClient === client.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded KPI Section */}
                {expandedClient === client.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Invoices KPI */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Faktury</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Łącznie:</span>
                            <span className="font-medium">{client.invoices.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wartość łącznie:</span>
                            <span className="font-medium">€{client.invoices.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Opłacone:</span>
                            <span className="font-medium text-green-600">€{client.invoices.paid.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-600">Do zapłaty:</span>
                            <span className="font-medium text-yellow-600">€{client.invoices.outstanding.toFixed(2)}</span>
                          </div>
                          {client.invoices.overdue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-red-600">Przeterminowane:</span>
                              <span className="font-medium text-red-600">€{client.invoices.overdue.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deliveries KPI */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Dostawy</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Łącznie:</span>
                            <span className="font-medium">{client.deliveries.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Otrzymane:</span>
                            <span className="font-medium text-green-600">{client.deliveries.received}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-600">Oczekujące:</span>
                            <span className="font-medium text-yellow-600">{client.deliveries.expected}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shipments KPI */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">Wysyłki</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Łącznie:</span>
                            <span className="font-medium">{client.shipments.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Dostarczone:</span>
                            <span className="font-medium text-green-600">{client.shipments.delivered}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">W transporcie:</span>
                            <span className="font-medium text-blue-600">{client.shipments.inTransit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Users Section */}
                    {client.users && client.users.length > 0 && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">Użytkownicy ({client.users.length})</h3>
                        </div>
                        <div className="space-y-2">
                          {client.users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || 'Brak imienia'}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                                {user.phone && (
                                  <div className="text-xs text-gray-400">{user.phone}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getRoleBadge(user.role)}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditUser(user)
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edytuj Klienta</h2>
              <button
                onClick={() => {
                  setEditingClient(null)
                  setSaveError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa Klienta *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.displayName}
                    onChange={(e) => setClientFormData({ ...clientFormData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientFormData.email}
                    onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={clientFormData.phone}
                    onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kraj *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.country}
                    onChange={(e) => setClientFormData({ ...clientFormData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={clientFormData.status}
                    onChange={(e) => setClientFormData({ ...clientFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ACTIVE">Aktywny</option>
                    <option value="INACTIVE">Nieaktywny</option>
                    <option value="SUSPENDED">Zawieszony</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Subskrypcji
                  </label>
                  <select
                    value={clientFormData.planId}
                    onChange={(e) => setClientFormData({ ...clientFormData, planId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Brak planu</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (€{plan.operationsRateEur.toFixed(2)}/miesiąc)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zniżka na Subskrypcję (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={clientFormData.subscriptionDiscount}
                    onChange={(e) => setClientFormData({ ...clientFormData, subscriptionDiscount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zniżka na Usługi Dodatkowe (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={clientFormData.additionalServicesDiscount}
                    onChange={(e) => setClientFormData({ ...clientFormData, additionalServicesDiscount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Właściciel Sprzedaży
                  </label>
                  <select
                    value={clientFormData.salesOwnerId}
                    onChange={(e) => setClientFormData({ ...clientFormData, salesOwnerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Brak przypisania</option>
                    {salesOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name || owner.email} ({owner.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Individual Plan Settings */}
              {(() => {
                const selectedPlan = plans.find(p => p.id === clientFormData.planId)
                const isIndividualPlan = selectedPlan?.name === 'Individual'
                
                if (!isIndividualPlan) return null
                
                return (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Warunki Indywidualne</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Limit CBM
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={clientFormData.individualCbm || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualCbm: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 10.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dostawy na miesiąc
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={clientFormData.individualDeliveriesPerMonth || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualDeliveriesPerMonth: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wysyłki na miesiąc
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={clientFormData.individualShipmentsPerMonth || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualShipmentsPerMonth: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stawka operacyjna (€/miesiąc)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={clientFormData.individualOperationsRateEur || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualOperationsRateEur: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 150.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stawka za przekroczenie CBM (€/CBM)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={clientFormData.individualOverSpaceRateEur || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualOverSpaceRateEur: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 25.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stawka usług dodatkowych (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={clientFormData.individualAdditionalServicesRateEur || ''}
                          onChange={(e) => setClientFormData({ ...clientFormData, individualAdditionalServicesRateEur: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="np. 15.00"
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Invoice Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Informacje Fakturowe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa na Fakturze
                    </label>
                    <input
                      type="text"
                      value={clientFormData.invoiceName}
                      onChange={(e) => setClientFormData({ ...clientFormData, invoiceName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa Firmy
                    </label>
                    <input
                      type="text"
                      value={clientFormData.businessName}
                      onChange={(e) => setClientFormData({ ...clientFormData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numer VAT UE
                    </label>
                    <input
                      type="text"
                      value={clientFormData.vatNumber}
                      onChange={(e) => setClientFormData({ ...clientFormData, vatNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres Fakturowy
                    </label>
                    <textarea
                      rows={3}
                      value={clientFormData.invoiceAddress}
                      onChange={(e) => setClientFormData({ ...clientFormData, invoiceAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Skip Payment Option (only when changing plan) */}
              {clientFormData.planId && clientFormData.planId !== editingClient.planId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={skipPayment}
                      onChange={(e) => setSkipPayment(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Przypisz subskrypcję bez automatycznej opłaty (tylko Superadmin)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    Jeśli zaznaczone, subskrypcja zostanie przypisana i utworzona faktura oznaczona jako opłacona
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingClient(null)
                  setSaveError(null)
                }}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edytuj Użytkownika</h2>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setSaveError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imię i Nazwisko
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rola *
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as User['role']
                    setUserFormData({
                      ...userFormData,
                      role: newRole,
                      clientId: newRole !== 'CLIENT' ? '' : userFormData.clientId,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CLIENT">Klient</option>
                  <option value="WAREHOUSE">Magazyn</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Superadmin</option>
                </select>
              </div>

              {userFormData.role === 'CLIENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przypisany Klient
                  </label>
                  <select
                    value={userFormData.clientId}
                    onChange={(e) => setUserFormData({ ...userFormData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Brak przypisania</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.displayName} ({client.clientCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingUser(null)
                  setSaveError(null)
                }}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

