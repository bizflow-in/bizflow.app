'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, generateOrderNumber } from '@/lib/utils'
import { ORDER_STATUSES } from '@/lib/constants'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Plus, Search, Filter, MessageCircle, CheckCircle,
  Clock, Package, Truck, X, AlertCircle, ChevronDown
} from 'lucide-react'

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'badge-yellow', icon: Clock, label: 'Pending' },
  confirmed: { color: 'badge-blue', icon: CheckCircle, label: 'Confirmed' },
  processing: { color: 'badge-blue', icon: Package, label: 'Processing' },
  dispatched: { color: 'badge-blue', icon: Truck, label: 'Dispatched' },
  delivered: { color: 'badge-green', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'badge-red', icon: X, label: 'Cancelled' },
}

// Demo WhatsApp messages for simulation
const waMessages = [
  "Bhai 50 metre white cotton fabric chahiye. 15 tarikh tak delivery chahiye. - Suresh",
  "Need 2 boxes paracetamol 500mg and 100 strips crocin. urgent hai.",
  "10 kg MS plate 3mm thickness send karo. Rate kya hai?",
  "100 pieces electrical switches type B chahiye. Kaisa rate milega?",
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showWASimulator, setShowWASimulator] = useState(false)
  const [waMessage, setWaMessage] = useState('')
  const [parsedOrder, setParsedOrder] = useState<any>(null)
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    customer_name: '',
    delivery_date: '',
    notes: '',
    items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }],
    source: 'manual' as 'manual' | 'whatsapp',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [ordersRes, custRes, prodRes] = await Promise.all([
      supabase.from('orders').select('*, customers(name, phone)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').eq('user_id', user.id),
      supabase.from('products').select('id, name, unit, price').eq('user_id', user.id).eq('is_active', true),
    ])

    setOrders(ordersRes.data || [])
    setCustomers(custRes.data || [])
    setProducts(prodRes.data || [])
    setLoading(false)
  }

  const simulateWAOrder = async () => {
    if (!waMessage.trim()) return
    
    // Demo parsing — in production this calls Claude API
    const keywords = waMessage.toLowerCase()
    let parsed: any = {
      raw_message: waMessage,
      extracted: {
        items: [],
        customer_hint: 'WhatsApp Customer',
        notes: waMessage,
      }
    }

    // Simple pattern matching for demo
    const qtyMatch = waMessage.match(/(\d+)\s*(metre|kg|box|piece|strip|roll|bag)/i)
    const productMatch = waMessage.match(/(\d+)\s*(?:metre|kg|box|piece|strip|roll|bag)\s+([\w\s]+)/i)
    
    if (qtyMatch) {
      parsed.extracted.items = [{
        description: productMatch?.[2]?.trim() || 'Product from WhatsApp',
        quantity: qtyMatch[1],
        unit: qtyMatch[2],
      }]
    }

    setParsedOrder(parsed)
    toast.success('Order parsed from WhatsApp! Review and confirm.')
  }

  const confirmWAOrder = async () => {
    if (!parsedOrder) return
    const orderNum = generateOrderNumber()
    
    const { data, error } = await supabase.from('orders').insert({
      user_id: userId,
      order_number: orderNum,
      order_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      total_amount: 0,
      source: 'whatsapp',
      notes: parsedOrder.raw_message,
    }).select().single()

    if (error) { toast.error('Error saving order'); return }
    
    toast.success(`Order ${orderNum} created from WhatsApp!`)
    setParsedOrder(null)
    setWaMessage('')
    setShowWASimulator(false)
    fetchData()
  }

  const createOrder = async () => {
    if (!newOrder.items[0].product_name && !newOrder.items[0].product_id) {
      toast.error('Add at least one product')
      return
    }
    
    const total = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const orderNum = generateOrderNumber()

    const { data, error } = await supabase.from('orders').insert({
      user_id: userId,
      customer_id: newOrder.customer_id || null,
      order_number: orderNum,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: newOrder.delivery_date || null,
      status: 'pending',
      total_amount: total,
      source: 'manual',
      notes: newOrder.notes,
    }).select().single()

    if (error) { toast.error(error.message); return }

    // Add order items
    if (data) {
      await supabase.from('order_items').insert(
        newOrder.items.filter(i => i.product_name || i.product_id).map(item => ({
          order_id: data.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: 0,
          total_price: item.quantity * item.unit_price,
        }))
      )
    }

    toast.success(`Order ${orderNum} created!`)
    setShowNewOrder(false)
    setNewOrder({ customer_id: '', customer_name: '', delivery_date: '', notes: '', items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }], source: 'manual' })
    fetchData()
  }

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { toast.error(error.message); return }
    toast.success(`Order status updated to ${status}`)
    fetchData()
  }

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search || 
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customers?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // Demo orders if DB empty
  const displayOrders = filteredOrders.length > 0 ? filteredOrders : (orders.length === 0 && !loading ? demoOrders : [])

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="section-header">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowWASimulator(true)} className="btn-secondary text-sm gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">WhatsApp</span> Demo
          </button>
          <button onClick={() => setShowNewOrder(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', ...ORDER_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : displayOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🛒</p>
            <p className="font-semibold text-gray-700 mb-1">No orders yet</p>
            <p className="text-gray-500 text-sm mb-4">Create your first order or connect WhatsApp to capture orders automatically</p>
            <button onClick={() => setShowNewOrder(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Create First Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order #', 'Customer', 'Date', 'Amount', 'Source', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayOrders.map((order: any) => {
                  const SC = statusConfig[order.status]
                  const Icon = SC?.icon || Clock
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-5 py-4">
                        <Link href={`/orders/${order.id}`} className="font-semibold text-brand-600 hover:underline text-sm">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 text-sm">{order.customers?.name || order.customer_name || '—'}</p>
                        {order.customers?.phone && <p className="text-xs text-gray-400">{order.customers.phone}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(order.order_date)}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total_amount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        {order.source === 'whatsapp' ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={SC?.color || 'badge-gray'}>
                          <Icon className="w-3 h-3 mr-1 inline" />
                          {SC?.label || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <Modal title="Create New Order" onClose={() => setShowNewOrder(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Customer</label>
              <select
                className="input-field"
                value={newOrder.customer_id}
                onChange={e => setNewOrder({...newOrder, customer_id: e.target.value})}
              >
                <option value="">Select customer or type name</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Products / Items</label>
              {newOrder.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-5">
                    <input
                      placeholder="Product name"
                      className="input-field text-sm"
                      value={item.product_name}
                      onChange={e => {
                        const items = [...newOrder.items]
                        items[idx].product_name = e.target.value
                        setNewOrder({...newOrder, items})
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Qty"
                      className="input-field text-sm"
                      value={item.quantity}
                      onChange={e => {
                        const items = [...newOrder.items]
                        items[idx].quantity = Number(e.target.value)
                        setNewOrder({...newOrder, items})
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Rate ₹"
                      className="input-field text-sm"
                      value={item.unit_price || ''}
                      onChange={e => {
                        const items = [...newOrder.items]
                        items[idx].unit_price = Number(e.target.value)
                        setNewOrder({...newOrder, items})
                      }}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {idx > 0 && (
                      <button onClick={() => setNewOrder({...newOrder, items: newOrder.items.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setNewOrder({...newOrder, items: [...newOrder.items, {product_id:'', product_name:'', quantity:1, unit_price:0}]})}
                className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Delivery Date</label>
                <input type="date" className="input-field" value={newOrder.delivery_date} onChange={e => setNewOrder({...newOrder, delivery_date: e.target.value})} />
              </div>
              <div>
                <label className="label">Order Total</label>
                <div className="input-field bg-gray-50 font-bold text-brand-700">
                  {formatCurrency(newOrder.items.reduce((s,i) => s + i.quantity * i.unit_price, 0))}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input-field" rows={2} placeholder="Any special instructions..." value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewOrder(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createOrder} className="btn-primary flex-1">Create Order</button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Simulator */}
      {showWASimulator && (
        <Modal title="📱 WhatsApp Order Simulator" onClose={() => { setShowWASimulator(false); setParsedOrder(null); }}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              <p className="font-semibold mb-1">Demo Mode</p>
              <p>This simulates how BizFlow auto-captures orders from WhatsApp. Try one of the examples or type your own.</p>
            </div>

            {/* Sample messages */}
            <div>
              <label className="label">Sample WhatsApp Messages</label>
              <div className="space-y-2">
                {waMessages.map((msg, i) => (
                  <button key={i} onClick={() => setWaMessage(msg)} className="w-full text-left p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-800 transition-all border border-gray-100 hover:border-brand-200">
                    💬 {msg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">WhatsApp Message</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Paste or type WhatsApp message here..."
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
              />
            </div>

            <button onClick={simulateWAOrder} disabled={!waMessage.trim()} className="btn-primary w-full">
              <MessageCircle className="w-4 h-4" />
              Parse Order with AI
            </button>

            {/* Parsed Result */}
            {parsedOrder && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-600" />
                  <p className="font-semibold text-brand-800">Order Parsed Successfully!</p>
                </div>
                <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                  <p className="text-gray-600 font-medium">Extracted from message:</p>
                  {parsedOrder.extracted.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-semibold">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                  {parsedOrder.extracted.items.length === 0 && (
                    <p className="text-gray-500 italic">Draft order created — add product details manually</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setParsedOrder(null)} className="btn-secondary flex-1 text-sm">Edit</button>
                  <button onClick={confirmWAOrder} className="btn-primary flex-1 text-sm">
                    ✓ Confirm & Save Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const demoOrders = [
  { id: '1', order_number: 'ORD-240001', customers: { name: 'Suresh Traders', phone: '+91 98765 11111' }, order_date: new Date().toISOString(), total_amount: 84500, source: 'whatsapp', status: 'confirmed' },
  { id: '2', order_number: 'ORD-240002', customers: { name: 'Mehta Brothers', phone: '+91 98765 22222' }, order_date: new Date().toISOString(), total_amount: 32000, source: 'manual', status: 'pending' },
  { id: '3', order_number: 'ORD-240003', customers: { name: 'Kapoor Stores', phone: '+91 98765 33333' }, order_date: new Date(Date.now()-86400000).toISOString(), total_amount: 156000, source: 'whatsapp', status: 'processing' },
]
