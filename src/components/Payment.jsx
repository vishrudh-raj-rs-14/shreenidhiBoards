import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import AdminPinPrompt from './AdminPinPrompt'

export default function Payment() {
  const [parties, setParties] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    party_id: '',
    paid_amount: '',
    mode: 'cash',
    description: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [adminAction, setAdminAction] = useState(null)
  const [targetId, setTargetId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const partiesRes = await supabase.from('parties').select('*').eq('grade', 'purchase_party').order('name')
      const paymentsRes = await supabase.from('payments').select('*').order('created_at', { ascending: false })

      if (partiesRes.error) throw partiesRes.error
      if (paymentsRes.error) throw paymentsRes.error

      setParties(partiesRes.data || [])
      const payments = paymentsRes.data || []
      // Join with parties
      const paymentsWithParty = payments.map(payment => {
        const party = partiesRes.data.find(p => p.id === payment.party_id)
        return { ...payment, parties: party ? { name: party.name } : null }
      })
      setPayments(paymentsWithParty)
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
      const paymentData = {
        ...formData,
        paid_amount: parseFloat(formData.paid_amount)
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', editingId)

        if (updateError) throw updateError
        setSuccess('Payment updated successfully')
      } else {
        const { error: insertError } = await supabase
          .from('payments')
          .insert([paymentData])

        if (insertError) throw insertError
        setSuccess('Payment added successfully')
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        party_id: '',
        paid_amount: '',
        mode: 'cash',
        description: ''
      })
      setShowForm(false)
      setEditingId(null)
      fetchData()
    } catch (err) {
      setError(err.message || 'Failed to save payment')
    }
  }

  function handleEdit(payment) {
    setEditingId(payment.id)
    setFormData({
      date: payment.date,
      party_id: payment.party_id,
      paid_amount: payment.paid_amount.toString(),
      mode: payment.mode,
      description: payment.description || ''
    })
    setShowForm(true)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      party_id: '',
      paid_amount: '',
      mode: 'cash',
      description: ''
    })
    setShowForm(false)
  }

  function handleDeleteClick(id) {
    setTargetId(id)
    setAdminAction('delete')
    setShowAdminPrompt(true)
  }

  function handleEditClick(id) {
    setTargetId(id)
    setAdminAction('edit')
    setShowAdminPrompt(true)
  }

  async function handleAdminAction() {
    if (adminAction === 'delete') {
      try {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', targetId)

        if (error) throw error
        setSuccess('Payment deleted successfully')
        fetchData()
      } catch (err) {
        setError('Failed to delete payment')
      }
    } else if (adminAction === 'edit') {
      const payment = payments.find(p => p.id === targetId)
      if (payment) {
        handleEdit(payment)
      }
    }

    setShowAdminPrompt(false)
    setTargetId(null)
    setAdminAction(null)
    sessionStorage.removeItem('admin_authenticated')
  }


  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Payment'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Payment' : 'Add New Payment'}</h2>
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
              <label htmlFor="paid_amount">Paid Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="paid_amount"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
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
            <button type="submit" className="btn-primary">Add Payment</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Payments List</h2>
        {payments.length === 0 ? (
          <div className="empty-state">No payments added yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Paid Amount</th>
                  <th>Mode</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.parties?.name || 'N/A'}</td>
                    <td>₹{payment.paid_amount}</td>
                    <td>{payment.mode}</td>
                    <td>{payment.description || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          onClick={() => handleEditClick(payment.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          onClick={() => handleDeleteClick(payment.id)}
                        >
                          Delete
                        </button>
                      </div>
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
          onSuccess={handleAdminAction}
          onCancel={() => {
            setShowAdminPrompt(false)
            setTargetId(null)
            setAdminAction(null)
          }}
          action={adminAction === 'delete' ? 'delete this payment' : 'edit this payment'}
        />
      )}
    </div>
  )
}
