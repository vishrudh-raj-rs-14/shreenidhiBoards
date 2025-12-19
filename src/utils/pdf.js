import jsPDF from 'jspdf'

export function generatePurchaseInvoice(invoiceData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.text('PURCHASE INVOICE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Voucher Number: ${invoiceData.voucherNumber}`, margin, yPos)
  yPos += 7
  doc.text(`Party: ${invoiceData.partyName}`, margin, yPos)
  yPos += 7
  if (invoiceData.vehicleNumber) {
    doc.text(`Vehicle Number: ${invoiceData.vehicleNumber}`, margin, yPos)
    yPos += 7
  }
  doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, margin, yPos)
  yPos += 15

  // Table header
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Product', margin, yPos)
  doc.text('Weight (kg)', margin + 60, yPos)
  doc.text('Rate', margin + 100, yPos)
  doc.text('Amount', margin + 130, yPos)
  if (invoiceData.isBuilt) {
    doc.text('GST', margin + 160, yPos)
    doc.text('Total', margin + 180, yPos)
  }
  yPos += 7

  doc.setFont(undefined, 'normal')
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table rows
  let grandTotal = 0
  invoiceData.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
    }

    const amount = item.weight * item.price
    let itemTotal = amount
    let gstAmount = 0

    if (invoiceData.isBuilt && item.gst) {
      gstAmount = (amount * item.gst) / 100
      itemTotal = amount + gstAmount
    }

    grandTotal += itemTotal

    doc.text(item.productName, margin, yPos)
    doc.text(item.weight.toString(), margin + 60, yPos)
    doc.text(item.price.toString(), margin + 100, yPos)
    doc.text(amount.toFixed(2), margin + 130, yPos)
    if (invoiceData.isBuilt) {
      doc.text(gstAmount > 0 ? `${item.gst}%` : '-', margin + 160, yPos)
      doc.text(itemTotal.toFixed(2), margin + 180, yPos)
    }
    yPos += 7
  })

  yPos += 5
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })

  return doc
}

export function generateSupplyInvoice(invoiceData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.text('SUPPLY INVOICE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Purchase Voucher: ${invoiceData.purchaseVoucherNumber}`, margin, yPos)
  yPos += 7
  doc.text(`Party: ${invoiceData.partyName}`, margin, yPos)
  yPos += 7
  doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, margin, yPos)
  yPos += 15

  // Table header
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Product', margin, yPos)
  doc.text('Weight (kg)', margin + 60, yPos)
  doc.text('Rate', margin + 100, yPos)
  doc.text('Amount', margin + 130, yPos)
  if (invoiceData.isBuilt) {
    doc.text('GST', margin + 160, yPos)
    doc.text('Total', margin + 180, yPos)
  }
  yPos += 7

  doc.setFont(undefined, 'normal')
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table rows
  let grandTotal = 0
  invoiceData.items.forEach((item) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
    }

    const amount = item.weight * item.price
    let itemTotal = amount
    let gstAmount = 0

    if (invoiceData.isBuilt && item.gst) {
      gstAmount = (amount * item.gst) / 100
      itemTotal = amount + gstAmount
    }

    grandTotal += itemTotal

    doc.text(item.productName, margin, yPos)
    doc.text(item.weight.toString(), margin + 60, yPos)
    doc.text(item.price.toString(), margin + 100, yPos)
    doc.text(amount.toFixed(2), margin + 130, yPos)
    if (invoiceData.isBuilt) {
      doc.text(gstAmount > 0 ? `${item.gst}%` : '-', margin + 160, yPos)
      doc.text(itemTotal.toFixed(2), margin + 180, yPos)
    }
    yPos += 7
  })

  yPos += 5
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })

  return doc
}
