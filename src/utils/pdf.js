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

export function generateDaybookPDF(daybookData) {
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

  // Daybook Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0) // Reset to black
  doc.text('Daybook', pageWidth / 2, yPos, { align: 'center' })
  yPos += 8
  doc.setFontSize(12)
  doc.text(`Date: ${daybookData.dateRange}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Add a decorative line
  doc.setDrawColor(0, 100, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Table header setup - adjusted column widths
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  const colWidths = {
    description: 90,  // Reduced from 120
    credit: 50,        // Increased from 35
    debit: 50          // Increased from 35
  }
  
  const colPositions = {
    description: margin,
    credit: margin + colWidths.description,
    debit: margin + colWidths.description + colWidths.credit
  }
  
  const maxRightEdge = pageWidth - margin
  // Ensure total width doesn't exceed page
  const totalWidth = colWidths.description + colWidths.credit + colWidths.debit
  if (totalWidth > (pageWidth - 2 * margin)) {
    // Adjust if needed - scale down proportionally
    const scale = (pageWidth - 2 * margin) / totalWidth
    colWidths.description = colWidths.description * scale
    colWidths.credit = colWidths.credit * scale
    colWidths.debit = colWidths.debit * scale
    // Recalculate positions
    colPositions.credit = margin + colWidths.description
    colPositions.debit = margin + colWidths.description + colWidths.credit
  }
  
  // Calculate label position (right edge of description column) for use in totals
  const labelX = colPositions.description + colWidths.description

  // Process each day
  daybookData.days.forEach((day, dayIndex) => {
    // Check if we need a new page
    if (yPos > 220 && dayIndex > 0) {
      doc.addPage()
      yPos = margin
    }

    // Day header
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setFillColor(227, 242, 253)
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F')
    const dayDate = new Date(day.date)
    const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    doc.text(dayLabel, margin + 5, yPos)
    yPos += 12

    // Opening Cash in Hand
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text(`Opening Cash in Hand: ₹${day.openingCashInHand.toFixed(2)}`, margin, yPos)
    yPos += 8

    // Table header
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F')
    
    doc.text('Party', colPositions.description, yPos)
    doc.setTextColor(0, 150, 0) // Green for credit
    doc.text('Credit', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
    doc.setTextColor(200, 0, 0) // Red for debit
    doc.text('Debit', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0) // Reset to black
    yPos += 8

    doc.setFont(undefined, 'normal')
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // Table rows for this day
    day.entries.forEach((entry, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = margin
        // Redraw header on new page
        doc.setFont(undefined, 'bold')
        doc.setFontSize(10)
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F')
        doc.text('Party', colPositions.description, yPos)
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

      // Add section separator
      // Purchase A/C Credit is part of Purchase section, Sales A/C Debit is part of Sales section
      const prevType = index > 0 ? day.entries[index - 1].type : null
      let sectionName = ''
      const showSeparator = 
        (entry.type === 'purchase' && prevType === 'cash_in_hand' && (sectionName = 'PURCHASE')) ||
        (entry.type === 'supply' && (prevType === 'purchase_ac' || prevType === 'purchase' || prevType === 'cash_in_hand') && (sectionName = 'SALES')) ||
        (entry.type === 'receipt' && prevType === 'sales_ac' && (sectionName = 'RECEIPTS')) ||
        (entry.type === 'payment' && prevType === 'receipt' && (sectionName = 'PAYMENTS')) ||
        (entry.type === 'expense' && prevType === 'payment' && (sectionName = 'EXPENSES'))

      if (showSeparator) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 6, 'F')
        doc.setFont(undefined, 'bold')
        doc.setFontSize(9)
        doc.text(sectionName, margin + 5, yPos)
        doc.setFont(undefined, 'normal')
        doc.setFontSize(10)
        yPos += 8
      }

      const description = doc.splitTextToSize(entry.description || '-', colWidths.description)
      const descHeight = description.length * 5

      doc.text(description, colPositions.description, yPos)
      
      // Set character spacing for amounts to reduce spacing
      const originalCharSpacing = doc.getCharSpace()
      doc.setCharSpace(-0.2) // Reduce letter spacing for amounts
      
      if (entry.credit > 0) {
        doc.setTextColor(0, 150, 0)
        doc.text(`₹${entry.credit.toFixed(2)}`, Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
        doc.setTextColor(0, 0, 0)
        doc.text('-', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
      } else if (entry.debit > 0) {
        doc.text('-', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
        doc.setTextColor(200, 0, 0)
        doc.text(`₹${entry.debit.toFixed(2)}`, Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
        doc.setTextColor(0, 0, 0)
      } else {
        doc.text('-', Math.min(colPositions.credit + colWidths.credit, maxRightEdge), yPos, { align: 'right' })
        doc.text('-', Math.min(colPositions.debit + colWidths.debit, maxRightEdge), yPos, { align: 'right' })
      }
      
      doc.setCharSpace(originalCharSpacing) // Reset character spacing
      
      yPos += Math.max(descHeight, 7)
    })

    // Day totals - ensure they fit on page
    if (yPos > 240) {
      doc.addPage()
      yPos = margin
    }
    
    yPos += 5
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.setFillColor(250, 250, 250)
    doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F')
    
    const originalCharSpacing = doc.getCharSpace()
    doc.setCharSpace(-0.2) // Reduce letter spacing for amounts
    
    // Position label at right edge of description column, align right
    const labelX = colPositions.description + colWidths.description
    doc.text('Day Total:', labelX, yPos, { align: 'right' })
    doc.setTextColor(0, 150, 0)
    doc.text(`₹${day.totalCredit.toFixed(2)}`, colPositions.credit + colWidths.credit, yPos, { align: 'right' })
    doc.setTextColor(200, 0, 0)
    doc.text(`₹${day.totalDebit.toFixed(2)}`, colPositions.debit + colWidths.debit, yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    doc.setCharSpace(originalCharSpacing)
    yPos += 12

    // Closing Cash in Hand for this day - ensure it fits on page
    if (yPos > 240) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFontSize(12)
    doc.setFillColor(230, 240, 255)
    doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F')
    
    doc.setCharSpace(-0.2) // Reduce letter spacing for amounts
    
    // Position label at right edge of description column, align right
    doc.text('Cash in Hand (End of Day):', labelX, yPos, { align: 'right' })
    
    if (day.closingCashInHand >= 0) {
      doc.setTextColor(0, 150, 0)
      doc.text(`₹${day.closingCashInHand.toFixed(2)}`, colPositions.credit + colWidths.credit, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      doc.text('-', colPositions.debit + colWidths.debit, yPos, { align: 'right' })
    } else {
      doc.text('-', colPositions.credit + colWidths.credit, yPos, { align: 'right' })
      doc.setTextColor(200, 0, 0)
      doc.text(`₹${Math.abs(day.closingCashInHand).toFixed(2)}`, colPositions.debit + colWidths.debit, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }
    
    doc.setCharSpace(originalCharSpacing) // Reset character spacing

    yPos += 15
  })

  // Overall totals if multiple days
  if (daybookData.days.length > 1) {
    if (yPos > 220) {
      doc.addPage()
      yPos = margin
    }

    yPos += 5
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    doc.setFont(undefined, 'bold')
    doc.setFontSize(12)
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F')
    
    const originalCharSpacing = doc.getCharSpace()
    doc.setCharSpace(-0.2) // Reduce letter spacing for amounts
    
    // Position label at right edge of description column, align right
    const labelX = colPositions.description + colWidths.description
    doc.text('Overall Total:', labelX, yPos, { align: 'right' })
    doc.setTextColor(0, 150, 0)
    doc.text(`₹${daybookData.totalCredit.toFixed(2)}`, colPositions.credit + colWidths.credit, yPos, { align: 'right' })
    doc.setTextColor(200, 0, 0)
    doc.text(`₹${daybookData.totalDebit.toFixed(2)}`, colPositions.debit + colWidths.debit, yPos, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    doc.setCharSpace(originalCharSpacing)
    yPos += 12

    // Final Cash in Hand - ensure it fits on page
    if (yPos > 240) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFontSize(14)
    doc.setFillColor(230, 240, 255)
    doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F')
    
    doc.setCharSpace(-0.2) // Reduce letter spacing for amounts
    
    // Position label at right edge of description column, align right
    doc.text('Final Cash in Hand:', labelX, yPos, { align: 'right' })
    
    if (daybookData.finalCashInHand >= 0) {
      doc.setTextColor(0, 150, 0)
      doc.text(`₹${daybookData.finalCashInHand.toFixed(2)}`, colPositions.credit + colWidths.credit, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      doc.text('-', colPositions.debit + colWidths.debit, yPos, { align: 'right' })
    } else {
      doc.text('-', colPositions.credit + colWidths.credit, yPos, { align: 'right' })
      doc.setTextColor(200, 0, 0)
      doc.text(`₹${Math.abs(daybookData.finalCashInHand).toFixed(2)}`, colPositions.debit + colWidths.debit, yPos, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }
    
    doc.setCharSpace(originalCharSpacing) // Reset character spacing
  }

  return doc
}
