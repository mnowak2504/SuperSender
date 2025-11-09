import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import ClientHeader from '@/components/ClientHeader'
import { formatCurrency, formatDate } from '@/lib/utils'

export const runtime = 'nodejs'

export default async function InvoicesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'CLIENT') {
    redirect('/unauthorized')
  }

  // Find client by email or clientId
  let clientId = (session.user as any)?.clientId
  
  if (!clientId) {
    const { data: clientByEmail } = await supabase
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single()
    
    if (clientByEmail) {
      clientId = clientByEmail.id
    }
  }

  if (!clientId) {
    redirect('/auth/signin')
  }

  // Fetch all invoices, ordered by createdAt descending (latest first)
  const { data: invoices, error } = await supabase
    .from('Invoice')
    .select('*')
    .eq('clientId', clientId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  const allInvoices = invoices || []

  // Calculate status for each invoice
  const invoicesWithStatus = allInvoices.map((invoice) => {
    let status = invoice.status
    let statusLabel = status
    let dueDateInfo = ''

    // If status is ISSUED, check if it's overdue
    if (status === 'ISSUED') {
      const dueDate = new Date(invoice.dueDate)
      const now = new Date()
      
      if (dueDate < now) {
        status = 'OVERDUE'
        statusLabel = 'Overdue'
      } else {
        statusLabel = 'Due'
        dueDateInfo = formatDate(invoice.dueDate)
      }
    } else if (status === 'PAID') {
      statusLabel = 'Paid'
    }

    return {
      ...invoice,
      calculatedStatus: status,
      statusLabel,
      dueDateInfo,
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'ISSUED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION':
        return 'Subscription'
      case 'TRANSPORT':
        return 'Transport (MAK)'
      case 'OPERATIONS':
        return 'Operations'
      default:
        return type
    }
  }

  // Group invoices by month for better organization
  const invoicesByMonth = invoicesWithStatus.reduce((acc, invoice) => {
    const date = new Date(invoice.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        invoices: [],
      }
    }
    acc[monthKey].invoices.push(invoice)
    return acc
  }, {} as Record<string, { label: string; invoices: any[] }>)

  const sortedMonths = Object.keys(invoicesByMonth).sort().reverse() // Latest months first

  return (
    <ClientLayout>
      <ClientHeader title="Invoices" showBackButton={true} backButtonHref="/client/dashboard" backButtonLabel="Dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-600">View all your invoices and payment history</p>
        </div>

        {invoicesWithStatus.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No invoices found</p>
            <p className="text-gray-400 text-sm mt-2">Your invoices will appear here once they are generated</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* All Invoices - Chronological View */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">All Invoices</h2>
                <p className="text-sm text-gray-500 mt-1">Latest invoices at the top</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
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
                    {invoicesWithStatus.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                          {invoice.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getTypeLabel(invoice.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.amountEur, invoice.currency || 'EUR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {invoice.dueDateInfo || formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              invoice.calculatedStatus
                            )}`}
                          >
                            {invoice.statusLabel}
                            {invoice.calculatedStatus === 'ISSUED' && invoice.dueDateInfo && (
                              <span className="ml-1 text-xs">({invoice.dueDateInfo})</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {invoice.calculatedStatus !== 'PAID' && invoice.revolutLink && (
                            <a
                              href={invoice.revolutLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Pay Now
                            </a>
                          )}
                          {invoice.calculatedStatus === 'PAID' && (
                            <span className="text-gray-400">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Invoices</h3>
                <p className="text-2xl font-bold text-gray-900">{invoicesWithStatus.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Paid</h3>
                <p className="text-2xl font-bold text-green-600">
                  {invoicesWithStatus.filter((inv) => inv.calculatedStatus === 'PAID').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Outstanding</h3>
                <p className="text-2xl font-bold text-red-600">
                  €{invoicesWithStatus
                    .filter((inv) => inv.calculatedStatus !== 'PAID')
                    .reduce((sum, inv) => sum + (inv.amountEur || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
