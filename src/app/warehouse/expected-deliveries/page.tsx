import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function ExpectedDeliveriesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz wszystkie oczekiwane dostawy
  const { data: expectedDeliveries, error } = await supabase
    .from('DeliveryExpected')
    .select('*, Client:clientId(displayName, clientCode)')
    .eq('status', 'EXPECTED')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching expected deliveries:', error)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Oczekiwane dostawy</h1>
        <Link
          href="/warehouse/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {expectedDeliveries && expectedDeliveries.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {expectedDeliveries.map((delivery: any) => (
              <li key={delivery.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {(delivery.Client as any)?.displayName || 'Klient'}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(delivery.Client as any)?.clientCode || 'Brak kodu'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <span className="font-medium">Dostawca:</span> {delivery.supplierName}
                        </p>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">{delivery.goodsDescription}</p>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-400 space-x-4">
                        {delivery.orderNumber && (
                          <span>Zamówienie: {delivery.orderNumber}</span>
                        )}
                        {delivery.clientReference && (
                          <span>Ref: {delivery.clientReference}</span>
                        )}
                        {delivery.eta && (
                          <span>
                            ETA: {new Date(delivery.eta).toLocaleDateString('pl-PL')}
                          </span>
                        )}
                        <span>
                          Zgłoszono: {new Date(delivery.createdAt).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/warehouse/receive-delivery/${delivery.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Przyjmij dostawę
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
          <p className="text-gray-500">Brak oczekiwanych dostaw</p>
          <Link
            href="/warehouse/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Powrót do dashboardu
          </Link>
        </div>
      )}
    </div>
  )
}

