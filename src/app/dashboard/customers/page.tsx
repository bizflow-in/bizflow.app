'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Search, Users, Phone, MapPin, X, Star } from 'lucide-react'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const { user } = useAppStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', gstin: '', city: '', state: '',
    billing_address: '', credit_limit: '', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    const { data } = await supabase
      .from('customers').select('*').eq('user_id', user!.id).order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name) return toast.error('Customer name is required')
    const { error } = await supabase.from('customers').insert({
      user_id: user!.id,
      name: form.name,
      phone: form.phone || null,
      gstin: form.gstin || null,
      city: form.city || null,
      state: form.state || null,
      billing_address: form.billing_address || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      notes: form.notes || null,
    })
    if (error) return toast.error(error.message)
    toast.success('Customer added!')
    setShowForm(false)
    setForm({ name: '', phone: '', gstin: '', city: '', state: '', billing_address: '', credit_limit: '', notes: '' })
    load()
  }

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) || c.city?.toLowerCase().includes(search.toLowerCase())
  )

  const getPaymentScore = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-brand-600 bg-brand-50' }
    if (score >= 60) return { label: 'Good', color: 'text-blue-600 bg-blue-50' }
    if (score >= 40) return { label: 'Average', color: 'text-yellow-600 bg-yellow-50' }
    return { label: 'Poor', color: 'text-red-600 bg-red-50' }
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">New Customer</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Name *</label>
              <input className="input" placeholder="Rajesh Kumar" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input className="input" placeholder="27AAPFU0939F1ZV" value={form.gstin}
                onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} maxLength={15} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Mumbai" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="Maharashtra" value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <label className="label">Credit Limit (₹)</label>
              <input type="number" className="input" placeholder="50000" value={form.credit_limit}
                onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Billing Address</label>
              <textarea className="input" rows={2} placeholder="Full billing address..."
                value={form.billing_address}
                onChange={e => setForm(f => ({ ...f, billing_address: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} className="btn-primary">Add Customer</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search customers..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Customer list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-container p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No customers yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(customer => {
            const score = getPaymentScore(customer.payment_score)
            return (
              <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-brand-700">{customer.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    {customer.gstin && (
                      <p className="text-xs text-gray-400 font-mono">GST: {customer.gstin}</p>
                    )}
                  </div>
                  <span className={`badge text-xs ${score.color}`}>
                    <Star className="w-3 h-3 mr-1" />{score.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <a href={`tel:${customer.phone}`} className="hover:text-brand-600">{customer.phone}</a>
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {customer.city}{customer.state ? `, ${customer.state}` : ''}
                    </div>
                  )}
                </div>

                {customer.total_outstanding > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between">
                    <span className="text-xs text-gray-500">Outstanding</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(customer.total_outstanding)}</span>
                  </div>
                )}

                {customer.credit_limit > 0 && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Credit limit</span>
                    <span className="text-gray-600">{formatCurrency(customer.credit_limit)}</span>
                  </div>
                )}

                {customer.phone && (
                  <a
                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=Hello ${customer.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-xl text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
