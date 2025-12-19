import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function ProductMaster() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    product_grade: '',
    gst_slab: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const productData = {
        product_name: formData.product_name,
        product_grade: formData.product_grade,
        gst_slab: parseFloat(formData.gst_slab),
        confirmed: true
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])

      if (insertError) throw insertError

      setSuccess('Product added successfully')
      setFormData({ product_name: '', product_grade: '', gst_slab: '' })
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.message || 'Failed to add product')
    }
  }


  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
      setSuccess('Product deleted successfully')
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Product Master</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Add New Product</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="product_name">Product Name *</label>
              <input
                type="text"
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="product_grade">Product Grade *</label>
              <input
                type="text"
                id="product_grade"
                value={formData.product_grade}
                onChange={(e) => setFormData({ ...formData, product_grade: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="gst_slab">GST Slab (%) *</label>
              <input
                type="number"
                id="gst_slab"
                step="0.01"
                min="0"
                max="100"
                value={formData.gst_slab}
                onChange={(e) => setFormData({ ...formData, gst_slab: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Add Product</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Products List</h2>
        {products.length === 0 ? (
          <div className="empty-state">No products added yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Product Grade</th>
                  <th>GST Slab (%)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.product_name}</td>
                    <td>{product.product_grade}</td>
                    <td>{product.gst_slab}%</td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleDelete(product.id)}
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
