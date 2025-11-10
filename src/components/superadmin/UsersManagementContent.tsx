'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Filter, Edit, Shield, Mail, Phone, Calendar, X, Save } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: 'CLIENT' | 'WAREHOUSE' | 'ADMIN' | 'SUPERADMIN'
  clientId: string | null
  createdAt: string
  updatedAt: string
  Client?: {
    displayName: string
    clientCode: string
  } | null
}

interface Client {
  id: string
  displayName: string
  clientCode: string
}

export default function UsersManagementContent() {
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'CLIENT' as User['role'],
    clientId: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchClients()
    const interval = setInterval(fetchUsers, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [roleFilter])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (roleFilter !== 'ALL') queryParams.append('role', roleFilter)
      if (searchTerm) queryParams.append('search', searchTerm)

      const res = await fetch(`/api/superadmin/users?${queryParams.toString()}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: User['role']) => {
    const colors = {
      CLIENT: 'bg-blue-100 text-blue-800',
      WAREHOUSE: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      SUPERADMIN: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[role]}`}>
        {role}
      </span>
    )
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      name: user.name || '',
      phone: user.phone || '',
      role: user.role,
      clientId: user.clientId || '',
    })
    setSaveError(null)
  }

  const handleCancel = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      phone: '',
      role: 'CLIENT',
      clientId: '',
    })
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!editingUser) return

    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || null,
          phone: formData.phone || null,
          role: formData.role,
          clientId: formData.role === 'CLIENT' ? (formData.clientId || null) : null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      // Refresh users list
      await fetchUsers()
      handleCancel()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error updating user:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        user.email.toLowerCase().includes(search) ||
        (user.name && user.name.toLowerCase().includes(search)) ||
        (user.Client?.displayName && user.Client.displayName.toLowerCase().includes(search)) ||
        (user.Client?.clientCode && user.Client.clientCode.toLowerCase().includes(search))
      )
    }
    return true
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Użytkownikami</h1>
            <p className="text-sm text-gray-500 mt-1">Zarządzaj wszystkimi użytkownikami systemu</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj po email, imieniu, kliencie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">Wszystkie role</option>
          <option value="CLIENT">Klient</option>
          <option value="WAREHOUSE">Magazyn</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPERADMIN">Superadmin</option>
        </select>

        <div className="text-sm text-gray-600">
          Łącznie: <span className="font-semibold">{filteredUsers.length}</span> użytkowników
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Ładowanie użytkowników...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-12">Błąd: {error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">Nie znaleziono użytkowników</p>
          <p className="text-sm text-gray-400 mt-2">Spróbuj zmienić filtry wyszukiwania</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Użytkownik
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rola
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Przypisany Klient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data utworzenia
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Brak imienia'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.Client ? (
                        <div>
                          <div className="font-medium text-gray-900">{user.Client.displayName}</div>
                          <div className="text-xs text-gray-400">{user.Client.clientCode}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {!user.email && !user.phone && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(user.createdAt).toLocaleDateString('pl-PL')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                onClick={handleCancel}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imię i Nazwisko
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rola *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as User['role']
                    setFormData({
                      ...formData,
                      role: newRole,
                      clientId: newRole !== 'CLIENT' ? '' : formData.clientId,
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

              {formData.role === 'CLIENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przypisany Klient
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
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
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
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

