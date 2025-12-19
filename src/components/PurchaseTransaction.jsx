import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { generatePurchaseInvoice } from '../utils/pdf'
import AdminPinPrompt from './AdminPinPrompt'

export default function PurchaseTransaction() {
  const [parties, setParties] = useState([])
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [formData, setFormData] = useState({
    party_id: '',
    purchase_voucher_number: '',
    vehicle_number: '',
    is_built: false
  })
  const [items, setItems] = useState([{ product_id: '', weight: '' }])
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

  async function fetchData() {
    try {
      const [partiesRes, productsRes, transactionsRes] = await Promise.all([
        supabase.from('parties').select('*').eq('grade', 'purchase_party').order('name'),
        supabase.from('products').select('*').eq('confirmed', true).order('product_name'),
        supabase.from('purchase_transactions')
          .select('*, parties:party_id (name)')
          .order('created_at', { ascending: false })
      ])

      if (partiesRes.error) throw partiesRes.error
      if (productsRes.error) throw productsRes.error
      if (transactionsRes.error) throw transactionsRes.error

      setParties(partiesRes.data || [])
      setProducts(productsRes.data || [])
      
      // Join with parties for display
      const transactionsWithParty = (transactionsRes.data || []).map(t => {
        const party = partiesRes.data.find(p => p.id === t.party_id)
        return { ...t, parties: party ? { name: party.name } : null }
      })
      setTransactions(transactionsWithParty)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  function addItem() {
    setItems([...items, { product_id: '', weight: '' }])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  async function validatePrices() {
    const priceErrors = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.product_id || !item.weight) continue

      const { data, error } = await supabase
        .from('purchase_prices')
        .select('price_per_kg')
        .eq('party_id', formData.party_id)
        .eq('product_id', item.product_id)
        .single()

      if (error || !data) {
        const product = products.find(p => p.id === item.product_id)
        priceErrors.push(`Price not set for ${product?.product_name || 'product'}`)
      }
    }
    return priceErrors
  }

  async function handlePreview() {
    setError('')
    setSuccess('')

    // Validation
    if (!formData.party_id || !formData.purchase_voucher_number) {
      setError('Please fill all required fields')
      return
    }

    if (items.some(item => !item.product_id || !item.weight)) {
      setError('Please fill all product details')
      return
    }

    // Validate prices
    const priceErrors = await validatePrices()
    if (priceErrors.length > 0) {
      setError(priceErrors.join(', '))
      return
    }

    // Build preview data
    const party = parties.find(p => p.id === formData.party_id)
    const previewItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      const { data: priceData } = await supabase
        .from('purchase_prices')
        .select('price_per_kg')
        .eq('party_id', formData.party_id)
        .eq('product_id', item.product_id)
        .single()

      previewItems.push({
        productName: product.product_name,
        weight: parseFloat(item.weight),
        price: priceData.price_per_kg,
        gst: formData.is_built ? product.gst_slab : null
      })
    }

    setPreviewData({
      partyName: party.name,
      voucherNumber: formData.purchase_voucher_number,
      vehicleNumber: formData.vehicle_number,
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
      // Create transaction
      const { data: transaction, error: transError } = await supabase
        .from('purchase_transactions')
        .insert([{
          party_id: formData.party_id,
          purchase_voucher_number: formData.purchase_voucher_number,
          vehicle_number: formData.vehicle_number,
          is_built: formData.is_built
        }])
        .select()
        .single()

      if (transError) throw transError

      // Create transaction items
      const transactionItems = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const product = products.find(p => p.id === item.product_id)
        const { data: priceData } = await supabase
          .from('purchase_prices')
          .select('price_per_kg')
          .eq('party_id', formData.party_id)
          .eq('product_id', item.product_id)
          .single()

        transactionItems.push({
          purchase_transaction_id: transaction.id,
          product_id: item.product_id,
          weight_kg: parseFloat(item.weight),
          price_per_kg: priceData.price_per_kg,
          gst_percent: formData.is_built ? product.gst_slab : null
        })
      }

      const { error: itemsError } = await supabase
        .from('purchase_transaction_items')
        .insert(transactionItems)

      if (itemsError) throw itemsError

      setSuccess('Transaction saved successfully')
      
      // Generate and download PDF
      const doc = generatePurchaseInvoice(previewData)
      doc.save(`Purchase_${formData.purchase_voucher_number}.pdf`)

      // Reset form
      setFormData({ party_id: '', purchase_voucher_number: '', vehicle_number: '', is_built: false })
      setItems([{ product_id: '', weight: '' }])
      setPreviewData(null)
      fetchData() // Refresh transactions list
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
        .from('purchase_transactions')
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
      <h1>Purchase Transaction</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }}>
          <div className="form-group">
            <label htmlFor="party_id">Party Name *</label>
            <select
              id="party_id"
              value={formData.party_id}
              onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
              required
            >
              <option value="">Select Party</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>{party.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="purchase_voucher_number">Purchase Voucher Number *</label>
            <input
              type="text"
              id="purchase_voucher_number"
              value={formData.purchase_voucher_number}
              onChange={(e) => setFormData({ ...formData, purchase_voucher_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicle_number">Vehicle Number</label>
            <input
              type="text"
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
            />
          </div>

          <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Products</h3>
          {items.map((item, index) => (
            <div key={index} className="card" style={{ marginBottom: '1rem', border: '2px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>Product {index + 1}</strong>
                {items.length > 1 && (
                  <button type="button" className="btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => removeItem(index)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="form-group">
                <label>Product Name *</label>
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.weight}
                  onChange={(e) => updateItem(index, 'weight', e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addItem} style={{ marginBottom: '1rem', width: '100%' }}>
            + Add Product
          </button>

          <div className="form-group">
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
            <button type="submit" className="btn-secondary" style={{ flex: '1', minWidth: '150px' }}>Preview Invoice</button>
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
            <p><strong>Voucher Number:</strong> {previewData.voucherNumber}</p>
            {previewData.vehicleNumber && <p><strong>Vehicle Number:</strong> {previewData.vehicleNumber}</p>}
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
        <h2 className="section-title">Purchase Transactions</h2>
        {transactions.length === 0 ? (
          <div className="empty-state">No purchase transactions recorded yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Voucher Number</th>
                  <th>Vehicle Number</th>
                  <th>Built</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                    <td>{transaction.parties?.name || 'N/A'}</td>
                    <td>{transaction.purchase_voucher_number}</td>
                    <td>{transaction.vehicle_number || '-'}</td>
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
