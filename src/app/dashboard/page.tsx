'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { getNicheConfig } from '@/lib/niche/config'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Package, ShoppingCart,
  AlertTriangle, Clock, Plus, ArrowRight, Wallet
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAppStore()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    totalOrders: 0,
    lowStockCount: 0,
    weekIncoming: 0,
    weekOutgoing: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: string; order_number: string; total_amount: number;
    status: string; created_at: string; customer?: { name: string }
  }>>([])
  const [lowStockItems, setLowStockItems] = useState<Array<{
    id: string; name: string; stock_quantity: number; low_stock_alert: number; unit: string
  }>>([])
  const [cashFlowData, setCashFlowData] = useState<Array<{ week: string; incoming: number; outgoing: number }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    loadDashboard()
  }, [user])

  const loadDashboard = async () => {
    const userId = user!.id

    // Fetch stats in parallel
    const [ordersRes, invoicesRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id, total_amount, status, created_at, order_number, customer:customers(name)')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('total, status').eq('user_id', userId),
      supabase.from('products').select('id, name, stock_quantity, low_stock_alert, unit')
        .eq('user_id', userId).eq('is_active', true),
    ])

    const orders = ordersRes.data || []
    const invoices = invoicesRes.data || []
    const products = productsRes.data || []

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const pendingAmount = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0)
    const lowStock = products.filter(p => p.stock_quantity <= p.low_stock_alert)

    // Simulated cash flow data (replace with real queries in production)
    const cashFlow = [
      { week: 'W1', incoming: 45000, outgoing: 28000 },
      { week: 'W2', incoming: 68000, outgoing: 35000 },
      { week: 'W3', incoming: 52000, outgoing: 42000 },
      { week: 'W4', incoming: 89000, outgoing: 31000 },
      { week: 'W5', incoming: 73000, outgoing: 55000 },
    ]

    setStats({
      totalRevenue,
      pendingAmount,
      totalOrders: orders.length,
      lowStockCount: lowStock.length,
      weekIncoming: cashFlow[cashFlow.length - 1].incoming,
      weekOutgoing: cashFlow[cashFlow.length - 1].outgoing,
    })
    setRecentOrders(orders as typeof recentOrders)
    setLowStockItems(lowStock)
    setCashFlowData(cashFlow)
    setLoading(false)
  }

  const nicheConfig = user ? getNicheConfig(user.niche) : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card h-28 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const netPosition = stats.weekIncoming - stats.weekOutgoing

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Namaste, {user?.owner_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {nicheConfig?.emoji} {user?.business_name} · {nicheConfig?.label}
          </p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary hidden sm:flex">
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Revenue</span>
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
          <div className="text-xs text-brand-600 mt-1">↑ from paid invoices</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pending Amount</span>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</div>
          <div className="text-xs text-orange-600 mt-1">Outstanding invoices</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Orders</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Low Stock</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <Package className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</div>
          <div className={`text-xs mt-1 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.lowStockCount > 0 ? 'Items need restocking' : 'All stocked up'}
          </div>
        </div>
      </div>

      {/* Cash Flow + Chart */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Cash Flow Cards */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">This Week</h2>
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">Aane wala paisa 💰</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.weekIncoming)}</div>
            <div className="text-xs opacity-70 mt-1">Incoming this week</div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">Jane wala paisa 📤</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.weekOutgoing)}</div>
            <div className="text-xs opacity-70 mt-1">Outgoing this week</div>
          </div>
          <div className={`rounded-2xl p-5 ${netPosition >= 0 ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white' : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'}`}>
            <div className="text-sm opacity-80 mb-1">Net Position</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {netPosition >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {formatCurrency(Math.abs(netPosition))}
            </div>
            <div className="text-xs opacity-70 mt-1">{netPosition >= 0 ? 'Surplus' : 'Deficit'} this week</div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Cash Flow Trend</h2>
            <span className="text-xs text-gray-400 badge bg-gray-100">Last 5 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outgoing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="incoming" stroke="#22c55e" strokeWidth={2} fill="url(#incoming)" name="Incoming" />
              <Area type="monotone" dataKey="outgoing" stroke="#ef4444" strokeWidth={2} fill="url(#outgoing)" name="Outgoing" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No orders yet.{' '}
                <Link href="/dashboard/orders/new" className="text-brand-600 hover:underline">Create first order →</Link>
              </div>
            ) : recentOrders.map(order => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                  <div className="text-xs text-gray-400">{(order.customer as { name?: string })?.name || 'Unknown'} · {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.total_amount)}</div>
                  <span className={`badge text-xs ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              Low Stock Alerts
              {lowStockItems.length > 0 && (
                <span className="badge bg-red-100 text-red-700">{lowStockItems.length}</span>
              )}
            </h2>
            <Link href="/dashboard/inventory" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              Inventory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                All items are well stocked ✅
              </div>
            ) : lowStockItems.slice(0, 5).map(item => {
              const pct = Math.max(5, (item.stock_quantity / item.low_stock_alert) * 100)
              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-xs text-red-600 font-medium">
                      {item.stock_quantity} {item.unit} left
                    </span>
                  </div>
                  <div className="stock-bar">
                    <div
                      className="stock-fill-low"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Min. threshold: {item.low_stock_alert} {item.unit}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* WhatsApp Demo */}
      <div className="bg-[#ECE5DD] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">WhatsApp Order Simulator</div>
            <div className="text-xs text-gray-500">Demo mode — no WhatsApp API needed</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-start">
            <div className="wa-bubble-incoming">
              <p className="text-gray-800">Bhai 50 metres cotton fabric chahiye, red color, Monday tak deliver karo</p>
              <span className="text-[10px] text-gray-400 block text-right mt-1">9:42 AM ✓</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="wa-bubble">
              <p className="text-gray-700">✅ Order ORD-2602-4821 create ho gaya! 50m Cotton Red Fabric, delivery Monday. Total: ₹12,500</p>
              <span className="text-[10px] text-[#34B7F1] block text-right mt-1">9:42 AM ✓✓</span>
            </div>
          </div>
        </div>

        <Link href="/dashboard/orders/new" className="btn-primary inline-flex text-sm">
          <Plus className="w-4 h-4" /> Simulate WhatsApp Order
        </Link>
      </div>
    </div>
  )
}
