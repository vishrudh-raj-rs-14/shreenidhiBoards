import { useState } from 'react'
import { verifyAdminPin } from '../utils/auth'

export default function AdminPinPrompt({ onSuccess, onCancel, action = 'perform this action' }) {
  const [adminPin, setAdminPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const isValid = await verifyAdminPin(adminPin)
    setLoading(false)

    if (isValid) {
      sessionStorage.setItem('admin_authenticated', 'true')
      onSuccess()
    } else {
      setError('Invalid Admin PIN')
      setAdminPin('')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Admin PIN Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          Enter admin PIN to {action}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adminPin">Admin PIN</label>
            <input
              type="password"
              id="adminPin"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Enter Admin PIN"
              required
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-outline" onClick={onCancel} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
