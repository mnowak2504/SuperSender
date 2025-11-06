import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function QuotesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz wszystkie zamówienia gotowe do wyceny
  const { data: orders, error } = await supabase
    .from('WarehouseOrder')
    .select('*, Client:clientId(displayName, clientCode)')
    .eq('status', 'READY_FOR_QUOTE')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching orders ready for quote:', error)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Zamówienia gotowe do wyceny</h1>
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {orders && orders.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          Zamówienie #{order.id.slice(-8)}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Gotowe do wyceny
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <span className="font-medium">Klient:</span> {(order.Client as any)?.displayName || 'Brak'}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {(order.Client as any)?.clientCode || 'Brak kodu'}
                        </span>
                      </div>
                      {order.warehouseLocation && (
                        <div className="mt-1 text-sm text-gray-500">
                          Lokalizacja: {order.warehouseLocation}
                        </div>
                      )}
                      {order.packedLengthCm && order.packedWidthCm && order.packedHeightCm && (
                        <div className="mt-1 text-sm text-gray-500">
                          Wymiary: {order.packedLengthCm}×{order.packedWidthCm}×{order.packedHeightCm} cm
                          {order.packedWeightKg && `, Waga: ${order.packedWeightKg} kg`}
                        </div>
                      )}
                      {order.packedAt && (
                        <div className="mt-1 text-xs text-gray-400">
                          Spakowano: {new Date(order.packedAt).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/admin/quote/${order.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Wyceń transport
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Brak zamówień gotowych do wyceny</p>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Powrót do dashboardu
          </Link>
        </div>
      )}
    </div>
  )
}

