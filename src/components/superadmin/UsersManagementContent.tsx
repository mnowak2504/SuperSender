'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Filter, Edit, Shield, Mail, Phone, Calendar } from 'lucide-react'

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

export default function UsersManagementContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [roleFilter])

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
                        onClick={() => {
                          // TODO: Implement edit user modal
                          alert(`Edycja użytkownika ${user.email} (TODO)`)
                        }}
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
    </div>
  )
}

