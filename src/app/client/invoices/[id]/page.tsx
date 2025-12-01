import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/ClientLayout'
import ClientHeader from '@/components/ClientHeader'
import { formatCurrency, formatDate } from '@/lib/utils'
import BankTransferInfo from '@/components/invoices/BankTransferInfo'
import { getBankTransferTitle } from '@/lib/bank-transfer-info'

export const runtime = 'nodejs'

export default async function InvoiceDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ paymentMethod?: string; paymentLinkRequested?: string }
}) {
  const session = await auth()
  const { id } = await params
  const { paymentMethod, paymentLinkRequested } = await searchParams

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
      .select('id, clientCode')
      .eq('email', session.user.email)
      .single()
    
    if (clientByEmail) {
      clientId = clientByEmail.id
    }
  }

  if (!clientId) {
    redirect('/auth/signin')
  }

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('Invoice')
    .select('*')
    .eq('id', id)
    .eq('clientId', clientId)
    .single()

  if (error || !invoice) {
    return (
      <ClientLayout>
        <ClientHeader title="Invoice" showBackButton={true} backButtonHref="/client/invoices" backButtonLabel="Back to Invoices" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Invoice not found or you don't have access to it.</p>
          </div>
        </div>
      </ClientLayout>
    )
  }

  // Fetch client code
  const { data: client } = await supabase
    .from('Client')
    .select('clientCode')
    .eq('id', clientId)
    .single()

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

  const status = invoice.status === 'ISSUED' && new Date(invoice.dueDate) < new Date() 
    ? 'OVERDUE' 
    : invoice.status

  const showBankTransfer = paymentMethod === 'bank_transfer' || (invoice.type === 'SUBSCRIPTION' && !invoice.revolutLink)

  return (
    <ClientLayout>
      <ClientHeader title="Invoice Details" showBackButton={true} backButtonHref="/client/invoices" backButtonLabel="Back to Invoices" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
              <p className="text-sm text-gray-500 mt-1">Invoice #{invoice.id.slice(-8).toUpperCase()}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              {status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'Due'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm font-medium text-gray-900">{getTypeLabel(invoice.type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amountEur, invoice.currency || 'EUR')}</p>
            </div>
          </div>

          {paymentLinkRequested === 'true' && !invoice.revolutLink && status !== 'PAID' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Payment Link Requested</h3>
                  <p className="text-sm text-blue-700">
                    Your payment link request has been received. The payment link will be sent to your email within 1 working day. 
                    Your account will be activated instantly upon payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {invoice.revolutLink && status !== 'PAID' && (
            <div className="mb-6">
              <a
                href={invoice.revolutLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Pay Online
              </a>
            </div>
          )}

          {showBankTransfer && client && (
            <BankTransferInfo
              clientCode={client.clientCode || 'N/A'}
              invoiceNumber={invoice.id.slice(-8).toUpperCase()}
              amount={invoice.amountEur}
              transferTitle={getBankTransferTitle(client.clientCode || 'N/A', invoice.id.slice(-8).toUpperCase())}
            />
          )}
        </div>
      </div>
    </ClientLayout>
  )
}

