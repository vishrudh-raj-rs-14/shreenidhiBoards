import { useState } from 'react'
import { setPricePin as setPricePinFunction } from '../utils/auth'

export default function PricePinSetup({ onSetup }) {
  const [pricePin, setPricePin] = useState('')
  const [confirmPricePin, setConfirmPricePin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (pricePin.length < 4) {
      setError('Price PIN must be at least 4 characters')
      return
    }

    if (pricePin !== confirmPricePin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('Calling setPricePin with PIN:', pricePin ? '***' : 'null')
      
      // Verify the function exists
      console.log('setPricePinFunction type:', typeof setPricePinFunction)
      
      if (typeof setPricePinFunction !== 'function') {
        console.error('setPricePinFunction is not a function:', typeof setPricePinFunction)
        setError('Internal error: setPricePin function not found')
        setLoading(false)
        return
      }
      
      console.log('About to call setPricePinFunction...')
      const result = await setPricePinFunction(pricePin)
      console.log('setPricePin returned:', result, 'Type:', typeof result)
      
      // Ensure result exists and has error property
      if (result === undefined || result === null) {
        console.error('setPricePin returned undefined/null')
        setError('Unexpected error: Function returned no value. Please check browser console and ensure database migration has been run.')
        setLoading(false)
        return
      }
      
      if (typeof result !== 'object') {
        console.error('Invalid result type from setPricePin:', typeof result, result)
        setError('Unexpected error: Invalid response format. Please check browser console.')
        setLoading(false)
        return
      }
      
      const { error: setupError } = result
      
      if (setupError) {
        console.error('Price PIN setup error:', setupError)
        const errorMessage = setupError.message || setupError.toString() || 'Failed to set price PIN'
        setError(errorMessage)
      } else {
        console.log('Price PIN set successfully, calling onSetup')
        onSetup()
      }
    } catch (err) {
      console.error('Price PIN setup exception:', err)
      setError(err.message || 'An error occurred. Please check the browser console and ensure the database migration has been run.')
    } finally {
      setLoading(false)
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
          <h1 style={{ marginBottom: '0.5rem' }}>Set Price PIN</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            This PIN is required for updating prices
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pricePin">Enter Price PIN</label>
            <input
              type="password"
              id="pricePin"
              value={pricePin}
              onChange={(e) => setPricePin(e.target.value)}
              placeholder="Enter Price PIN (min 4 characters)"
              required
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPricePin">Confirm Price PIN</label>
            <input
              type="password"
              id="confirmPricePin"
              value={confirmPricePin}
              onChange={(e) => setConfirmPricePin(e.target.value)}
              placeholder="Confirm Price PIN"
              required
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Setting up...' : 'Set Price PIN & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
