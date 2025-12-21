import { useState, useEffect } from 'react'
import React from 'react'
import { supabase } from '../config/supabase'
import { generateReportPDF } from '../utils/pdf'

export default function Reports() {
  const [reportType, setReportType] = useState('purchase') // 'purchase' or 'sales'
  const [parties, setParties] = useState([])
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const [expandedTransactions, setExpandedTransactions] = useState(new Set())

  useEffect(() => {
    fetchParties()
  }, [reportType])

  useEffect(() => {
    if (selectedPartyId) {
      generateReport()
    } else {
      setReportData([])
    }
  }, [selectedPartyId, reportType, dateFilter])

  async function fetchParties() {
    try {
      const grade = reportType === 'purchase' ? 'purchase_party' : 'supply_party'
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('grade', grade)
        .order('name')

      if (error) throw error
      setParties(data || [])
    } catch (err) {
      console.error('Failed to fetch parties', err)
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    if (!selectedPartyId) return

    setGenerating(true)
    try {
      if (reportType === 'purchase') {
        await generatePurchaseReport()
      } else {
        await generateSalesReport()
      }
    } catch (err) {
      console.error('Failed to generate report', err)
    } finally {
      setGenerating(false)
    }
  }

  async function generatePurchaseReport() {
    const reportItems = []

    // Get purchase transactions (Credit)
    let purchaseQuery = supabase
      .from('purchase_transactions')
      .select('*')
      .eq('party_id', selectedPartyId)

    if (dateFilter.from) {
      purchaseQuery = purchaseQuery.gte('created_at', dateFilter.from)
    }
    if (dateFilter.to) {
      purchaseQuery = purchaseQuery.lte('created_at', dateFilter.to + 'T23:59:59')
    }

    const { data: purchases, error: purchaseError } = await purchaseQuery.order('created_at', { ascending: false })

    if (purchaseError) throw purchaseError

    // Get all purchase items and products
    const purchaseIds = purchases?.map(p => p.id) || []
    let itemsQuery = supabase
      .from('purchase_transaction_items')
      .select('*')
      .in('purchase_transaction_id', purchaseIds)

    const { data: allItems, error: itemsError } = await itemsQuery
    if (itemsError) throw itemsError

    const { data: allProducts } = await supabase.from('products').select('*')
    const productsMap = new Map((allProducts || []).map(p => [p.id, p]))

    // Add purchase transactions (transaction-wise, not item-wise)
    purchases?.forEach(purchase => {
      const purchaseItems = allItems?.filter(item => item.purchase_transaction_id === purchase.id) || []
      let transactionTotal = 0
      const items = []

      purchaseItems.forEach(item => {
        const product = productsMap.get(item.product_id)
        const amount = item.weight_kg * item.price_per_kg
        const gstAmount = purchase.is_built && item.gst_percent ? (amount * item.gst_percent) / 100 : 0
        const total = amount + gstAmount
        transactionTotal += total
        
        items.push({
          productName: product?.product_name || 'N/A',
          weight: item.weight_kg,
          price: item.price_per_kg,
          amount: amount,
          gst: gstAmount,
          total: total
        })
      })

      if (transactionTotal > 0) {
        reportItems.push({
          date: purchase.created_at,
          type: 'credit',
          description: `Purchase (Voucher: ${purchase.purchase_voucher_number})`,
          amount: transactionTotal,
          voucher: purchase.purchase_voucher_number,
          transactionId: purchase.id,
          items: items, // Store items for expansion
          isTransaction: true
        })
      }
    })

    // Get payments (Debit)
    let paymentQuery = supabase
      .from('payments')
      .select('*')
      .eq('party_id', selectedPartyId)

    if (dateFilter.from) {
      paymentQuery = paymentQuery.gte('date', dateFilter.from)
    }
    if (dateFilter.to) {
      paymentQuery = paymentQuery.lte('date', dateFilter.to)
    }

    const { data: payments, error: paymentError } = await paymentQuery.order('date', { ascending: false })

    if (paymentError) throw paymentError

    // Add payments as debit
    payments?.forEach(payment => {
      reportItems.push({
        date: payment.date,
        type: 'debit',
        description: `Payment - ${payment.mode}${payment.description ? `: ${payment.description}` : ''}`,
        amount: payment.paid_amount,
        voucher: '-',
        isTransaction: false
      })
    })

    // Sort by date
    reportItems.sort((a, b) => new Date(a.date) - new Date(b.date))

    setReportData(reportItems)
  }

  async function generateSalesReport() {
    const reportItems = []

    // Get supply transactions (Debit)
    let supplyQuery = supabase
      .from('supply_transactions')
      .select('*')
      .eq('party_id', selectedPartyId)

    if (dateFilter.from) {
      supplyQuery = supplyQuery.gte('created_at', dateFilter.from)
    }
    if (dateFilter.to) {
      supplyQuery = supplyQuery.lte('created_at', dateFilter.to + 'T23:59:59')
    }

    const { data: supplies, error: supplyError } = await supplyQuery.order('created_at', { ascending: false })

    if (supplyError) throw supplyError

    // Get all supply items, purchase transactions, and products
    const supplyIds = supplies?.map(s => s.id) || []
    const purchaseIds = supplies?.map(s => s.purchase_transaction_id) || []
    
    const { data: allSupplyItems } = await supabase
      .from('supply_transaction_items')
      .select('*')
      .in('supply_transaction_id', supplyIds)

    const { data: purchaseTransactions } = await supabase
      .from('purchase_transactions')
      .select('id, purchase_voucher_number')
      .in('id', purchaseIds)

    const { data: allProducts } = await supabase.from('products').select('*')
    const productsMap = new Map((allProducts || []).map(p => [p.id, p]))
    const purchaseMap = new Map((purchaseTransactions || []).map(p => [p.id, p]))

    // Add supply transactions (transaction-wise, not item-wise)
    supplies?.forEach(supply => {
      const supplyItems = allSupplyItems?.filter(item => item.supply_transaction_id === supply.id) || []
      const purchase = purchaseMap.get(supply.purchase_transaction_id)
      let transactionTotal = 0
      const items = []

      supplyItems.forEach(item => {
        const product = productsMap.get(item.product_id)
        const amount = item.weight_kg * item.price_per_kg
        const gstAmount = supply.is_built && item.gst_percent ? (amount * item.gst_percent) / 100 : 0
        const total = amount + gstAmount
        transactionTotal += total
        
        items.push({
          productName: product?.product_name || 'N/A',
          weight: item.weight_kg,
          price: item.price_per_kg,
          amount: amount,
          gst: gstAmount,
          total: total
        })
      })

      if (transactionTotal > 0) {
        const voucher = purchase?.purchase_voucher_number || 'N/A'
        reportItems.push({
          date: supply.created_at,
          type: 'debit',
          description: `Supply (Voucher: ${voucher})`,
          amount: transactionTotal,
          voucher: voucher,
          transactionId: supply.id,
          items: items, // Store items for expansion
          isTransaction: true
        })
      }
    })

    // Get receipts (Credit)
    let receiptQuery = supabase
      .from('receipts')
      .select('*')
      .eq('party_id', selectedPartyId)

    if (dateFilter.from) {
      receiptQuery = receiptQuery.gte('date', dateFilter.from)
    }
    if (dateFilter.to) {
      receiptQuery = receiptQuery.lte('date', dateFilter.to)
    }

    const { data: receipts, error: receiptError } = await receiptQuery.order('date', { ascending: false })

    if (receiptError) throw receiptError

    // Add receipts as credit
    receipts?.forEach(receipt => {
      reportItems.push({
        date: receipt.date,
        type: 'credit',
        description: `Receipt - ${receipt.mode}${receipt.description ? `: ${receipt.description}` : ''} (Receipt: ${receipt.receipt_number})`,
        amount: receipt.amount,
        voucher: receipt.receipt_number,
        isTransaction: false
      })
    })

    // Sort by date
    reportItems.sort((a, b) => new Date(a.date) - new Date(b.date))

    setReportData(reportItems)
  }

  function calculateBalance() {
    let balance = 0
    reportData.forEach(item => {
      if (item.type === 'credit') {
        balance += item.amount
      } else {
        balance -= item.amount
      }
    })
    return balance
  }

  function toggleTransaction(transactionId) {
    const newExpanded = new Set(expandedTransactions)
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId)
    } else {
      newExpanded.add(transactionId)
    }
    setExpandedTransactions(newExpanded)
  }

  function handleShare() {
    const party = parties.find(p => p.id === selectedPartyId)
    const reportTitle = `${reportType === 'purchase' ? 'Purchase' : 'Sales'} Report - ${party?.name || 'Unknown'}`
    const dateRange = `${dateFilter.from || 'All'} to ${dateFilter.to || 'All'}`
    const balance = calculateBalance()

    // Generate PDF - use transaction-wise data (items are not included in PDF)
    const pdfData = {
      title: reportTitle,
      partyName: party?.name || 'Unknown',
      dateRange: dateRange,
      items: reportData.map(item => ({
        date: item.date,
        type: item.type,
        description: item.description,
        amount: item.amount,
        voucher: item.voucher
      })),
      balance: balance
    }

    const doc = generateReportPDF(pdfData)
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    
    // Generate PDF blob for sharing
    const pdfBlob = doc.output('blob')
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })
    
    // Try to share the PDF file
    if (navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [file] })) {
        navigator.share({
          title: reportTitle,
          text: `${reportTitle}\nDate Range: ${dateRange}\nBalance: ₹${balance.toFixed(2)}`,
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

  if (loading) return <div className="loading">Loading...</div>

  const party = parties.find(p => p.id === selectedPartyId)
  const balance = calculateBalance()

  return (
    <div>
      <h1>Reports</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            className={reportType === 'purchase' ? 'btn-primary' : 'btn-outline'}
            onClick={() => {
              setReportType('purchase')
              setSelectedPartyId('')
              setReportData([])
            }}
          >
            Purchase Report
          </button>
          <button
            className={reportType === 'sales' ? 'btn-primary' : 'btn-outline'}
            onClick={() => {
              setReportType('sales')
              setSelectedPartyId('')
              setReportData([])
            }}
          >
            Sales Report
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="party_id">Select Party *</label>
          <select
            id="party_id"
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            required
          >
            <option value="">Select Party</option>
            {parties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
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

      {reportData.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2>
              {reportType === 'purchase' ? 'Purchase' : 'Sales'} Report - {party?.name}
            </h2>
            <button className="btn-secondary" onClick={handleShare}>
              Share Report
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Voucher</th>
                  <th style={{ color: '#4CAF50', textAlign: 'right' }}>Credit</th>
                  <th style={{ color: '#f44336', textAlign: 'right' }}>Debit</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => {
                  const isExpanded = item.transactionId && expandedTransactions.has(item.transactionId)
                  return (
                    <React.Fragment key={index}>
                      <tr>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                          {item.isTransaction ? (
                            <span 
                              style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}
                              onClick={() => toggleTransaction(item.transactionId)}
                            >
                              {isExpanded ? '▼' : '▶'} {item.description}
                            </span>
                          ) : (
                            item.description
                          )}
                        </td>
                        <td>{item.voucher}</td>
                        <td style={{ 
                          textAlign: 'right', 
                          fontWeight: 'bold',
                          color: item.type === 'credit' ? '#4CAF50' : 'transparent'
                        }}>
                          {item.type === 'credit' ? `₹${item.amount.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          fontWeight: 'bold',
                          color: item.type === 'debit' ? '#f44336' : 'transparent'
                        }}>
                          {item.type === 'debit' ? `₹${item.amount.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                      {isExpanded && item.items && item.items.length > 0 && (
                        <tr style={{ backgroundColor: '#f9f9f9' }}>
                          <td colSpan="5" style={{ paddingLeft: '2rem' }}>
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left' }}>Product</th>
                                  <th style={{ textAlign: 'right' }}>Weight (kg)</th>
                                  <th style={{ textAlign: 'right' }}>Rate</th>
                                  <th style={{ textAlign: 'right' }}>Amount</th>
                                  {item.items.some(i => i.gst > 0) && <th style={{ textAlign: 'right' }}>GST</th>}
                                  <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.items.map((subItem, subIndex) => (
                                  <tr key={subIndex}>
                                    <td>{subItem.productName}</td>
                                    <td style={{ textAlign: 'right' }}>{subItem.weight.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{subItem.price.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{subItem.amount.toFixed(2)}</td>
                                    {item.items.some(i => i.gst > 0) && (
                                      <td style={{ textAlign: 'right' }}>
                                        {subItem.gst > 0 ? `₹${subItem.gst.toFixed(2)}` : '-'}
                                      </td>
                                    )}
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                      ₹{subItem.total.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', fontSize: '1.1rem' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>Balance:</td>
                  <td style={{ 
                    textAlign: 'right',
                    color: balance >= 0 ? '#4CAF50' : 'transparent'
                  }}>
                    {balance >= 0 ? `₹${balance.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ 
                    textAlign: 'right',
                    color: balance < 0 ? '#f44336' : 'transparent'
                  }}>
                    {balance < 0 ? `₹${Math.abs(balance).toFixed(2)}` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPartyId && reportData.length === 0 && !generating && (
        <div className="card">
          <div className="empty-state">No data found for the selected party and date range</div>
        </div>
      )}
    </div>
  )
}
