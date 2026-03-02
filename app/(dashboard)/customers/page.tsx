'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getInitials } from '@/lib/utils'
import { INDIAN_STATES } from '@/lib/constants'
import { toast } from 'sonner'
import { Plus, Search, Phone, MessageCircle, X, Star } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', gstin: '', billing_address: '', city: '', state: '', credit_limit: 0, notes: ''
  })
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  const saveCustomer = async () => {
    if (!form.name.trim()) { toast.error('Customer name is required'); return }
    const { error } = await supabase.from('customers').insert({ ...form, user_id: userId })
    if (error) { toast.error(error.message); return }
    toast.success(`${form.name} added!`)
    setShowForm(false)
    setForm({ name: '', phone: '', gstin: '', billing_address: '', city: '', state: '', credit_limit: 0, notes: '' })
    fetchData()
  }

  const displayCustomers = customers.length > 0 ? customers : (loading ? [] : demoCustomers)
  const filtered = displayCustomers.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  const scoreColor = (score: number) => score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = (score: number) => score >= 70 ? 'bg-green-50' : score >= 40 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="section-header">Customers</h1>
          <p className="text-gray-500 text-sm">{displayCustomers.length} customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({length:6}).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold text-gray-700">No customers yet</p>
            <p className="text-gray-500 text-sm mb-4">Add your first customer to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mx-auto">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        ) : (
          filtered.map((customer: any) => (
            <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-hover">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {getInitials(customer.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{customer.name}</p>
                  {customer.city && <p className="text-sm text-gray-500">{customer.city}{customer.state ? `, ${customer.state}` : ''}</p>}
                  {customer.gstin && <p className="text-xs text-gray-400 font-mono">{customer.gstin}</p>}
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${scoreBg(customer.payment_score || 70)}`}>
                  <span className={scoreColor(customer.payment_score || 70)}>★ {customer.payment_score || 70}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Outstanding</p>
                  <p className={`font-bold text-sm ${customer.total_outstanding > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                    {formatCurrency(customer.total_outstanding || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Credit Limit</p>
                  <p className="font-bold text-sm text-gray-700">{formatCurrency(customer.credit_limit || 0)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                {customer.phone && (
                  <a href={`https://wa.me/${customer.phone?.replace(/\D/g,'')}?text=Hi%20${customer.name}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-green-200 text-sm font-semibold text-green-700 hover:bg-green-50 transition-all">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Customer / Business Name *</label>
                  <input className="input-field" placeholder="Suresh Traders" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">GSTIN</label>
                  <input className="input-field" placeholder="27AAPFU0939F1ZV" maxLength={15} value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input-field" placeholder="Mumbai" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <label className="label">State</label>
                  <select className="input-field" value={form.state} onChange={e => setForm({...form, state: e.target.value})}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Credit Limit (₹)</label>
                  <input type="number" className="input-field" placeholder="100000" value={form.credit_limit || ''} onChange={e => setForm({...form, credit_limit: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Billing Address</label>
                  <textarea className="input-field" rows={2} placeholder="Full address..." value={form.billing_address} onChange={e => setForm({...form, billing_address: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <input className="input-field" placeholder="Any notes about this customer..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveCustomer} className="btn-primary flex-1">Add Customer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const demoCustomers = [
  { id: '1', name: 'Suresh Traders', phone: '+91 98765 11111', city: 'Surat', state: 'Gujarat', gstin: '24ABCDE1234F1Z5', total_outstanding: 45000, credit_limit: 200000, payment_score: 82 },
  { id: '2', name: 'Mehta Brothers', phone: '+91 98765 22222', city: 'Ahmedabad', state: 'Gujarat', gstin: '', total_outstanding: 15000, credit_limit: 100000, payment_score: 65 },
  { id: '3', name: 'Kapoor Stores', phone: '+91 98765 33333', city: 'Mumbai', state: 'Maharashtra', gstin: '27FGHIJ5678K1Z2', total_outstanding: 85000, credit_limit: 500000, payment_score: 91 },
  { id: '4', name: 'Patel Enterprises', phone: '+91 98765 44444', city: 'Vadodara', state: 'Gujarat', gstin: '', total_outstanding: 0, credit_limit: 50000, payment_score: 78 },
  { id: '5', name: 'Sharma & Sons', phone: '+91 98765 55555', city: 'Delhi', state: 'Delhi', gstin: '07LMNOP9012Q1Z8', total_outstanding: 125000, credit_limit: 300000, payment_score: 45 },
]
