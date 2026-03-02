'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Filter, ShoppingCart, MessageCircle } from 'lucide-react'
import type { Order } from '@/types'

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled']

export default function OrdersPage() {
  const { user } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  const loadOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, customer:customers(id, name, phone)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    const { data } = await query
    setOrders((data || []) as Order[])
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer as { name?: string })?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o))
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try adjusting your search' : 'Create your first order to get started'}
            </p>
            {!search && (
              <Link href="/dashboard/orders/new" className="btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" /> Create Order
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="table-row">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-700">{(order.customer as { name?: string })?.name || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{formatDate(order.order_date)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer min-h-0 ${getStatusColor(order.status)}`}
                    >
                      {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-5 py-4 text-right hidden lg:table-cell">
                    {order.source === 'whatsapp' ? (
                      <span className="badge bg-[#25D366]/10 text-[#128C7E] flex items-center gap-1 justify-end">
                        <MessageCircle className="w-3 h-3" /> WA
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500">Manual</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-xs text-brand-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
