import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function PriceMaster() {
  const [parties, setParties] = useState([])
  const [products, setProducts] = useState([])
  const [priceType, setPriceType] = useState('purchase') // 'purchase' or 'supply'
  const [prices, setPrices] = useState({})
  const [priceHistory, setPriceHistory] = useState([])
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [priceType])

  async function fetchData() {
    setLoading(true)
    try {
      // Filter parties based on price type
      // Purchase prices: only suppliers (we buy from them)
      // Supply prices: only purchasers (they buy from us)
      const partyGrade = priceType === 'purchase' ? 'supplier' : 'purchaser'
      
      const [partiesRes, productsRes] = await Promise.all([
        supabase.from('parties').select('*').eq('grade', partyGrade).order('name'),
        supabase.from('products').select('*').order('product_name')
      ])

      if (partiesRes.error) throw partiesRes.error
      if (productsRes.error) throw productsRes.error

      setParties(partiesRes.data || [])
      setProducts(productsRes.data || [])

      // Fetch prices
      const tableName = priceType === 'purchase' ? 'purchase_prices' : 'supply_prices'
      const { data: pricesData, error: pricesError } = await supabase
        .from(tableName)
        .select('party_id, product_id, price_per_kg')

      if (pricesError) throw pricesError

      // Convert to matrix format
      const pricesMap = {}
      pricesData.forEach(price => {
        const key = `${price.party_id}-${price.product_id}`
        pricesMap[key] = price.price_per_kg
      })
      setPrices(pricesMap)

      // Fetch price history
      const historyTableName = priceType === 'purchase' ? 'purchase_price_history' : 'supply_price_history'
      const { data: historyData, error: historyError } = await supabase
        .from(historyTableName)
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50)

      if (historyError) throw historyError
      setPriceHistory(historyData || [])
    } catch (err) {
      console.error('Price Master fetch error:', err)
      setError(`Failed to fetch data: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(partyId, productId, currentPrice) {
    const key = `${partyId}-${productId}`
    setEditingCell(key)
    setEditValue(currentPrice ? currentPrice.toString() : '')
  }

  function cancelEdit() {
    setEditingCell(null)
    setEditValue('')
  }

  async function savePrice(partyId, productId) {
    const price = parseFloat(editValue)
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price')
      return
    }

    try {
      const tableName = priceType === 'purchase' ? 'purchase_prices' : 'supply_prices'
      const key = `${partyId}-${productId}`

      // Check if price exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .eq('party_id', partyId)
        .eq('product_id', productId)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from(tableName)
          .update({ price_per_kg: price, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from(tableName)
          .insert([{
            party_id: partyId,
            product_id: productId,
            price_per_kg: price
          }])

        if (error) throw error
      }

      setPrices({ ...prices, [key]: price })
      setEditingCell(null)
      setEditValue('')
      setSuccess('Price saved successfully')
      fetchData() // Refresh to get updated history
    } catch (err) {
      setError('Failed to save price')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Price Master</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={priceType === 'purchase' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setPriceType('purchase')}
          >
            Purchase Prices
          </button>
          <button
            className={priceType === 'supply' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setPriceType('supply')}
          >
            Supply Prices
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>
          {priceType === 'purchase' ? 'Purchase' : 'Supply'} Price Matrix (₹ per kg)
        </h2>
        {products.length === 0 ? (
          <div className="empty-state">No products available</div>
        ) : parties.length === 0 ? (
          <div className="empty-state">No parties available</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#f5f5f5', zIndex: 10 }}>Party / Product</th>
                  {products.map(product => (
                    <th key={product.id}>{product.product_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parties.map(party => (
                  <tr key={party.id}>
                    <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: 'bold' }}>{party.name}</td>
                    {products.map(product => {
                      const key = `${party.id}-${product.id}`
                      const isEditing = editingCell === key
                      const currentPrice = prices[key]

                      return (
                        <td key={product.id}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                style={{ 
                                  width: '100px', 
                                  padding: '0.5rem', 
                                  fontSize: '0.9rem',
                                  minHeight: '44px',
                                  border: '2px solid var(--primary)'
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') savePrice(party.id, product.id)
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                              />
                              <button
                                onClick={() => savePrice(party.id, product.id)}
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', minHeight: '44px' }}
                                className="btn-primary"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', minHeight: '44px' }}
                                className="btn-outline"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(party.id, product.id, currentPrice)}
                              style={{
                                cursor: 'pointer',
                                padding: '0.75rem',
                                minWidth: '80px',
                                minHeight: '44px',
                                textAlign: 'center',
                                border: currentPrice ? '2px solid var(--border)' : '2px dashed var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: currentPrice ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                transition: 'all 0.2s ease',
                                fontWeight: currentPrice ? '600' : '400',
                                color: currentPrice ? 'var(--text-primary)' : 'var(--text-muted)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)'
                                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = currentPrice ? 'var(--border)' : 'var(--border)'
                                e.currentTarget.style.backgroundColor = currentPrice ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                              }}
                              title="Click to edit"
                            >
                              {currentPrice ? `₹${currentPrice}` : 'Click to add'}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Price Edit History</h2>
        {priceHistory.length === 0 ? (
          <div className="empty-state">No price changes recorded yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Product</th>
                  <th>Old Price</th>
                  <th>New Price</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map(history => {
                  const party = parties.find(p => p.id === history.party_id)
                  const product = products.find(p => p.id === history.product_id)
                  return (
                    <tr key={history.id}>
                      <td>{new Date(history.changed_at).toLocaleString()}</td>
                      <td>{party?.name || 'N/A'}</td>
                      <td>{product?.product_name || 'N/A'}</td>
                      <td>{history.old_price ? `₹${history.old_price}` : 'N/A (New)'}</td>
                      <td>₹{history.new_price}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
