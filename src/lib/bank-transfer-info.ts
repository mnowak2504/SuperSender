export const BANK_TRANSFER_INFO = {
  accountHolder: 'MAK CONSULTING P.H.U. MICHAŁ NOWAK',
  currency: 'EUR',
  iban: 'PL62109020080000000151961991',
  swift: 'WBKPPLPP',
  bankName: 'Santander Bank Polska S.A.',
  bankAddress: 'al. Jana Pawła II 17, 00-854 Warszawa',
  bankCountry: 'Polska',
  processingTime: '1-2 business days',
  activationNote: 'Your account will be activated immediately upon completing the purchase. If payment is not received within 4 business days, the service will be deactivated.',
}

export function getBankTransferTitle(clientCode: string, invoiceNumber?: string): string {
  return `Subscription ${clientCode}${invoiceNumber ? ` - Invoice ${invoiceNumber}` : ''}`
}

export function formatBankTransferInstructions(clientCode: string, invoiceNumber?: string, amount?: number): string {
  const title = getBankTransferTitle(clientCode, invoiceNumber)
  
  return `
Bank Transfer Instructions

Account Holder: ${BANK_TRANSFER_INFO.accountHolder}
Currency: ${BANK_TRANSFER_INFO.currency}
IBAN: ${BANK_TRANSFER_INFO.iban}
SWIFT: ${BANK_TRANSFER_INFO.swift}
Bank: ${BANK_TRANSFER_INFO.bankName}
Bank Address: ${BANK_TRANSFER_INFO.bankAddress}
Bank Country: ${BANK_TRANSFER_INFO.bankCountry}

${amount ? `Amount: €${amount.toFixed(2)}` : ''}
Transfer Title: ${title}

Important:
- Please use your client code (${clientCode}) in the transfer title for fastest payment allocation
- Transfer processing time: ${BANK_TRANSFER_INFO.processingTime}
- ${BANK_TRANSFER_INFO.activationNote}
  `.trim()
}

