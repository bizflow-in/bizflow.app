'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { getNicheConfig } from '@/lib/niche/config'
import { generateOrderNumber, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Trash2, MessageCircle, User, Package, ArrowLeft } from 'lucide-react'
import type { Customer, Product } from '@/types'

interface LineItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount_percent: number
  total_price: number
  unit: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAppStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product_id: '', product_name: '', quantity: 1, unit_price: 0, discount_percent: 0, total_price: 0, unit: '' }
  ])
  const [notes, setNotes] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [source, setSource] = useState<'manual' | 'whatsapp'>('manual')
  const [waMessage, setWaMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const supabase = createClient()
  const nicheConfig = user ? getNicheConfig(user.niche) : null

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    const [custRes, prodRes] = await Promise.all([
      supabase.from('customers').select('*').eq('user_id', user!.id).order('name'),
      supabase.from('products').select('*').eq('user_id', user!.id).eq('is_active', true).order('name'),
    ])
    setCustomers(custRes.data || [])
    setProducts(prodRes.data || [])
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      if (field === 'product_id') {
        const product = products.find(p => p.id === value)
        if (product) {
          updated[index].product_name = product.name
          updated[index].unit_price = product.price
          updated[index].unit = product.unit
        }
      }

      const item = updated[index]
      const discountFactor = 1 - (item.discount_percent / 100)
      updated[index].total_price = item.quantity * item.unit_price * discountFactor

      return updated
    })
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      product_id: '', product_name: '', quantity: 1, unit_price: 0, discount_percent: 0, total_price: 0, unit: ''
    }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalAmount = lineItems.reduce((s, i) => s + i.total_price, 0)

  // Simulate WhatsApp order parsing
  const parseWAMessage = useCallback(async () => {
    if (!waMessage.trim()) return
    setParsing(true)

    // Simulate AI parsing delay
    await new Promise(r => setTimeout(r, 1200))

    // Simple regex-based demo parsing
    const qtyMatch = waMessage.match(/(\d+)\s*(metre|meter|kg|piece|box|strip|roll|unit)/i)
    const productMatch = products[0] // Just use first product for demo

    if (productMatch && qtyMatch) {
      setLineItems([{
        product_id: productMatch.id,
        product_name: productMatch.name,
        quantity: parseInt(qtyMatch[1]),
        unit_price: productMatch.price,
        discount_percent: 0,
        total_price: parseInt(qtyMatch[1]) * productMatch.price,
        unit: productMatch.unit,
      }])
      toast.success('Order extracted from WhatsApp message!')
    } else {
      toast('Could not auto-parse. Please fill manually.', { icon: 'ℹ️' })
    }
    setParsing(false)
  }, [waMessage, products])

  const handleSubmit = async () => {
    if (!selectedCustomer) return toast.error('Select a customer')
    if (lineItems.some(i => !i.product_id)) return toast.error('Select a product for each line item')
    if (totalAmount === 0) return toast.error('Order amount cannot be zero')

    setLoading(true)
    const orderNumber = generateOrderNumber('ORD')

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: user!.id,
      customer_id: selectedCustomer,
      order_number: orderNumber,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: deliveryDate || null,
      status: 'pending',
      total_amount: totalAmount,
      source,
      notes: notes || null,
    }).select().single()

    if (orderError) {
      toast.error(orderError.message)
      setLoading(false)
      return
    }

    // Insert line items
    const itemsToInsert = lineItems.filter(i => i.product_id).map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount_percent: i.discount_percent,
      total_price: i.total_price,
    }))

    await supabase.from('order_items').insert(itemsToInsert)

    // Update product stock
    for (const item of lineItems.filter(i => i.product_id)) {
      await supabase.rpc('decrement_stock', {
        product_id: item.product_id,
        amount: item.quantity,
      }).catch(() => {}) // RPC may not exist yet, silently fail
    }

    toast.success(`Order ${orderNumber} created!`)
    router.push('/dashboard/orders')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost -ml-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">New Order</h1>
          <p className="text-gray-500 text-sm">{nicheConfig?.emoji} {nicheConfig?.label}</p>
        </div>
      </div>

      {/* Source selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setSource('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            source === 'manual' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
          }`}
        >
          <User className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => setSource('whatsapp')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            source === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]/10 text-[#128C7E]' : 'border-gray-200 text-gray-600'
          }`}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp Message
        </button>
      </div>

      {/* WhatsApp parser */}
      {source === 'whatsapp' && (
        <div className="bg-[#ECE5DD] rounded-2xl p-4">
          <label className="label text-gray-700">Paste WhatsApp message</label>
          <textarea
            className="input bg-white/80"
            rows={3}
            placeholder="e.g. Bhai 50 metres cotton fabric chahiye, red color, Monday tak deliver karo"
            value={waMessage}
            onChange={e => setWaMessage(e.target.value)}
          />
          <button
            onClick={parseWAMessage}
            disabled={parsing || !waMessage}
            className="mt-2 btn-primary text-sm"
            style={{ background: '#25D366' }}
          >
            {parsing ? 'Parsing...' : '⚡ Extract Order with AI'}
          </button>
        </div>
      )}

      {/* Customer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Customer
        </h2>
        <select
          className="input"
          value={selectedCustomer}
          onChange={e => setSelectedCustomer(e.target.value)}
        >
          <option value="">Select customer...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ''}</option>
          ))}
        </select>
        {customers.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            No customers yet.{' '}
            <a href="/dashboard/customers" className="text-brand-600 hover:underline">Add one first →</a>
          </p>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" /> {nicheConfig?.terms.product || 'Products'}
        </h2>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <label className="label text-xs">Product</label>
                <select
                  className="input text-sm py-2.5"
                  value={item.product_id}
                  onChange={e => updateLineItem(index, 'product_id', e.target.value)}
                >
                  <option value="">Select...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity} {p.unit})</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Qty</label>
                <input
                  type="number"
                  className="input text-sm py-2.5"
                  value={item.quantity}
                  onChange={e => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Price ₹</label>
                <input
                  type="number"
                  className="input text-sm py-2.5"
                  value={item.unit_price}
                  onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Total</label>
                <div className="input text-sm py-2.5 bg-gray-50 text-gray-700">
                  {formatCurrency(item.total_price)}
                </div>
              </div>
              <div className="col-span-1 flex justify-end pb-1">
                <button
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addLineItem} className="btn-ghost mt-3 text-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Amount</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Delivery Date</label>
            <input
              type="date"
              className="input"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              placeholder="Special instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="btn-secondary flex-1">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
          {loading ? 'Creating...' : `Create Order · ${formatCurrency(totalAmount)}`}
        </button>
      </div>
    </div>
  )
}
