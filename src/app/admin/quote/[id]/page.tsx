import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import QuoteForm from './QuoteForm'

export const runtime = 'nodejs'

export default async function QuotePage({
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
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz szczegóły zamówienia
  const { data: order, error: orderError } = await supabase
    .from('WarehouseOrder')
    .select('*, Client:clientId(displayName, clientCode, id)')
    .eq('id', id)
    .single()

  // Pobierz adresy klienta (dla wyceny potrzebny będzie adres dostawy)
  let addresses: any[] = []
  if (order && (order.Client as any)?.id) {
    const { data: clientAddresses } = await supabase
      .from('Address')
      .select('*')
      .eq('clientId', (order.Client as any).id)
    
    addresses = clientAddresses || []
  }

  if (orderError || !order) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Błąd: Nie znaleziono zamówienia lub błąd pobierania danych.</p>
          <a href="/admin/quotes" className="text-red-600 hover:text-red-800 underline mt-2 inline-block">
            Wróć do listy wycen
          </a>
        </div>
      </div>
    )
  }

  // Sprawdź czy zamówienie może być wycenione
  if (order.status !== 'READY_FOR_QUOTE') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            To zamówienie nie może być wycenione. Obecny status: {order.status}
          </p>
          <a href="/admin/quotes" className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
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
          href="/admin/quotes"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Wróć do listy wycen
        </a>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Wycena transportu</h1>

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
              <dt className="text-sm font-medium text-gray-500">Lokalizacja magazynowa</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.warehouseLocation}</dd>
            </div>
          )}
          {order.packedLengthCm && order.packedWidthCm && order.packedHeightCm && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Wymiary</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.packedLengthCm}×{order.packedWidthCm}×{order.packedHeightCm} cm
              </dd>
            </div>
          )}
          {order.packedWeightKg && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Waga</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.packedWeightKg} kg</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Formularz wyceny */}
      <QuoteForm
        orderId={id}
        clientId={order.clientId}
        addresses={addresses}
        quotedById={session.user.id!}
        dimensions={{
          length: order.packedLengthCm || 0,
          width: order.packedWidthCm || 0,
          height: order.packedHeightCm || 0,
          weight: order.packedWeightKg || 0,
        }}
      />
    </div>
  )
}

