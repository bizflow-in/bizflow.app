'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { getNicheConfig } from '@/lib/niche/config'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Search, Package, AlertTriangle, Edit2, X, Check } from 'lucide-react'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'

export default function InventoryPage() {
  const { user } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', unit: '', price: '', cost_price: '',
    stock_quantity: '', low_stock_alert: '', hsn_code: '',
  })
  const supabase = createClient()
  const nicheConfig = user ? getNicheConfig(user.niche) : null

  useEffect(() => { if (user) loadProducts() }, [user])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
    setLoading(false)
  }

  const resetForm = () => setForm({
    name: '', unit: nicheConfig?.units[0] || 'Pieces', price: '', cost_price: '',
    stock_quantity: '', low_stock_alert: '10', hsn_code: '',
  })

  const handleAdd = async () => {
    if (!form.name || !form.price) return toast.error('Name and price are required')
    const { error } = await supabase.from('products').insert({
      user_id: user!.id,
      name: form.name,
      unit: form.unit || nicheConfig?.units[0] || 'Pieces',
      price: parseFloat(form.price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      low_stock_alert: parseFloat(form.low_stock_alert) || 10,
      hsn_code: form.hsn_code || null,
    })
    if (error) return toast.error(error.message)
    toast.success('Product added!')
    setShowAddForm(false)
    resetForm()
    loadProducts()
  }

  const updateStock = async (id: string, newStock: number) => {
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p))
  }

  const toggleActive = async (id: string) => {
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Product removed')
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStockLevel = (p: Product) => {
    if (p.stock_quantity <= 0) return 'empty'
    if (p.stock_quantity <= p.low_stock_alert) return 'low'
    if (p.stock_quantity <= p.low_stock_alert * 2) return 'medium'
    return 'high'
  }

  const stockPct = (p: Product) => {
    const max = Math.max(p.low_stock_alert * 4, p.stock_quantity)
    return Math.min(100, (p.stock_quantity / max) * 100)
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-gray-500 text-sm">{products.length} products</p>
        </div>
        <button onClick={() => { setShowAddForm(true); resetForm() }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">New Product</h2>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" placeholder="e.g. Cotton Fabric 40s" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit *</label>
              <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {nicheConfig?.units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input type="number" className="input" placeholder="0.00" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" className="input" placeholder="0.00" value={form.cost_price}
                onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Current Stock</label>
              <input type="number" className="input" placeholder="0" value={form.stock_quantity}
                onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Low Stock Alert</label>
              <input type="number" className="input" placeholder="10" value={form.low_stock_alert}
                onChange={e => setForm(f => ({ ...f, low_stock_alert: e.target.value }))} />
            </div>
            <div>
              <label className="label">HSN Code</label>
              <select className="input" value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))}>
                <option value="">Select HSN...</option>
                {nicheConfig?.hsnPresets.map(h => (
                  <option key={h.code} value={h.code}>{h.code} — {h.desc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} className="btn-primary">Add Product</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search products..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-container p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products yet</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => {
            const level = getStockLevel(product)
            const pct = stockPct(product)
            const isEditing = editingId === product.id
            return (
              <div key={product.id} className={cn(
                'bg-white rounded-2xl border p-5 shadow-sm transition-all',
                level === 'empty' || level === 'low' ? 'border-red-200' : 'border-gray-100'
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.hsn_code && `HSN: ${product.hsn_code} · `}{product.unit}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingId(isEditing ? null : product.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Edit2 className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    <button onClick={() => toggleActive(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-gray-400">/ {product.unit}</span>
                  {product.cost_price && (
                    <span className="text-xs text-brand-600 ml-auto">
                      Margin: {Math.round(((product.price - product.cost_price) / product.price) * 100)}%
                    </span>
                  )}
                </div>

                <div className="stock-bar mb-1.5">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      level === 'high' ? 'bg-brand-500' :
                      level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Stock:</span>
                      <input
                        type="number"
                        className="w-24 px-2 py-1 text-sm border rounded-lg"
                        defaultValue={product.stock_quantity}
                        onBlur={e => {
                          updateStock(product.id, parseFloat(e.target.value) || 0)
                          setEditingId(null)
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className={cn('text-sm font-medium', level === 'low' || level === 'empty' ? 'text-red-600' : 'text-gray-700')}>
                      {level === 'low' || level === 'empty' ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : null}
                      {product.stock_quantity} {product.unit}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Min: {product.low_stock_alert}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
