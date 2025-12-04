import PDFDocument from 'pdfkit'
import { BANK_TRANSFER_INFO, getBankTransferTitle } from './bank-transfer-info'

interface OrderItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface OrderData {
  orderNumber: string
  orderDate: string
  clientName: string
  clientCode: string
  clientEmail: string
  items: OrderItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  dueDate: string
}

export function generateOrderPDF(orderData: OrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      // Colors - matching company branding
      const primaryColor = '#0052CC' // MAK Consulting blue
      const darkBlue = '#003d99'
      const gray = '#6B7280'
      const lightGray = '#F3F4F6'

      // Header with logo area
      doc.rect(0, 0, doc.page.width, 120)
      doc.fillColor(primaryColor)
      doc.fill()
      doc.fillColor('#FFFFFF')
      doc.fontSize(24)
      doc.font('Helvetica-Bold')
      doc.text('MAK CONSULTING', 50, 30, { align: 'left' })
      doc.fontSize(12)
      doc.font('Helvetica')
      doc.text('Supersender by MAK Consulting', 50, 55, { align: 'left' })
      doc.fontSize(10)
      doc.text('For Better Business Results', 50, 75, { align: 'left' })

      // Order title
      doc.fillColor('#000000')
      doc.fontSize(20)
      doc.font('Helvetica-Bold')
      doc.text('ORDER', 50, 140, { align: 'left' })

      // Order details section
      let yPos = 180

      // Order number and date
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(gray)
        .text('Order Number:', 50, yPos)
        .fillColor('#000000')
        .font('Helvetica')
        .text(orderData.orderNumber, 150, yPos)

      yPos += 20
      doc.font('Helvetica-Bold')
        .fillColor(gray)
        .text('Order Date:', 50, yPos)
        .fillColor('#000000')
        .font('Helvetica')
        .text(new Date(orderData.orderDate).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), 150, yPos)

      yPos += 20
      doc.font('Helvetica-Bold')
        .fillColor(gray)
        .text('Issue Date:', 50, yPos)
        .fillColor('#000000')
        .font('Helvetica')
        .text(new Date(orderData.orderDate).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), 150, yPos)

      // Client information
      yPos += 40
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(darkBlue)
        .text('Bill To:', 50, yPos)

      yPos += 20
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(orderData.clientName, 50, yPos)
        .text(`Client Code: ${orderData.clientCode}`, 50, yPos + 15)
        .text(orderData.clientEmail, 50, yPos + 30)

      // Items table
      yPos += 70
      const tableTop = yPos
      const itemHeight = 30
      const tableWidth = doc.page.width - 100

      // Table header
      doc.rect(50, tableTop, tableWidth, 30)
      doc.fillColor(primaryColor)
      doc.fill()
      doc.fillColor('#FFFFFF')
      doc.fontSize(10)
      doc.font('Helvetica-Bold')
      doc.text('Description', 60, tableTop + 10)
      doc.text('Quantity', 350, tableTop + 10, { width: 60, align: 'right' })
      doc.text('Unit Price', 420, tableTop + 10, { width: 80, align: 'right' })
      doc.text('Total', 510, tableTop + 10, { width: 80, align: 'right' })

      // Table rows
      yPos = tableTop + 30
      doc.fillColor('#000000')
        .font('Helvetica')

      orderData.items.forEach((item, index) => {
        const rowY = yPos + (index * itemHeight)
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, rowY, tableWidth, itemHeight)
          doc.fillColor(lightGray)
          doc.fill()
        }

        doc.fillColor('#000000')
        doc.fontSize(9)
        doc.text(item.description, 60, rowY + 10, { width: 280 })
        doc.text(item.quantity.toString(), 350, rowY + 10, { width: 60, align: 'right' })
        doc.text(`${orderData.currency} ${item.unitPrice.toFixed(2)}`, 420, rowY + 10, { width: 80, align: 'right' })
        doc.text(`${orderData.currency} ${item.total.toFixed(2)}`, 510, rowY + 10, { width: 80, align: 'right' })
      })

      // Totals section
      const totalsY = yPos + (orderData.items.length * itemHeight) + 20
      const totalsWidth = 200
      const totalsX = doc.page.width - totalsWidth - 50

      doc.rect(totalsX, totalsY, totalsWidth, 100)
      doc.strokeColor(gray)
      doc.lineWidth(1)
      doc.stroke()

      let currentY = totalsY + 15

      doc.fontSize(10)
      doc.font('Helvetica')
      doc.fillColor('#000000')
      doc.text('Subtotal:', totalsX + 10, currentY, { width: 100 })
      doc.text(`${orderData.currency} ${orderData.subtotal.toFixed(2)}`, totalsX + 110, currentY, { width: 80, align: 'right' })

      currentY += 20
      doc.text(`VAT (${(orderData.vatRate * 100).toFixed(0)}%):`, totalsX + 10, currentY, { width: 100 })
      doc.text(`${orderData.currency} ${orderData.vatAmount.toFixed(2)}`, totalsX + 110, currentY, { width: 80, align: 'right' })

      currentY += 25
      doc.font('Helvetica-Bold')
      doc.fontSize(12)
      doc.fillColor(darkBlue)
      doc.text('Total:', totalsX + 10, currentY, { width: 100 })
      doc.text(`${orderData.currency} ${orderData.total.toFixed(2)}`, totalsX + 110, currentY, { width: 80, align: 'right' })

      // Payment information
      const paymentY = totalsY + 120
      doc.fontSize(12)
      doc.font('Helvetica-Bold')
      doc.fillColor(darkBlue)
      doc.text('Payment Information', 50, paymentY)

      const paymentInfoY = paymentY + 25
      doc.fontSize(10)
      doc.font('Helvetica')
      doc.fillColor('#000000')
      doc.text(`Account Holder: ${BANK_TRANSFER_INFO.accountHolder}`, 50, paymentInfoY)
      doc.text(`Currency: ${BANK_TRANSFER_INFO.currency}`, 50, paymentInfoY + 15)
      doc.text(`IBAN: ${BANK_TRANSFER_INFO.iban}`, 50, paymentInfoY + 30)
      doc.text(`SWIFT: ${BANK_TRANSFER_INFO.swift}`, 50, paymentInfoY + 45)
      doc.text(`Bank: ${BANK_TRANSFER_INFO.bankName}`, 50, paymentInfoY + 60)
      doc.text(`Bank Address: ${BANK_TRANSFER_INFO.bankAddress}`, 50, paymentInfoY + 75)
      doc.text(`Transfer Title: ${getBankTransferTitle(orderData.clientCode, orderData.orderNumber)}`, 50, paymentInfoY + 90)

      // Footer
      const footerY = doc.page.height - 50
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(gray)
        .text('This is an order document. Invoice will be generated separately and sent via email.', 50, footerY, {
          align: 'center',
          width: doc.page.width - 100
        })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

