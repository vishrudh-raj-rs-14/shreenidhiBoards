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

export function generateReportPDF(reportData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text(reportData.title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Party: ${reportData.partyName}`, margin, yPos)
  yPos += 7
  doc.text(`Date Range: ${reportData.dateRange}`, margin, yPos)
  yPos += 7
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
  yPos += 15

  // Table header
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  const colWidths = {
    date: 35,
    description: 80,
    voucher: 30,
    credit: 30,
    debit: 30
  }
  let xPos = margin
  
  doc.text('Date', xPos, yPos)
  xPos += colWidths.date
  doc.text('Description', xPos, yPos)
  xPos += colWidths.description
  doc.text('Voucher', xPos, yPos)
  xPos += colWidths.voucher
  doc.setTextColor(0, 150, 0) // Green for credit
  doc.text('Credit', xPos, yPos, { align: 'right' })
  xPos += colWidths.credit
  doc.setTextColor(200, 0, 0) // Red for debit
  doc.text('Debit', xPos, yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 7

  doc.setFont(undefined, 'normal')
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table rows
  reportData.items.forEach((item) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
      // Redraw header
      doc.setFont(undefined, 'bold')
      xPos = margin
      doc.text('Date', xPos, yPos)
      xPos += colWidths.date
      doc.text('Description', xPos, yPos)
      xPos += colWidths.description
      doc.text('Voucher', xPos, yPos)
      xPos += colWidths.voucher
      doc.setTextColor(0, 150, 0)
      doc.text('Credit', xPos, yPos, { align: 'right' })
      xPos += colWidths.credit
      doc.setTextColor(200, 0, 0)
      doc.text('Debit', xPos, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      yPos += 7
      doc.setFont(undefined, 'normal')
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 5
    }

    const date = new Date(item.date).toLocaleDateString()
    const description = doc.splitTextToSize(item.description || '-', colWidths.description)
    const voucher = item.voucher || '-'

    xPos = margin
    doc.text(date, xPos, yPos)
    xPos += colWidths.date
    
    // Handle multi-line description
    const descHeight = description.length * 5
    doc.text(description, xPos, yPos)
    xPos += colWidths.description
    doc.text(voucher, xPos, yPos)
    xPos += colWidths.voucher
    
    if (item.type === 'credit') {
      doc.setTextColor(0, 150, 0)
      doc.text(`₹${item.amount.toFixed(2)}`, xPos, yPos, { align: 'right' })
      xPos += colWidths.credit
      doc.setTextColor(0, 0, 0)
      doc.text('-', xPos, yPos, { align: 'right' })
    } else {
      doc.text('-', xPos, yPos, { align: 'right' })
      xPos += colWidths.credit
      doc.setTextColor(200, 0, 0)
      doc.text(`₹${item.amount.toFixed(2)}`, xPos, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }
    
    yPos += Math.max(descHeight, 7)
  })

  yPos += 5
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Balance row
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  xPos = margin + colWidths.date + colWidths.description + colWidths.voucher
  
  if (reportData.balance >= 0) {
    doc.setTextColor(0, 150, 0)
    doc.text('Balance:', xPos, yPos, { align: 'right' })
    xPos += colWidths.credit
    doc.text(`₹${reportData.balance.toFixed(2)}`, xPos, yPos, { align: 'right' })
    xPos += colWidths.debit
    doc.setTextColor(0, 0, 0)
    doc.text('-', xPos, yPos, { align: 'right' })
  } else {
    doc.text('Balance:', xPos, yPos, { align: 'right' })
    xPos += colWidths.credit
    doc.text('-', xPos, yPos, { align: 'right' })
    xPos += colWidths.debit
    doc.setTextColor(200, 0, 0)
    doc.text(`₹${Math.abs(reportData.balance).toFixed(2)}`, xPos, yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  return doc
}
