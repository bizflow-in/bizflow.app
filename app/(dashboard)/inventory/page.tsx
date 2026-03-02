'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { getNicheConfig } from '@/lib/constants'
import { toast } from 'sonner'
import { Plus, Search, AlertTriangle, X, Package, TrendingDown, TrendingUp } from 'lucide-react'

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [userId, setUserId] = useState('')
  const [niche, setNiche] = useState('retail')
  const [form, setForm] = useState({
    name: '', hsn_code: '', unit: '', price: 0, cost_price: 0, stock_quantity: 0, low_stock_alert: 10, niche_meta: {}
  })
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: profile } = await supabase.from('users').select('niche').eq('id', user.id).single()
    if (profile) setNiche(profile.niche || 'retail')

    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).eq('is_active', true).order('name')
    setProducts(data || [])
    setLoading(false)
  }

  const nicheConf = getNicheConfig(niche)

  const saveProduct = async () => {
    if (!form.name.trim()) { toast.error('Product name required'); return }
    const { error } = await supabase.from('products').insert({
      ...form, user_id: userId,
      unit: form.unit || nicheConf.defaultUnit,
    })
    if (error) { toast.error(error.message); return }
    toast.success(`${form.name} added to inventory!`)
    setShowForm(false)
    setForm({ name: '', hsn_code: '', unit: '', price: 0, cost_price: 0, stock_quantity: 0, low_stock_alert: 10, niche_meta: {} })
    fetchData()
  }

  const updateStock = async (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(0, currentQty + delta)
    const { error } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? {...p, stock_quantity: newQty} : p))
      if (newQty <= 0) toast.warning('Stock is now zero!')
    }
  }

  const displayProducts = products.length > 0 ? products : (loading ? [] : demoProducts(nicheConf))
  const filtered = displayProducts.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))

  const stockStatus = (qty: number, alert: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'badge-red', barColor: 'bg-red-500', percent: 0 }
    if (qty <= alert) return { label: 'Low Stock', color: 'badge-yellow', barColor: 'bg-yellow-500', percent: Math.min(100, (qty/alert)*50) }
    return { label: 'In Stock', color: 'badge-green', barColor: 'bg-green-500', percent: Math.min(100, (qty/(alert*5))*100) }
  }

  const totalValue = filtered.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0)
  const lowStockCount = filtered.filter(p => p.stock_quantity <= (p.low_stock_alert || 10)).length

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="section-header">Inventory</h1>
          <p className="text-gray-500 text-sm">{nicheConf.emoji} {nicheConf.name} • {filtered.length} products</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Products', value: String(filtered.length), icon: '📦', bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Low Stock', value: String(lowStockCount), icon: '⚠️', bg: 'bg-yellow-50', text: 'text-yellow-700', alert: lowStockCount > 0 },
          { label: 'Stock Value', value: formatCurrency(totalValue), icon: '💰', bg: 'bg-brand-50', text: 'text-brand-700' },
        ].map(stat => (
          <div key={stat.label} className={`stat-card ${stat.bg} border-0 relative`}>
            {stat.alert && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-xl font-bold ${stat.text}`} style={{fontFamily:'Sora,sans-serif'}}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder={`Search ${nicheConf.productLabel.toLowerCase()}s...`} value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({length: 6}).map((_, i) => <div key={i} className="stat-card animate-pulse h-40"></div>)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-semibold text-gray-700">No products yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-3 mx-auto"><Plus className="w-4 h-4" /> Add Product</button>
          </div>
        ) : (
          filtered.map((product: any) => {
            const status = stockStatus(product.stock_quantity, product.low_stock_alert || 10)
            const margin = product.cost_price > 0 ? Math.round(((product.price - product.cost_price) / product.price) * 100) : null
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.hsn_code && <span className="text-xs text-gray-400 font-mono">HSN: {product.hsn_code}</span>}
                      <span className="text-xs text-gray-400">{product.unit || nicheConf.defaultUnit}</span>
                    </div>
                  </div>
                  <span className={status.color}>{status.label}</span>
                </div>

                {/* Stock Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock: <strong className="text-gray-900">{product.stock_quantity} {product.unit}</strong></span>
                    <span>Alert at {product.low_stock_alert}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${status.barColor}`}
                      style={{width: `${Math.max(2, status.percent)}%`}}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Selling Price</p>
                    <p className="font-bold text-brand-700">{formatCurrency(product.price)}</p>
                  </div>
                  {margin !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Margin</p>
                      <p className={`font-bold ${margin >= 20 ? 'text-green-700' : 'text-orange-700'}`}>{margin}%</p>
                    </div>
                  )}
                </div>

                {/* Stock Controls */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateStock(product.id, -1, product.stock_quantity)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 transition-all">
                    <TrendingDown className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-gray-900">{product.stock_quantity}</span>
                  <button onClick={() => updateStock(product.id, 1, product.stock_quantity)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-green-50 hover:border-green-200 text-gray-600 hover:text-green-600 transition-all">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => updateStock(product.id, 10, product.stock_quantity)} className="flex-1 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-all">
                    +10 Stock
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Add {nicheConf.productLabel}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">{nicheConf.productLabel} Name *</label>
                  <input className="input-field" placeholder={`e.g. Cotton Fabric (White)`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select className="input-field" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option value="">Default ({nicheConf.defaultUnit})</option>
                    {nicheConf.units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">HSN Code</label>
                  <input className="input-field" placeholder="5208" value={form.hsn_code} onChange={e => setForm({...form, hsn_code: e.target.value})} />
                </div>
                <div>
                  <label className="label">Selling Price (₹)</label>
                  <input type="number" className="input-field" placeholder="500" value={form.price || ''} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">Cost Price (₹)</label>
                  <input type="number" className="input-field" placeholder="350" value={form.cost_price || ''} onChange={e => setForm({...form, cost_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">Opening Stock</label>
                  <input type="number" className="input-field" placeholder="100" value={form.stock_quantity || ''} onChange={e => setForm({...form, stock_quantity: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">Low Stock Alert at</label>
                  <input type="number" className="input-field" placeholder="10" value={form.low_stock_alert || ''} onChange={e => setForm({...form, low_stock_alert: Number(e.target.value)})} />
                </div>
              </div>
              {form.price > 0 && form.cost_price > 0 && (
                <div className="bg-brand-50 rounded-xl p-3 text-sm">
                  <p className="text-brand-700 font-semibold">
                    Margin: {Math.round(((form.price - form.cost_price) / form.price) * 100)}% 
                    ({formatCurrency(form.price - form.cost_price)} per {form.unit || nicheConf.defaultUnit})
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveProduct} className="btn-primary flex-1">Add to Inventory</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function demoProducts(nicheConf: any) {
  const isTextile = nicheConf.key === 'textile'
  const isPharma = nicheConf.key === 'pharma'
  return [
    { id: '1', name: isTextile ? 'Cotton Fabric (White)' : isPharma ? 'Paracetamol 500mg' : 'Product A', hsn_code: '5208', unit: nicheConf.defaultUnit, price: 120, cost_price: 85, stock_quantity: 450, low_stock_alert: 100 },
    { id: '2', name: isTextile ? 'Polyester Blend (Blue)' : isPharma ? 'Crocin 650mg' : 'Product B', hsn_code: '5407', unit: nicheConf.defaultUnit, price: 95, cost_price: 65, stock_quantity: 8, low_stock_alert: 50 },
    { id: '3', name: isTextile ? 'Silk Saree Fabric' : isPharma ? 'Azithromycin 250mg' : 'Product C', hsn_code: '5007', unit: nicheConf.defaultUnit, price: 850, cost_price: 600, stock_quantity: 0, low_stock_alert: 10 },
    { id: '4', name: isTextile ? 'Cotton Denim (Black)' : isPharma ? 'Vitamin C 500mg' : 'Product D', hsn_code: '5209', unit: nicheConf.defaultUnit, price: 180, cost_price: 130, stock_quantity: 320, low_stock_alert: 50 },
    { id: '5', name: isTextile ? 'Printed Georgette' : isPharma ? 'ORS Powder' : 'Product E', hsn_code: '5407', unit: nicheConf.defaultUnit, price: 210, cost_price: 150, stock_quantity: 25, low_stock_alert: 30 },
  ]
}
