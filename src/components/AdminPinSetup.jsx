import { useState } from 'react'
import { setAdminPin } from '../utils/auth'

export default function AdminPinSetup({ onSetup }) {
  const [adminPin, setAdminPin] = useState('')
  const [confirmAdminPin, setConfirmAdminPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (adminPin.length < 4) {
      setError('Admin PIN must be at least 4 characters')
      return
    }

    if (adminPin !== confirmAdminPin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    const { error: setupError } = await setAdminPin(adminPin)
    setLoading(false)

    if (setupError) {
      setError('Failed to set admin PIN. Please try again.')
    } else {
      onSetup()
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ marginBottom: '0.5rem' }}>Set Admin PIN</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            This PIN is required for delete and edit operations
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adminPin">Enter Admin PIN</label>
            <input
              type="password"
              id="adminPin"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Enter Admin PIN (min 4 characters)"
              required
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmAdminPin">Confirm Admin PIN</label>
            <input
              type="password"
              id="confirmAdminPin"
              value={confirmAdminPin}
              onChange={(e) => setConfirmAdminPin(e.target.value)}
              placeholder="Confirm Admin PIN"
              required
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Setting up...' : 'Set Admin PIN & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
