import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import PinSetup from './components/PinSetup'
import PinLogin from './components/PinLogin'
import PartyMaster from './components/PartyMaster'
import ProductMaster from './components/ProductMaster'
import PriceMaster from './components/PriceMaster'
import PurchaseTransaction from './components/PurchaseTransaction'
import SupplyTransaction from './components/SupplyTransaction'
import Receipt from './components/Receipt'
import Payment from './components/Payment'
import Expense from './components/Expense'
import Reports from './components/Reports'
import Daybook from './components/Daybook'
import { checkPinExists, checkAdminPinExists, checkPricePinExists } from './utils/auth'
import AdminPinSetup from './components/AdminPinSetup'
import PricePinSetup from './components/PricePinSetup'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="nav">
      <ul>
        <li><Link to="/parties" className={location.pathname === '/parties' ? 'active' : ''}>Parties</Link></li>
        <li><Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Products</Link></li>
        <li><Link to="/prices" className={location.pathname === '/prices' ? 'active' : ''}>Prices</Link></li>
        <li><Link to="/purchase" className={location.pathname === '/purchase' ? 'active' : ''}>Purchase</Link></li>
        <li><Link to="/supply" className={location.pathname === '/supply' ? 'active' : ''}>Supply</Link></li>
        <li><Link to="/receipt" className={location.pathname === '/receipt' ? 'active' : ''}>Receipt</Link></li>
        <li><Link to="/payment" className={location.pathname === '/payment' ? 'active' : ''}>Payment</Link></li>
        <li><Link to="/expense" className={location.pathname === '/expense' ? 'active' : ''}>Expense</Link></li>
        <li><Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>Reports</Link></li>
        <li><Link to="/daybook" className={location.pathname === '/daybook' ? 'active' : ''}>Daybook</Link></li>
      </ul>
    </nav>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinExists, setPinExists] = useState(null)
  const [adminPinExists, setAdminPinExists] = useState(null)
  const [pricePinExists, setPricePinExists] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const exists = await checkPinExists()
    setPinExists(exists)
    
    if (exists) {
      const [adminExists, priceExists] = await Promise.all([
        checkAdminPinExists(),
        checkPricePinExists()
      ])
      setAdminPinExists(adminExists)
      setPricePinExists(priceExists)
    }
    
    setLoading(false)
    
    // Check if authenticated in session storage
    const authStatus = sessionStorage.getItem('authenticated')
    if (authStatus === 'true' && exists) {
      setIsAuthenticated(true)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!pinExists) {
    return <PinSetup onSetup={() => setPinExists(true)} />
  }

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />
  }

  if (!adminPinExists) {
    return <AdminPinSetup onSetup={() => setAdminPinExists(true)} />
  }

  if (!pricePinExists) {
    return <PricePinSetup onSetup={() => setPricePinExists(true)} />
  }

  return (
    <Router>
      <div className="container">
        <Navigation />
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: 'var(--radius)', padding: '1.5rem', minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/parties" replace />} />
            <Route path="/parties" element={<PartyMaster />} />
            <Route path="/products" element={<ProductMaster />} />
            <Route path="/prices" element={<PriceMaster />} />
            <Route path="/purchase" element={<PurchaseTransaction />} />
            <Route path="/supply" element={<SupplyTransaction />} />
            <Route path="/receipt" element={<Receipt />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/daybook" element={<Daybook />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
