import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { generateSupplyInvoice } from '../utils/pdf'
import AdminPinPrompt from './AdminPinPrompt'

export default function SupplyTransaction() {
  const [parties, setParties] = useState([])
  const [unsuppliedPurchases, setUnsuppliedPurchases] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [purchaseItems, setPurchaseItems] = useState([])
  const [formData, setFormData] = useState({
    party_id: '',
    purchase_transaction_id: '',
    is_built: false
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.purchase_transaction_id) {
      loadPurchaseDetails()
    }
  }, [formData.purchase_transaction_id])

  async function fetchData() {
    try {
      const partiesRes = await supabase
        .from('parties')
        .select('*')
        .eq('grade', 'supply_party')
        .order('name')

      if (partiesRes.error) throw partiesRes.error
      setParties(partiesRes.data || [])

      // Fetch unsupplied purchase transactions
      const { data: allPurchases, error: purchasesError } = await supabase
        .from('purchase_transactions')
        .select('id, purchase_voucher_number, created_at')
        .order('created_at', { ascending: false })

      if (purchasesError) throw purchasesError

      // Get all supply transactions to find which purchases are already supplied
      const { data: allSupplies, error: suppliesError } = await supabase
        .from('supply_transactions')
        .select('purchase_transaction_id')

      if (suppliesError) throw suppliesError

      const suppliedPurchaseIds = new Set(
        (allSupplies || []).map(s => s.purchase_transaction_id)
      )

      const unsupplied = (allPurchases || []).filter(
        p => !suppliedPurchaseIds.has(p.id)
      )

      setUnsuppliedPurchases(unsupplied)

      // Fetch all supply transactions for listing
      const { data: allSupplyTransactions, error: supplyTransError } = await supabase
        .from('supply_transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (supplyTransError) throw supplyTransError

      // Get purchase voucher numbers
      const purchaseIds = (allSupplyTransactions || []).map(s => s.purchase_transaction_id)
      const { data: purchaseTransactions } = await supabase
        .from('purchase_transactions')
        .select('id, purchase_voucher_number')
        .in('id', purchaseIds.length > 0 ? purchaseIds : ['00000000-0000-0000-0000-000000000000'])

      const purchaseMap = new Map((purchaseTransactions || []).map(p => [p.id, p]))

      // Join with parties for display
      const suppliesWithParty = (allSupplyTransactions || []).map(supply => {
        const party = partiesRes.data.find(p => p.id === supply.party_id)
        const purchase = purchaseMap.get(supply.purchase_transaction_id)
        return { 
          ...supply, 
          parties: party ? { name: party.name } : null,
          purchase_transactions: purchase || null
        }
      })
      setTransactions(suppliesWithParty)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchaseDetails() {
    setError('')
    setPurchaseItems([])
    setSelectedPurchase(null)

    try {
      // Get purchase transaction details
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_transactions')
        .select('*')
        .eq('id', formData.purchase_transaction_id)
        .single()

      if (purchaseError) throw purchaseError

      // Get purchase items
      const { data: items, error: itemsError } = await supabase
        .from('purchase_transaction_items')
        .select('*')
        .eq('purchase_transaction_id', formData.purchase_transaction_id)

      if (itemsError) throw itemsError

      setSelectedPurchase(purchase)

      // Get all products
      const { data: allProducts } = await supabase.from('products').select('*')
      const productsMap = new Map((allProducts || []).map(p => [p.id, p]))

      // Validate supply prices exist for all products
      const priceErrors = []
      const itemsWithPrices = []

      for (const item of items) {
        const product = productsMap.get(item.product_id)
        const { data: priceData, error: priceError } = await supabase
          .from('supply_prices')
          .select('price_per_kg')
          .eq('party_id', formData.party_id)
          .eq('product_id', item.product_id)
          .single()

        if (priceError || !priceData) {
          priceErrors.push(`Supply price not set for ${product?.product_name || 'product'}`)
        } else {
          itemsWithPrices.push({
            ...item,
            products: product,
            supply_price: priceData.price_per_kg
          })
        }
      }

      if (priceErrors.length > 0) {
        setError(`Please set supply prices first: ${priceErrors.join(', ')}`)
        return
      }

      setPurchaseItems(itemsWithPrices)
    } catch (err) {
      setError(err.message || 'Failed to load purchase details')
    }
  }

  async function handlePreview() {
    setError('')
    setSuccess('')

    if (!formData.party_id || !formData.purchase_transaction_id) {
      setError('Please select party and purchase voucher')
      return
    }

    if (purchaseItems.length === 0) {
      setError('No items found in selected purchase')
      return
    }

    // Build preview data
    const party = parties.find(p => p.id === formData.party_id)
    const previewItems = purchaseItems.map(item => ({
      productName: item.products?.product_name || 'N/A',
      weight: item.weight_kg,
      price: item.supply_price,
      gst: formData.is_built ? item.products?.gst_slab : null
    }))

    setPreviewData({
      partyName: party.name,
      purchaseVoucherNumber: selectedPurchase?.purchase_voucher_number || '',
      date: new Date(),
      isBuilt: formData.is_built,
      items: previewItems
    })
  }

  async function handleSubmit() {
    if (!previewData) {
      await handlePreview()
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Create supply transaction
      const { data: transaction, error: transError } = await supabase
        .from('supply_transactions')
        .insert([{
          party_id: formData.party_id,
          purchase_transaction_id: formData.purchase_transaction_id,
          is_built: formData.is_built
        }])
        .select()
        .single()

      if (transError) throw transError

      // Create supply transaction items
      const transactionItems = purchaseItems.map(item => ({
        supply_transaction_id: transaction.id,
        product_id: item.product_id,
        weight_kg: item.weight_kg,
        price_per_kg: item.supply_price,
        gst_percent: formData.is_built ? item.products?.gst_slab : null
      }))

      const { error: itemsError } = await supabase
        .from('supply_transaction_items')
        .insert(transactionItems)

      if (itemsError) throw itemsError

      setSuccess('Transaction saved successfully')

      // Generate and download PDF
      const doc = generateSupplyInvoice(previewData)
      doc.save(`Supply_${selectedPurchase?.purchase_voucher_number || 'invoice'}.pdf`)

      // Reset form
      setFormData({ party_id: '', purchase_transaction_id: '', is_built: false })
      setSelectedPurchase(null)
      setPurchaseItems([])
      setPreviewData(null)
      fetchData() // Refresh unsupplied purchases and transactions
    } catch (err) {
      setError(err.message || 'Failed to save transaction')
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleteClick(id) {
    setDeleteTargetId(id)
    setShowAdminPrompt(true)
  }

  async function handleDelete() {
    if (!deleteTargetId) return

    try {
      const { error } = await supabase
        .from('supply_transactions')
        .delete()
        .eq('id', deleteTargetId)

      if (error) throw error

      setSuccess('Transaction deleted successfully')
      setShowAdminPrompt(false)
      setDeleteTargetId(null)
      sessionStorage.removeItem('admin_authenticated')
      fetchData()
    } catch (err) {
      setError('Failed to delete transaction')
      setShowAdminPrompt(false)
      setDeleteTargetId(null)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <h1>Supply Transaction</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }}>
          <div className="form-group">
            <label htmlFor="party_id">Party Name *</label>
            <select
              id="party_id"
              value={formData.party_id}
              onChange={(e) => {
                setFormData({ ...formData, party_id: e.target.value, purchase_transaction_id: '' })
                setSelectedPurchase(null)
                setPurchaseItems([])
              }}
              required
            >
              <option value="">Select Party</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>{party.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="purchase_transaction_id">Select Purchase Voucher Number *</label>
            <select
              id="purchase_transaction_id"
              value={formData.purchase_transaction_id}
              onChange={(e) => setFormData({ ...formData, purchase_transaction_id: e.target.value })}
              required
              disabled={!formData.party_id}
            >
              <option value="">Select Purchase Voucher</option>
              {unsuppliedPurchases.map(purchase => (
                <option key={purchase.id} value={purchase.id}>
                  {purchase.purchase_voucher_number} - {new Date(purchase.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {purchaseItems.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="section-title">Products from Purchase</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Weight (kg)</th>
                      <th>Supply Price (₹/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.products?.product_name || 'N/A'}</td>
                        <td>{item.weight_kg}</td>
                        <td>₹{item.supply_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_built}
                onChange={(e) => setFormData({ ...formData, is_built: e.target.checked })}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              Built (Apply GST)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-secondary" disabled={purchaseItems.length === 0} style={{ flex: '1', minWidth: '150px' }}>
              Preview Invoice
            </button>
            {previewData && (
              <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: '1', minWidth: '150px' }}>
                {submitting ? 'Saving...' : 'Confirm & Save'}
              </button>
            )}
          </div>
        </form>
      </div>

      {previewData && (
        <div className="card">
          <h2>Invoice Preview</h2>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Party:</strong> {previewData.partyName}</p>
            <p><strong>Purchase Voucher:</strong> {previewData.purchaseVoucherNumber}</p>
            <p><strong>Date:</strong> {previewData.date.toLocaleDateString()}</p>
            <p><strong>Built:</strong> {previewData.isBuilt ? 'Yes' : 'No'}</p>
            
            <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Weight (kg)</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    {previewData.isBuilt && <th>GST</th>}
                    {previewData.isBuilt && <th>Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewData.items.map((item, idx) => {
                    const amount = item.weight * item.price
                    const gstAmount = previewData.isBuilt && item.gst ? (amount * item.gst) / 100 : 0
                    const total = amount + gstAmount
                    return (
                      <tr key={idx}>
                        <td>{item.productName}</td>
                        <td>{item.weight}</td>
                        <td>₹{item.price}</td>
                        <td>₹{amount.toFixed(2)}</td>
                        {previewData.isBuilt && <td>{item.gst ? `${item.gst}%` : '-'}</td>}
                        {previewData.isBuilt && <td>₹{total.toFixed(2)}</td>}
                      </tr>
                    )
                  })}
                  <tr style={{ fontWeight: 'bold' }}>
                    <td colSpan={previewData.isBuilt ? 4 : 3}>Grand Total</td>
                    <td>₹{previewData.items.reduce((sum, item) => {
                      const amount = item.weight * item.price
                      const gstAmount = previewData.isBuilt && item.gst ? (amount * item.gst) / 100 : 0
                      return sum + amount + gstAmount
                    }, 0).toFixed(2)}</td>
                    {previewData.isBuilt && <td></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">Supply Transactions</h2>
        {transactions.length === 0 ? (
          <div className="empty-state">No supply transactions recorded yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Purchase Voucher</th>
                  <th>Built</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                    <td>{transaction.parties?.name || 'N/A'}</td>
                    <td>{transaction.purchase_transactions?.purchase_voucher_number || 'N/A'}</td>
                    <td>{transaction.is_built ? 'Yes' : 'No'}</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleDeleteClick(transaction.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdminPrompt && (
        <AdminPinPrompt
          onSuccess={handleDelete}
          onCancel={() => {
            setShowAdminPrompt(false)
            setDeleteTargetId(null)
          }}
          action="delete this transaction"
        />
      )}
    </div>
  )
}
