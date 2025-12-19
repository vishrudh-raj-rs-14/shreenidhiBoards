import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function Expense() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucher_number: '',
    pay_to: '',
    amount: '',
    description: '',
    expense_grade: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  async function fetchExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (err) {
      setError('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const { error: insertError } = await supabase
        .from('expenses')
        .insert([expenseData])

      if (insertError) throw insertError

      setSuccess('Expense added successfully')
      setFormData({
        date: new Date().toISOString().split('T')[0],
        voucher_number: '',
        pay_to: '',
        amount: '',
        description: '',
        expense_grade: ''
      })
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      setError(err.message || 'Failed to add expense')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchExpenses()
      setSuccess('Expense deleted successfully')
    } catch (err) {
      setError('Failed to delete expense')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Add New Expense</h2>
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
              <label htmlFor="voucher_number">Voucher Number *</label>
              <input
                type="text"
                id="voucher_number"
                value={formData.voucher_number}
                onChange={(e) => setFormData({ ...formData, voucher_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pay_to">Pay To *</label>
              <input
                type="text"
                id="pay_to"
                value={formData.pay_to}
                onChange={(e) => setFormData({ ...formData, pay_to: e.target.value })}
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
              <label htmlFor="expense_grade">Expense Grade *</label>
              <input
                type="text"
                id="expense_grade"
                value={formData.expense_grade}
                onChange={(e) => setFormData({ ...formData, expense_grade: e.target.value })}
                placeholder="e.g., Office, Travel, etc."
                required
              />
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
            <button type="submit" className="btn-primary">Add Expense</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Expenses List</h2>
        {expenses.length === 0 ? (
          <div className="empty-state">No expenses added yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher Number</th>
                  <th>Pay To</th>
                  <th>Amount</th>
                  <th>Expense Grade</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.voucher_number}</td>
                    <td>{expense.pay_to}</td>
                    <td>₹{expense.amount}</td>
                    <td>{expense.expense_grade}</td>
                    <td>{expense.description || '-'}</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleDelete(expense.id)}
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
