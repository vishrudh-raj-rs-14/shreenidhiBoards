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

  // Company Header
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(0, 100, 200) // Blue color for company name
  doc.text('Shreenidhi Boards', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Report Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0) // Reset to black
  doc.text(reportData.title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Add a decorative line
  doc.setDrawColor(0, 100, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Report Details
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Party: ${reportData.partyName}`, margin, yPos)
  yPos += 7
  doc.text(`Date Range: ${reportData.dateRange}`, margin, yPos)
  yPos += 7
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100) // Gray for generated date
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 12

  // Table header with better styling
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  // Adjusted column widths to fit on page (A4 width is ~210mm, with margins ~170mm available)
  // Using smaller widths to ensure all columns fit comfortably
  const colWidths = {
    date: 24,
    description: 52,
    voucher: 18,
    credit: 28,
    debit: 28
  }
  
  // Calculate column positions for proper alignment
  const colPositions = {
    date: margin,
    description: margin + colWidths.date,
    voucher: margin + colWidths.date + colWidths.description,
    credit: margin + colWidths.date + colWidths.description + colWidths.voucher,
    debit: margin + colWidths.date + colWidths.description + colWidths.voucher + colWidths.credit
  }
  
  // Ensure the rightmost column doesn't exceed page width
  const maxRightEdge = pageWidth - margin
  
  // Header background (light gray)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F')
  
  doc.text('Date', colPositions.date, yPos)
  doc.text('Description', colPositions.description, yPos)
  doc.text('Voucher', colPositions.voucher, yPos)
  doc.setTextColor(0, 150, 0) // Green for credit
  // Right-align credit column - position at right edge of column
  doc.text('Credit', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
  doc.setTextColor(200, 0, 0) // Red for debit
  // Right-align debit column - position at right edge of column
  doc.text('Debit', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0) // Reset to black
  yPos += 8

  doc.setFont(undefined, 'normal')
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table rows
  reportData.items.forEach((item) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
      // Redraw header on new page
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F')
      doc.text('Date', colPositions.date, yPos)
      doc.text('Description', colPositions.description, yPos)
      doc.text('Voucher', colPositions.voucher, yPos)
      doc.setTextColor(0, 150, 0)
      doc.text('Credit', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
      doc.setTextColor(200, 0, 0)
      doc.text('Debit', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      yPos += 8
      doc.setFont(undefined, 'normal')
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 5
    }

    const date = new Date(item.date).toLocaleDateString()
    const description = doc.splitTextToSize(item.description || '-', colWidths.description)
    const voucher = item.voucher || '-'

    doc.text(date, colPositions.date, yPos)
    
    // Handle multi-line description
    const descHeight = description.length * 5
    doc.text(description, colPositions.description, yPos)
    doc.text(voucher, colPositions.voucher, yPos)
    
    if (item.type === 'credit') {
      doc.setTextColor(0, 150, 0)
      doc.text(`₹${item.amount.toFixed(2)}`, Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      doc.text('-', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
    } else {
      doc.text('-', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
      doc.setTextColor(200, 0, 0)
      doc.text(`₹${item.amount.toFixed(2)}`, Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }
    
    yPos += Math.max(descHeight, 7)
  })

  // Double line before balance
  yPos += 5
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 2
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 8

  // Balance row with prominent styling
  doc.setFont(undefined, 'bold')
  doc.setFontSize(14)
  
  // Background for balance row
  doc.setFillColor(250, 250, 250)
  doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F')
  
  // Balance label
  const balanceLabelX = colPositions.voucher + colWidths.voucher
  doc.text('Final Balance:', balanceLabelX, yPos, { align: 'right' })
  
  if (reportData.balance >= 0) {
    doc.setTextColor(0, 150, 0) // Green for positive balance
    doc.text(`₹${reportData.balance.toFixed(2)}`, Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    doc.text('-', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
  } else {
    doc.text('-', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
    doc.setTextColor(200, 0, 0) // Red for negative balance
    doc.text(`₹${Math.abs(reportData.balance).toFixed(2)}`, Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  return doc
}
