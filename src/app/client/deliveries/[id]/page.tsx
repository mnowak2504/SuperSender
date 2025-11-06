import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import Link from 'next/link'

export const runtime = 'nodejs'

function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'EXPECTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'RECEIVED':
      return 'bg-green-100 text-green-800'
    case 'DAMAGED':
      return 'bg-orange-100 text-orange-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function DeliveryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get clientId from session or find by email
  let clientId = (session.user as any)?.clientId

  if (!clientId) {
    const { data: client } = await supabase
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (client) {
      clientId = client.id
    }
  }

  // Fetch delivery details
  const { data: delivery, error } = await supabase
    .from('DeliveryExpected')
    .select(`
      *,
      Client:clientId(displayName, clientCode, email),
      warehouseOrder:WarehouseOrder(id, status, warehouseLocation, receivedAt, packedAt)
    `)
    .eq('id', id)
    .single()

  // Fetch photos for this delivery
  const { data: photos, error: photosError } = await supabase
    .from('Media')
    .select('id, url, kind, createdAt')
    .eq('deliveryExpectedId', id)
    .eq('kind', 'delivery_received')
    .order('createdAt', { ascending: true })

  if (photosError) {
    console.error('Error fetching photos:', photosError)
  }

  if (error || !delivery) {
    return (
      <ClientLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Delivery not found or you don't have access to it.</p>
              <Link
                href="/client/deliveries"
                className="text-red-600 hover:text-red-800 underline mt-2 inline-block"
              >
                ← Back to My Deliveries
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  // Check if user has access to this delivery
  if (delivery.clientId !== clientId) {
    return (
      <ClientLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">You don't have access to this delivery.</p>
              <Link
                href="/client/deliveries"
                className="text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block"
              >
                ← Back to My Deliveries
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const warehouseOrder = delivery.warehouseOrder && Array.isArray(delivery.warehouseOrder) 
    ? delivery.warehouseOrder[0] 
    : delivery.warehouseOrder

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/client/deliveries"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to My Deliveries
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Delivery Details</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                delivery.status
              )}`}
            >
              {delivery.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Delivery Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                  <dd className="mt-1 text-sm text-gray-900">{delivery.supplierName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Goods Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{delivery.goodsDescription}</dd>
                </div>
                {delivery.orderNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.orderNumber}</dd>
                  </div>
                )}
                {delivery.clientReference && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Your Reference</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.clientReference}</dd>
                  </div>
                )}
                {delivery.eta && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Expected Delivery Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(delivery.eta)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reported Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(delivery.createdAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Warehouse Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Information</h2>
              {delivery.status === 'EXPECTED' ? (
                <div className="text-sm text-gray-500">
                  <p>This delivery is still expected. It will be processed once received by the warehouse.</p>
                </div>
              ) : warehouseOrder ? (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Warehouse Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{warehouseOrder.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{warehouseOrder.status}</dd>
                  </div>
                  {warehouseOrder.warehouseLocation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">{warehouseOrder.warehouseLocation}</dd>
                    </div>
                  )}
                  {delivery.receivedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Received At</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(delivery.receivedAt)}</dd>
                    </div>
                  )}
                  {warehouseOrder.packedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Packed At</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(warehouseOrder.packedAt)}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>Warehouse order not yet created.</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {(delivery.quantity || delivery.condition || delivery.notes || delivery.warehouseLocation) && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {delivery.quantity && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.quantity}</dd>
                  </div>
                )}
                {delivery.condition && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Condition</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.condition}</dd>
                  </div>
                )}
                {delivery.warehouseLocation && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Warehouse Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.warehouseLocation}</dd>
                  </div>
                )}
                {delivery.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{delivery.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Photos Gallery */}
          {photos && photos.length > 0 && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Photos</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Delivery photo ${photo.id}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 hover:border-blue-500 transition cursor-pointer"
                      onClick={() => window.open(photo.url, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png'
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition rounded-lg flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                        Click to enlarge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}

