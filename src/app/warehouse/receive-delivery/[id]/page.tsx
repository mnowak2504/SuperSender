import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import ReceiveDeliveryForm from './ReceiveDeliveryForm'
import type { DeliveryExpected } from '@/lib/db'

export const runtime = 'nodejs'

export default async function ReceiveDeliveryPage({
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

  // Pobierz szczegóły oczekiwanej dostawy
  const { data: delivery, error } = await supabase
    .from('DeliveryExpected')
    .select('*, Client:clientId(displayName, clientCode)')
    .eq('id', id)
    .single()

  if (error || !delivery) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd: Nie znaleziono dostawy lub błąd pobierania danych.</p>
          <a href="/warehouse/expected-deliveries" className="text-red-600 hover:text-red-800 underline mt-2 inline-block">
            Wróć do listy oczekiwanych dostaw
          </a>
        </div>
      </div>
    )
  }

  // Sprawdź czy dostawa już została przyjęta
  if (delivery.status !== 'EXPECTED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Ta dostawa została już przetworzona. Status: {delivery.status}</p>
          <a href="/warehouse/expected-deliveries" className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
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
          href="/warehouse/expected-deliveries"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Wróć do listy oczekiwanych dostaw
        </a>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Przyjęcie dostawy</h1>

      {/* Informacje o dostawie */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły dostawy</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Klient</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {(delivery.Client as any)?.displayName || 'Brak'} ({(delivery.Client as any)?.clientCode || 'Brak kodu'})
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Dostawca</dt>
            <dd className="mt-1 text-sm text-gray-900">{delivery.supplierName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Opis towaru</dt>
            <dd className="mt-1 text-sm text-gray-900">{delivery.goodsDescription}</dd>
          </div>
          {delivery.orderNumber && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Numer zamówienia</dt>
              <dd className="mt-1 text-sm text-gray-900">{delivery.orderNumber}</dd>
            </div>
          )}
          {delivery.clientReference && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Referencja klienta</dt>
              <dd className="mt-1 text-sm text-gray-900">{delivery.clientReference}</dd>
            </div>
          )}
          {delivery.eta && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Szacowana data dostawy</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(delivery.eta).toLocaleDateString('pl-PL')}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Formularz przyjęcia */}
      <ReceiveDeliveryForm deliveryId={id} receivedById={session.user.id!} clientId={delivery.clientId} />
    </div>
  )
}

