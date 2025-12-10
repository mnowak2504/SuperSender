import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BankTransferInfo from '@/components/invoices/BankTransferInfo'
import { getBankTransferTitle } from '@/lib/bank-transfer-info'

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

  // Find client by email or clientId - always verify email matches
  let clientId = (session.user as any)?.clientId
  let client: any = null
  
  // First verify clientId from session matches user's email
  if (clientId) {
    const { data: clientData } = await supabase
      .from('Client')
      .select('id, clientCode, email')
      .eq('id', clientId)
      .single()
    
    if (clientData && clientData.email === session.user.email) {
      client = clientData
    } else {
      // clientId mismatch - find by email
      console.warn('[INVOICES] clientId mismatch - finding by email')
      clientId = null
    }
  }
  
  // If no clientId or mismatch, find by email
  if (!client && session.user.email) {
    const { data: clientByEmail } = await supabase
      .from('Client')
      .select('id, clientCode, email')
      .eq('email', session.user.email)
      .single()
    
    if (clientByEmail) {
      clientId = clientByEmail.id
      client = clientByEmail
      
      // Update user's clientId if it was wrong
      if ((session.user as any)?.clientId !== clientByEmail.id) {
        console.warn('[INVOICES] Updating user clientId from', (session.user as any)?.clientId, 'to', clientByEmail.id)
        await supabase
          .from('User')
          .update({ clientId: clientByEmail.id })
          .eq('id', (session.user as any)?.id)
      }
    }
  }

  if (!clientId || !client) {
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
    const issueDate = new Date(invoice.createdAt)
    const now = new Date()
    
    // Check if invoice is more than 1 month old (overdue for admin contact)
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const isOverOneMonthOld = issueDate < oneMonthAgo && status !== 'PAID'

    // If status is ISSUED, check if it's overdue (more than 1 month)
    if (status === 'ISSUED') {
      if (isOverOneMonthOld) {
        status = 'OVERDUE'
        statusLabel = 'Overdue'
      } else {
        statusLabel = 'Due'
      }
    } else if (status === 'PAID') {
      statusLabel = 'Paid'
    }

    return {
      ...invoice,
      calculatedStatus: status,
      statusLabel,
      isOverOneMonthOld,
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
      case 'PROFORMA':
        return 'Proforma'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">View all your invoices and payment history</p>
          </div>
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
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
                        Issue Date
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
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.isOverOneMonthOld ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              invoice.calculatedStatus
                            )}`}
                          >
                            {invoice.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {/* Download link for PROFORMA invoices */}
                            {(invoice.type === 'OPERATIONS' || invoice.type === 'PROFORMA') && (
                              <a
                                href={`/api/invoices/${invoice.id}/itemised-order`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                                title="Download Itemised Proforma Invoice"
                              >
                                Download PDF
                              </a>
                            )}
                            
                            {/* Pay Now link */}
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
                            
                            {/* Paid status */}
                            {invoice.calculatedStatus === 'PAID' && (
                              <span className="text-gray-400">Paid</span>
                            )}
                          </div>
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
