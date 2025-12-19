import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function Receipt() {
  const [parties, setParties] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    party_id: '',
    receipt_number: '',
    mode: 'cash',
    description: '',
    amount: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const partiesRes = await supabase.from('parties').select('*').eq('grade', 'supply_party').order('name')
      const receiptsRes = await supabase.from('receipts').select('*').order('created_at', { ascending: false })

      if (partiesRes.error) throw partiesRes.error
      if (receiptsRes.error) throw receiptsRes.error

      setParties(partiesRes.data || [])
      const receipts = receiptsRes.data || []
      // Join with parties
      const receiptsWithParty = receipts.map(receipt => {
        const party = partiesRes.data.find(p => p.id === receipt.party_id)
        return { ...receipt, parties: party ? { name: party.name } : null }
      })
      setReceipts(receiptsWithParty)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const receiptData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const { error: insertError } = await supabase
        .from('receipts')
        .insert([receiptData])

      if (insertError) throw insertError

      setSuccess('Receipt added successfully')
      setFormData({
        date: new Date().toISOString().split('T')[0],
        party_id: '',
        receipt_number: '',
        mode: 'cash',
        description: '',
        amount: ''
      })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to add receipt')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
      setSuccess('Receipt deleted successfully')
    } catch (err) {
      setError('Failed to delete receipt')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Receipts</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Receipt'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Add New Receipt</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
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
              <label htmlFor="receipt_number">Receipt Number *</label>
              <input
                type="text"
                id="receipt_number"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mode">Mode *</label>
              <select
                id="mode"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                required
              >
                <option value="cash">Cash</option>
                <option value="Gpay">Gpay</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="btn-primary">Add Receipt</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Receipts List</h2>
        {receipts.length === 0 ? (
          <div className="empty-state">No receipts added yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Receipt Number</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{new Date(receipt.date).toLocaleDateString()}</td>
                    <td>{receipt.parties?.name || 'N/A'}</td>
                    <td>{receipt.receipt_number}</td>
                    <td>₹{receipt.amount}</td>
                    <td>{receipt.mode}</td>
                    <td>{receipt.description || '-'}</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleDelete(receipt.id)}
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
    </div>
  )
}
