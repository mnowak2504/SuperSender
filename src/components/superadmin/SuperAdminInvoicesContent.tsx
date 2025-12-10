'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Edit2, Save, X, FileText, Link } from 'lucide-react'

interface Invoice {
  id: string
  clientId: string
  type: 'SUBSCRIPTION' | 'TRANSPORT' | 'OPERATIONS' | 'PROFORMA'
  amountEur: number
  currency: string
  status: 'ISSUED' | 'PAID' | 'OVERDUE'
  dueDate: string
  createdAt: string
  paidAt: string | null
  invoiceNumber: string | null
  paymentMethod?: string | null // 'BANK_TRANSFER', 'PAYMENT_LINK_REQUESTED'
  subscriptionPlanId?: string | null // For subscription invoices (PROFORMA with subscriptionPlanId)
  subscriptionStartDate?: string | null
  subscriptionPeriod?: string | null
  subscriptionEndDate?: string | null
  client?: {
    id: string
    displayName: string
    email: string
    clientCode: string
  }
}

export default function SuperAdminInvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'ISSUED' | 'PAID' | 'OVERDUE'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [filter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError('')
      
      const url = filter === 'all' 
        ? '/api/superadmin/invoices'
        : `/api/superadmin/invoices?status=${filter}`
      
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!confirm('Czy na pewno chcesz oznaczyć tę fakturę jako zapłaconą?')) {
      return
    }

    try {
      setUpdating(invoiceId)
      setError('')

      const res = await fetch(`/api/superadmin/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update invoice' }))
        throw new Error(errorData.error || errorData.details || 'Failed to update invoice')
      }

      // Refresh invoices
      await fetchInvoices()
    } catch (err) {
      console.error('Error marking invoice as paid:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark invoice as paid')
    } finally {
      setUpdating(null)
    }
  }

  const handleStartEditInvoiceNumber = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id)
    setEditingInvoiceNumber(invoice.invoiceNumber || '')
  }

  const handleCancelEditInvoiceNumber = () => {
    setEditingInvoiceId(null)
    setEditingInvoiceNumber('')
  }

  const handleSaveInvoiceNumber = async (invoiceId: string) => {
    try {
      setUpdating(invoiceId)
      setError('')

      const res = await fetch(`/api/superadmin/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: editingInvoiceNumber.trim() || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update invoice' }))
        throw new Error(errorData.error || errorData.details || 'Failed to update invoice number')
      }

      // Refresh invoices
      await fetchInvoices()
      setEditingInvoiceId(null)
      setEditingInvoiceNumber('')
    } catch (err) {
      console.error('Error updating invoice number:', err)
      setError(err instanceof Error ? err.message : 'Failed to update invoice number')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (invoice: Invoice) => {
    const isOverdue = invoice.status === 'ISSUED' && new Date(invoice.dueDate) < new Date()
    const status = isOverdue ? 'OVERDUE' : invoice.status

    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Zapłacona
          </span>
        )
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" />
            Przeterminowana
          </span>
        )
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Oczekująca
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION':
        return 'Subskrypcja'
      case 'TRANSPORT':
        return 'Transport'
      case 'OPERATIONS':
      case 'PROFORMA':
        return 'Proforma'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-500">Ładowanie faktur...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
        <p className="mt-1 text-sm text-gray-500">Zarządzaj wszystkimi fakturami w systemie</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setFilter('ISSUED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'ISSUED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Oczekujące
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'PAID'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Zapłacone
        </button>
        <button
          onClick={() => setFilter('OVERDUE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'OVERDUE'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Przeterminowane
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faktura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Klient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kwota netto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kwota brutto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data wystawienia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data utworzenia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metoda płatności
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-sm text-gray-500">
                  Brak faktur
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                // Check if invoice is more than 1 month old (overdue for admin contact)
                const issueDate = new Date(invoice.createdAt)
                const now = new Date()
                const oneMonthAgo = new Date(now)
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                const isOverOneMonthOld = issueDate < oneMonthAgo && invoice.status !== 'PAID'
                const canMarkAsPaid = invoice.status !== 'PAID'
                
                // Calculate VAT (23% Polish standard)
                const vatRate = 0.23
                const totalWithVat = invoice.amountEur
                const subtotal = totalWithVat / (1 + vatRate)
                const vatAmount = totalWithVat - subtotal

                return (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverOneMonthOld ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingInvoiceId === invoice.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingInvoiceNumber}
                            onChange={(e) => setEditingInvoiceNumber(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Numer faktury"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInvoiceNumber(invoice.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEditInvoiceNumber()
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSaveInvoiceNumber(invoice.id)}
                            disabled={updating === invoice.id}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Zapisz"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditInvoiceNumber}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Anuluj"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}
                            </div>
                            <div className="text-xs text-gray-500">{invoice.id.slice(0, 8)}...</div>
                          </div>
                          <button
                            onClick={() => handleStartEditInvoiceNumber(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edytuj numer faktury"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.client?.displayName || 'Nieznany klient'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.client?.clientCode || 'N/A'} • {invoice.client?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTypeLabel(invoice.type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(subtotal, invoice.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(vatAmount, invoice.currency)}
                      </span>
                      <div className="text-xs text-gray-500">(23%)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(totalWithVat, invoice.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isOverOneMonthOld ? 'text-red-600 font-semibold' : ''}`}>
                      <div className="text-sm">{formatDate(invoice.createdAt)}</div>
                      {isOverOneMonthOld && (
                        <div className="text-xs text-red-600 font-semibold">Wymaga kontaktu z klientem</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(invoice.createdAt)}</div>
                      {invoice.paidAt && (
                        <div className="text-xs text-green-600">
                          Zapłacona: {formatDate(invoice.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.paymentMethod ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.paymentMethod === 'BANK_TRANSFER' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {invoice.paymentMethod === 'BANK_TRANSFER' ? 'Przelew bankowy' : 'Link płatniczy żądany'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col gap-2 items-end">
                        {/* Download link for PROFORMA invoices */}
                        {(invoice.type === 'OPERATIONS' || invoice.type === 'PROFORMA') && (
                          <a
                            href={`/api/invoices/${invoice.id}/itemised-order`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                            title="Pobierz szczegóły zamówienia PDF"
                          >
                            <FileText className="w-3 h-3" />
                            Pobierz PDF
                          </a>
                        )}
                        
                        {/* Request payment link button for TRANSPORT and SUBSCRIPTION invoices */}
                        {(invoice.type === 'TRANSPORT' || (invoice.type === 'PROFORMA' && invoice.subscriptionPlanId)) && invoice.status === 'ISSUED' && !invoice.paymentMethod && (
                          <button
                            onClick={async () => {
                              if (!confirm('Czy na pewno chcesz żądać linku płatniczego dla tej faktury? Konto klienta zostanie aktywowane natychmiast.')) {
                                return
                              }

                              try {
                                setUpdating(invoice.id)
                                setError('')

                                // Update invoice to mark payment link as requested
                                const res = await fetch(`/api/superadmin/invoices/${invoice.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    paymentMethod: 'PAYMENT_LINK_REQUESTED',
                                  }),
                                })

                                if (!res.ok) {
                                  const errorData = await res.json().catch(() => ({ error: 'Failed to update invoice' }))
                                  throw new Error(errorData.error || errorData.details || 'Failed to request payment link')
                                }

                                // If subscription invoice (PROFORMA with subscriptionPlanId), activate subscription immediately
                                if (invoice.type === 'PROFORMA' && invoice.subscriptionPlanId) {
                                  // Get invoice details to activate subscription
                                  const invoiceRes = await fetch(`/api/superadmin/invoices/${invoice.id}`)
                                  if (invoiceRes.ok) {
                                    const invoiceData = await invoiceRes.json()
                                    const invoiceDetails = invoiceData.invoice
                                    
                                    if (invoiceDetails.subscriptionPlanId && invoiceDetails.subscriptionStartDate) {
                                      // Activate subscription
                                      const activateRes = await fetch(`/api/superadmin/clients/${invoice.clientId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          planId: invoiceDetails.subscriptionPlanId,
                                          subscriptionStartDate: invoiceDetails.subscriptionStartDate,
                                          subscriptionEndDate: invoiceDetails.subscriptionEndDate || null,
                                        }),
                                      })
                                      
                                      if (!activateRes.ok) {
                                        console.warn('Failed to activate subscription, but payment link was requested')
                                      }
                                    }
                                  }
                                }

                                // Refresh invoices
                                await fetchInvoices()
                              } catch (err) {
                                console.error('Error requesting payment link:', err)
                                setError(err instanceof Error ? err.message : 'Failed to request payment link')
                              } finally {
                                setUpdating(null)
                              }
                            }}
                            disabled={updating === invoice.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Żądaj linku płatniczego"
                          >
                            {updating === invoice.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Zapisywanie...
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3" />
                                Żądaj linku
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Mark as paid button */}
                        {canMarkAsPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={updating === invoice.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {updating === invoice.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Zapisywanie...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Oznacz jako zapłaconą
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

