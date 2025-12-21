import { useState, useEffect } from 'react'
import React from 'react'
import { supabase } from '../config/supabase'
import { generateDaybookPDF } from '../utils/pdf'

export default function Daybook() {
  const [dateFilter, setDateFilter] = useState({ 
    from: new Date().toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  })
  const [daybookData, setDaybookData] = useState([])
  const [loading, setLoading] = useState(false)
  const [cashInHand, setCashInHand] = useState(0)
  const [totalCredit, setTotalCredit] = useState(0)
  const [totalDebit, setTotalDebit] = useState(0)
  const [finalCashInHand, setFinalCashInHand] = useState(0)

  useEffect(() => {
    if (dateFilter.from && dateFilter.to) {
      generateDaybook()
    }
  }, [dateFilter])

  async function generateDaybook() {
    setLoading(true)
    try {
      // Generate list of dates in range
      const dates = []
      const fromDate = new Date(dateFilter.from)
      const toDate = new Date(dateFilter.to)
      
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0])
      }

      const daybookByDate = []

      // Process each day separately
      let previousDayClosingCash = 0
      
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i]
        const dayEntries = []
        
        // Calculate opening cash in hand for this day
        let openingCashInHand
        if (i === 0) {
          // First day: calculate from all transactions before this date
          openingCashInHand = await calculateOpeningCashInHand(date)
        } else {
          // Subsequent days: use closing cash from previous day
          openingCashInHand = previousDayClosingCash
        }
        
        dayEntries.push({
          type: 'cash_in_hand',
          description: 'Cash in Hand',
          credit: openingCashInHand > 0 ? openingCashInHand : 0,
          debit: openingCashInHand < 0 ? Math.abs(openingCashInHand) : 0,
          date: date
        })

        // Get purchase transactions for this day
        const purchaseTotal = await getPurchaseTransactions(date, date, dayEntries)
        
        // Add Purchase A/C Credit entry (part of Purchase section, not separate)
        if (purchaseTotal > 0) {
          dayEntries.push({
            type: 'purchase_ac',
            description: 'Purchase A/C Credit',
            credit: purchaseTotal,
            debit: 0,
            date: date
          })
        }

        // Get supply transactions for this day
        const supplyTotal = await getSupplyTransactions(date, date, dayEntries)
        
        // Add Sales A/C Debit entry (part of Sales section, not separate)
        if (supplyTotal > 0) {
          dayEntries.push({
            type: 'sales_ac',
            description: 'Sales A/C Debit',
            credit: 0,
            debit: supplyTotal,
            date: date
          })
        }

        // Get receipts for this day
        await getReceipts(date, date, dayEntries)

        // Get payments for this day
        await getPayments(date, date, dayEntries)

        // Get expenses for this day
        await getExpenses(date, date, dayEntries)

        // Calculate totals for this day
        let dayCredit = 0
        let dayDebit = 0
        dayEntries.forEach(entry => {
          dayCredit += entry.credit || 0
          dayDebit += entry.debit || 0
        })

        const closingCashInHand = dayCredit - dayDebit
        previousDayClosingCash = closingCashInHand // Store for next day

        daybookByDate.push({
          date: date,
          entries: dayEntries,
          openingCashInHand: openingCashInHand,
          totalCredit: dayCredit,
          totalDebit: dayDebit,
          closingCashInHand: closingCashInHand
        })
      }

      // Calculate overall totals
      let totalCredit = 0
      let totalDebit = 0
      daybookByDate.forEach(day => {
        totalCredit += day.totalCredit
        totalDebit += day.totalDebit
      })

      setCashInHand(daybookByDate[0]?.openingCashInHand || 0)
      setTotalCredit(totalCredit)
      setTotalDebit(totalDebit)
      setFinalCashInHand(daybookByDate[daybookByDate.length - 1]?.closingCashInHand || 0)
      
      setDaybookData(daybookByDate)
    } catch (err) {
      console.error('Failed to generate daybook', err)
    } finally {
      setLoading(false)
    }
  }

  async function calculateOpeningCashInHand(beforeDate) {
    try {
      let totalCredit = 0
      let totalDebit = 0

      // Cash in hand should only include actual cash transactions:
      // Receipts (money received), Payments (money paid), Expenses (money paid)
      // Purchase and Supply transactions are just accounting entries that balance out

      // Get all receipts before date (actual money received)
      const { data: receipts } = await supabase
        .from('receipts')
        .select('amount')
        .lt('date', beforeDate)

      if (receipts) {
        receipts.forEach(receipt => {
          totalCredit += parseFloat(receipt.amount) || 0
        })
      }

      // Get all payments before date (actual money paid)
      const { data: payments } = await supabase
        .from('payments')
        .select('paid_amount')
        .lt('date', beforeDate)

      if (payments) {
        payments.forEach(payment => {
          totalDebit += parseFloat(payment.paid_amount) || 0
        })
      }

      // Get all expenses before date (actual money paid)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .lt('date', beforeDate)

      if (expenses) {
        expenses.forEach(expense => {
          totalDebit += parseFloat(expense.amount) || 0
        })
      }

      return totalCredit - totalDebit
    } catch (err) {
      console.error('Failed to calculate opening cash in hand', err)
      return 0
    }
  }

  async function getPurchaseTransactions(fromDate, toDate, entries) {
    try {
      const { data: purchases } = await supabase
        .from('purchase_transactions')
        .select('*, parties:party_id (name)')
        .gte('created_at', fromDate + 'T00:00:00')
        .lte('created_at', toDate + 'T23:59:59')
        .order('created_at', { ascending: true })

      if (!purchases || purchases.length === 0) return 0

      let totalDebit = 0

      // Get all purchase items for these transactions
      const purchaseIds = purchases.map(p => p.id)
      const { data: purchaseItems } = await supabase
        .from('purchase_transaction_items')
        .select('*')
        .in('purchase_transaction_id', purchaseIds)

      // Calculate total for each transaction
      purchases.forEach(purchase => {
        const items = purchaseItems?.filter(item => item.purchase_transaction_id === purchase.id) || []
        let transactionTotal = 0
        
        items.forEach(item => {
          const amount = item.weight_kg * item.price_per_kg
          const gstAmount = purchase.is_built && item.gst_percent ? (amount * item.gst_percent) / 100 : 0
          transactionTotal += amount + gstAmount
        })

        if (transactionTotal > 0) {
          totalDebit += transactionTotal
          const transactionDate = new Date(purchase.created_at).toISOString().split('T')[0]
          entries.push({
            type: 'purchase',
            description: `${purchase.parties?.name || 'Unknown'} (${purchase.purchase_voucher_number})`,
            credit: 0,
            debit: transactionTotal,
            voucher: purchase.purchase_voucher_number,
            date: transactionDate
          })
        }
      })

      return totalDebit
    } catch (err) {
      console.error('Failed to get purchase transactions', err)
      return 0
    }
  }

  async function getSupplyTransactions(fromDate, toDate, entries) {
    try {
      const { data: supplies } = await supabase
        .from('supply_transactions')
        .select('*, parties:party_id (name), purchase_transactions:purchase_transaction_id (purchase_voucher_number)')
        .gte('created_at', fromDate + 'T00:00:00')
        .lte('created_at', toDate + 'T23:59:59')
        .order('created_at', { ascending: true })

      if (!supplies || supplies.length === 0) return 0

      let totalCredit = 0

      // Get all supply items for these transactions
      const supplyIds = supplies.map(s => s.id)
      const { data: supplyItems } = await supabase
        .from('supply_transaction_items')
        .select('*')
        .in('supply_transaction_id', supplyIds)

      // Calculate total for each transaction
      supplies.forEach(supply => {
        const items = supplyItems?.filter(item => item.supply_transaction_id === supply.id) || []
        let transactionTotal = 0
        
        items.forEach(item => {
          const amount = item.weight_kg * item.price_per_kg
          const gstAmount = supply.is_built && item.gst_percent ? (amount * item.gst_percent) / 100 : 0
          transactionTotal += amount + gstAmount
        })

        if (transactionTotal > 0) {
          totalCredit += transactionTotal
          const voucher = supply.purchase_transactions?.purchase_voucher_number || 'N/A'
          const transactionDate = new Date(supply.created_at).toISOString().split('T')[0]
          entries.push({
            type: 'supply',
            description: `${supply.parties?.name || 'Unknown'} (${voucher})`,
            credit: transactionTotal,
            debit: 0,
            voucher: voucher,
            date: transactionDate
          })
        }
      })

      return totalCredit
    } catch (err) {
      console.error('Failed to get supply transactions', err)
      return 0
    }
  }

  async function getReceipts(fromDate, toDate, entries) {
    try {
      const { data: receipts } = await supabase
        .from('receipts')
        .select('*, parties:party_id (name)')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true })

      if (receipts) {
        receipts.forEach(receipt => {
          entries.push({
            type: 'receipt',
            description: `Receipt - ${receipt.parties?.name || 'Unknown'} (${receipt.receipt_number})`,
            credit: parseFloat(receipt.amount) || 0,
            debit: 0,
            voucher: receipt.receipt_number,
            date: receipt.date
          })
        })
      }
    } catch (err) {
      console.error('Failed to get receipts', err)
    }
  }

  async function getPayments(fromDate, toDate, entries) {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*, parties:party_id (name)')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true })

      if (payments) {
        payments.forEach(payment => {
          entries.push({
            type: 'payment',
            description: `Payment - ${payment.parties?.name || 'Unknown'} (${payment.mode})`,
            credit: 0,
            debit: parseFloat(payment.paid_amount) || 0,
            voucher: '-',
            date: payment.date
          })
        })
      }
    } catch (err) {
      console.error('Failed to get payments', err)
    }
  }

  async function getExpenses(fromDate, toDate, entries) {
    try {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true })

      if (expenses) {
        expenses.forEach(expense => {
          entries.push({
            type: 'expense',
            description: `Expense - ${expense.pay_to} (${expense.voucher_number})`,
            credit: 0,
            debit: parseFloat(expense.amount) || 0,
            voucher: expense.voucher_number,
            date: expense.date
          })
        })
      }
    } catch (err) {
      console.error('Failed to get expenses', err)
    }
  }

  function handlePrint() {
    const pdfData = {
      title: 'Daybook',
      dateRange: `${dateFilter.from}${dateFilter.from !== dateFilter.to ? ` to ${dateFilter.to}` : ''}`,
      days: daybookData,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      finalCashInHand: finalCashInHand
    }

    const doc = generateDaybookPDF(pdfData)
    const fileName = `Daybook_${dateFilter.from}${dateFilter.from !== dateFilter.to ? `_to_${dateFilter.to}` : ''}.pdf`
    
    // Generate PDF blob for sharing
    const pdfBlob = doc.output('blob')
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })
    
    // Try to share the PDF file (works with WhatsApp on mobile)
    if (navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [file] })) {
        navigator.share({
          title: 'Daybook',
          text: `Daybook for ${pdfData.dateRange}`,
          files: [file]
        }).catch(err => {
          console.log('Share failed, downloading instead:', err)
          doc.save(fileName)
        })
      } else {
        // Fallback to download
        doc.save(fileName)
      }
    } else {
      // Fallback to download
      doc.save(fileName)
    }
  }

  return (
    <div>
      <h1>Daybook</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="date_from">From Date</label>
            <input
              type="date"
              id="date_from"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="date_to">To Date</label>
            <input
              type="date"
              id="date_to"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && daybookData.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2>Daybook - {dateFilter.from}{dateFilter.from !== dateFilter.to ? ` to ${dateFilter.to}` : ''}</h2>
            <button className="btn-secondary" onClick={handlePrint}>
              Share
            </button>
          </div>

          {daybookData.map((day, dayIndex) => (
            <div key={dayIndex} style={{ marginBottom: dayIndex < daybookData.length - 1 ? '2rem' : '0' }}>
              <h3 style={{ 
                marginBottom: '1rem', 
                padding: '0.5rem', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '4px',
                borderLeft: '4px solid #1976d2'
              }}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Party</th>
                      <th style={{ color: '#4CAF50', textAlign: 'right' }}>Credit</th>
                      <th style={{ color: '#f44336', textAlign: 'right' }}>Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.entries.map((entry, index) => {
                      // Add section separators - show before first entry of each section
                      // Purchase A/C Credit is part of Purchase section, Sales A/C Debit is part of Sales section
                      const prevType = index > 0 ? day.entries[index - 1].type : null
                      let sectionName = ''
                      const showSeparator = 
                        (entry.type === 'purchase' && prevType === 'cash_in_hand' && (sectionName = 'PURCHASE')) ||
                        (entry.type === 'supply' && (prevType === 'purchase_ac' || prevType === 'purchase' || prevType === 'cash_in_hand') && (sectionName = 'SALES')) ||
                        (entry.type === 'receipt' && prevType === 'sales_ac' && (sectionName = 'RECEIPTS')) ||
                        (entry.type === 'payment' && prevType === 'receipt' && (sectionName = 'PAYMENTS')) ||
                        (entry.type === 'expense' && prevType === 'payment' && (sectionName = 'EXPENSES'))

                      return (
                        <React.Fragment key={index}>
                          {showSeparator && (
                            <tr>
                              <td colSpan="3" style={{ 
                                padding: '0.5rem', 
                                backgroundColor: '#f5f5f5', 
                                fontWeight: 'bold',
                                borderTop: '2px solid #ddd'
                              }}>
                                {sectionName}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td>{entry.description}</td>
                            <td style={{ 
                              textAlign: 'right', 
                              fontWeight: 'bold',
                              color: entry.credit > 0 ? '#4CAF50' : 'transparent'
                            }}>
                              {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              textAlign: 'right', 
                              fontWeight: 'bold',
                              color: entry.debit > 0 ? '#f44336' : 'transparent'
                            }}>
                              {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '1.1rem' }}>
                      <td style={{ textAlign: 'right' }}>Day Total:</td>
                      <td style={{ 
                        textAlign: 'right',
                        color: '#4CAF50'
                      }}>
                        ₹{day.totalCredit.toFixed(2)}
                      </td>
                      <td style={{ 
                        textAlign: 'right',
                        color: '#f44336'
                      }}>
                        ₹{day.totalDebit.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', fontSize: '1.1rem' }}>
                      <td style={{ textAlign: 'right' }}>Cash in Hand (End of Day):</td>
                      <td style={{ 
                        textAlign: 'right',
                        color: day.closingCashInHand >= 0 ? '#4CAF50' : 'transparent'
                      }}>
                        {day.closingCashInHand >= 0 ? `₹${day.closingCashInHand.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ 
                        textAlign: 'right',
                        color: day.closingCashInHand < 0 ? '#f44336' : 'transparent'
                      }}>
                        {day.closingCashInHand < 0 ? `₹${Math.abs(day.closingCashInHand).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {daybookData.length > 1 && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <td style={{ textAlign: 'right' }}>Overall Total:</td>
                    <td style={{ textAlign: 'right', color: '#4CAF50' }}>
                      ₹{totalCredit.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#f44336' }}>
                      ₹{totalDebit.toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', fontSize: '1.2rem' }}>
                    <td style={{ textAlign: 'right' }}>Final Cash in Hand:</td>
                    <td style={{ 
                      textAlign: 'right',
                      color: finalCashInHand >= 0 ? '#4CAF50' : 'transparent'
                    }}>
                      {finalCashInHand >= 0 ? `₹${finalCashInHand.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ 
                      textAlign: 'right',
                      color: finalCashInHand < 0 ? '#f44336' : 'transparent'
                    }}>
                      {finalCashInHand < 0 ? `₹${Math.abs(finalCashInHand).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && dateFilter.from && dateFilter.to && daybookData.length === 0 && (
        <div className="card">
          <div className="empty-state">No data found for the selected date range</div>
        </div>
      )}
    </div>
  )
}
