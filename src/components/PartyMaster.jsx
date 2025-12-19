import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function PartyMaster() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    city: '',
    grade: 'purchaser'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchParties()
  }, [])

  async function fetchParties() {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setParties(data || [])
    } catch (err) {
      setError('Failed to fetch parties')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { error: insertError } = await supabase
        .from('parties')
        .insert([formData])

      if (insertError) throw insertError

      setSuccess('Party added successfully')
      setFormData({ name: '', mobile_number: '', city: '', grade: 'purchaser' })
      setShowForm(false)
      fetchParties()
    } catch (err) {
      setError(err.message || 'Failed to add party')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this party?')) return

    try {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchParties()
      setSuccess('Party deleted successfully')
    } catch (err) {
      setError('Failed to delete party')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Party Master</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Party'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Add New Party</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Party Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile_number">Mobile Number *</label>
              <input
                type="tel"
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="grade">Grade *</label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
              >
                <option value="purchaser">Purchaser</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Add Party</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Parties List</h2>
        {parties.length === 0 ? (
          <div className="empty-state">No parties added yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party) => (
                  <tr key={party.id}>
                    <td>{party.name}</td>
                    <td>{party.mobile_number}</td>
                    <td>{party.city}</td>
                    <td>{party.grade}</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleDelete(party.id)}
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
