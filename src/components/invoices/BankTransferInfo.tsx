'use client'

import { Building2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { BANK_TRANSFER_INFO } from '@/lib/bank-transfer-info'

interface BankTransferInfoProps {
  clientCode: string
  invoiceNumber?: string
  amount: number
  transferTitle: string
  invoiceCreatedAt?: string // Invoice creation date to check if payment was recent
  invoicePaidAt?: string | null // Invoice paid date if available
}

export default function BankTransferInfo({
  clientCode,
  invoiceNumber,
  amount,
  transferTitle,
  invoiceCreatedAt,
  invoicePaidAt,
}: BankTransferInfoProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Bank Transfer Instructions</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Your account has been activated immediately. 
            Please complete the bank transfer within 4 business days. 
            If payment is not received within this time, the service will be deactivated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 flex-1">{BANK_TRANSFER_INFO.accountHolder}</p>
              <button
                onClick={() => copyToClipboard(BANK_TRANSFER_INFO.accountHolder, 'holder')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy"
              >
                {copied === 'holder' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <p className="text-sm text-gray-900">{BANK_TRANSFER_INFO.currency}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-gray-900 flex-1">{BANK_TRANSFER_INFO.iban}</p>
              <button
                onClick={() => copyToClipboard(BANK_TRANSFER_INFO.iban, 'iban')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy"
              >
                {copied === 'iban' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code</label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-gray-900 flex-1">{BANK_TRANSFER_INFO.swift}</p>
              <button
                onClick={() => copyToClipboard(BANK_TRANSFER_INFO.swift, 'swift')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy"
              >
                {copied === 'swift' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <p className="text-sm text-gray-900">{BANK_TRANSFER_INFO.bankName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Address</label>
            <p className="text-sm text-gray-900">{BANK_TRANSFER_INFO.bankAddress}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Country</label>
            <p className="text-sm text-gray-900">{BANK_TRANSFER_INFO.bankCountry}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <p className="text-sm font-semibold text-gray-900">€{amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Title <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono text-gray-900 flex-1 bg-white p-2 rounded border border-gray-300">
              {transferTitle}
            </p>
            <button
              onClick={() => copyToClipboard(transferTitle, 'title')}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center gap-1"
            >
              {copied === 'title' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Please use this exact title in your bank transfer for fastest payment allocation
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-gray-600">
            <strong>Processing time:</strong> {BANK_TRANSFER_INFO.processingTime}
          </p>
          {(() => {
            // Show payment update time message only if payment wasn't made recently
            // Check if invoice was paid recently (within last 2 days)
            if (invoicePaidAt) {
              const now = new Date()
              const paidDate = new Date(invoicePaidAt)
              const daysSincePayment = (now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24)
              if (daysSincePayment < 2) {
                return null // Payment was recent, don't show message
              }
            }
            
            // Check if invoice was created recently (within last 2 days)
            if (invoiceCreatedAt) {
              const now = new Date()
              const createdDate = new Date(invoiceCreatedAt)
              const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
              if (daysSinceCreation < 2) {
                return null // Invoice was created recently, don't show message yet
              }
            }
            
            // Show message if invoice is older than 2 days and not paid recently
            return (
              <p className="text-xs text-blue-600 mt-2">
                Payment status updates may take up to 2 business days to reflect in your account after the transfer is completed.
              </p>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

