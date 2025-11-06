import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import PackOrderForm from './PackOrderForm'

export const runtime = 'nodejs'

export default async function PackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz szczegóły zamówienia
  const { data: order, error } = await supabase
    .from('WarehouseOrder')
    .select('*, Client:clientId(displayName, clientCode)')
    .eq('id', id)
    .single()

  if (error || !order) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd: Nie znaleziono zamówienia lub błąd pobierania danych.</p>
          <a href="/warehouse/orders" className="text-red-600 hover:text-red-800 underline mt-2 inline-block">
            Wróć do listy zamówień
          </a>
        </div>
      </div>
    )
  }

  // Sprawdź czy zamówienie może być pakowane
  if (order.status !== 'AT_WAREHOUSE' && order.status !== 'TO_PACK' && order.status !== 'BEING_PACKED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            To zamówienie nie może być pakowane. Obecny status: {order.status}
          </p>
          <a href="/warehouse/orders" className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
            Wróć do listy
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <a
          href="/warehouse/orders"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Wróć do listy zamówień
        </a>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pakowanie zamówienia</h1>

      {/* Informacje o zamówieniu */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły zamówienia</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">ID zamówienia</dt>
            <dd className="mt-1 text-sm text-gray-900">#{order.id.slice(-8)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Klient</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(order.Client as any)?.displayName || 'Brak'} ({(order.Client as any)?.clientCode || 'Brak kodu'})
            </dd>
          </div>
          {order.warehouseLocation && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Lokalizacja</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.warehouseLocation}</dd>
            </div>
          )}
          {order.status && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.status}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Formularz pakowania */}
      <PackOrderForm orderId={id} currentStatus={order.status} />
    </div>
  )
}

