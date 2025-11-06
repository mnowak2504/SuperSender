import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import Link from 'next/link'

export const runtime = 'nodejs'

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function DeliveriesPage() {
  const session = await auth()

  console.log('[DELIVERIES PAGE] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    clientId: (session?.user as any)?.clientId,
  })

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get clientId from session or find by email
  let clientId = (session.user as any)?.clientId

  if (!clientId) {
    // Try to find Client by email
    const { data: client } = await supabase
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (client) {
      clientId = client.id
      console.log('[DELIVERIES PAGE] Found Client by email:', clientId)
    } else {
      // User has no Client, show empty list
      clientId = null
      console.log('[DELIVERIES PAGE] No Client found for user')
    }
  }

  // Fetch deliveries using Supabase
  let deliveries: any[] = []
  
  if (clientId) {
    console.log('[DELIVERIES PAGE] Fetching deliveries for clientId:', clientId)
    const { data, error } = await supabase
      .from('DeliveryExpected')
      .select('*')
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[DELIVERIES PAGE] Error fetching deliveries:', error)
    } else {
      deliveries = data || []
      console.log('[DELIVERIES PAGE] Found deliveries:', deliveries.length)
    }
  }

  const getStatusColor = (status: string) => {
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

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
            <Link
              href="/client/deliveries/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Report Delivery
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No deliveries found
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(delivery.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {delivery.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {delivery.goodsDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.orderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.clientReference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/client/deliveries/${delivery.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

