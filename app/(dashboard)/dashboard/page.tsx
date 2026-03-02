'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getOverdueDays } from '@/lib/utils'
import { getNicheConfig } from '@/lib/constants'
import type { User, Order, Invoice, Product } from '@/lib/types'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, ShoppingCart, AlertTriangle,
  FileText, Clock, CheckCircle, Package, ArrowRight, 
  MessageCircle, Plus, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'

// Demo cash flow data
const cashFlowData = [
  { day: 'Mon', in: 45000, out: 20000 },
  { day: 'Tue', in: 32000, out: 15000 },
  { day: 'Wed', in: 67000, out: 35000 },
  { day: 'Thu', in: 28000, out: 18000 },
  { day: 'Fri', in: 89000, out: 42000 },
  { day: 'Sat', in: 52000, out: 28000 },
  { day: 'Sun', in: 15000, out: 10000 },
]

const statusColors: Record<string, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-blue',
  dispatched: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoicesAmount: 0,
    totalOrders: 0,
    lowStockCount: 0,
    incomingWeek: 0,
    outgoingWeek: 0,
    recentOrders: [] as any[],
    overdueInvoices: [] as any[],
    lowStockItems: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch user profile
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (profile) setUser(profile)

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*, customers(name, phone)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch pending invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['unpaid', 'partial'])
        .order('due_date', { ascending: true })
        .limit(5)

      // Fetch low stock products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .filter('stock_quantity', 'lte', 'low_stock_alert')
        .limit(5)

      // Calculate totals
      const totalRevenue = (orders || []).filter(o => o.status === 'delivered').reduce((sum: number, o: any) => sum + o.total_amount, 0)
      const pendingAmount = (invoices || []).reduce((sum: number, i: any) => sum + i.total, 0)
      const overdueList = (invoices || []).filter((i: any) => i.due_date && getOverdueDays(i.due_date) > 0)

      setStats({
        totalRevenue,
        pendingInvoicesAmount: pendingAmount,
        totalOrders: orders?.length || 0,
        lowStockCount: products?.length || 0,
        incomingWeek: pendingAmount * 0.4,
        outgoingWeek: pendingAmount * 0.2,
        recentOrders: orders || [],
        overdueInvoices: overdueList,
        lowStockItems: products || [],
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const niche = user ? getNicheConfig(user.niche) : null
  const netCashFlow = stats.incomingWeek - stats.outgoingWeek

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-up">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-white/20 blur-2xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-sm mb-1">Good morning 👋</p>
            <h2 className="text-xl font-bold" style={{fontFamily:'Sora,sans-serif'}}>
              {user?.business_name || user?.owner_name || 'Your Business'}
            </h2>
            {niche && (
              <p className="text-brand-200 text-sm mt-1">{niche.emoji} {niche.name} • {user?.city || 'India'}</p>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-brand-200 text-xs">Bank Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(user?.bank_balance || 0)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-stagger">
        <StatCard
          title="This Month"
          value={formatCurrency(stats.totalRevenue || 284000)}
          change="+12%"
          positive
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-brand-600"
          bg="bg-brand-50"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(stats.pendingInvoicesAmount || 145000)}
          sub={`${stats.overdueInvoices.length} overdue`}
          icon={<FileText className="w-5 h-5" />}
          color="text-orange-600"
          bg="bg-orange-50"
          alert={stats.overdueInvoices.length > 0}
        />
        <StatCard
          title="Total Orders"
          value={String(stats.totalOrders || 28)}
          sub="this week"
          icon={<ShoppingCart className="w-5 h-5" />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          title="Low Stock"
          value={String(stats.lowStockCount || 5)}
          sub="items need reorder"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-red-600"
          bg="bg-red-50"
          alert={stats.lowStockCount > 0}
        />
      </div>

      {/* Cash Flow Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Cash Flow — This Week</h3>
              <p className="text-sm text-gray-500">Incoming vs Outgoing</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-brand-500 inline-block"></span>Incoming</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-saffron-400 inline-block"></span>Outgoing</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashFlowData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{fontSize:12}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: any) => formatCurrency(v)}
                contentStyle={{borderRadius:'12px', border:'1px solid #e5e7eb', fontSize:'13px'}}
              />
              <Bar dataKey="in" fill="#16a34a" radius={[6,6,0,0]} />
              <Bar dataKey="out" fill="#fb923c" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Position */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Aane wala paisa</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Incoming (this week)</p>
                <p className="font-bold text-green-700">{formatCurrency(stats.incomingWeek || 89000)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Outgoing (this week)</p>
                <p className="font-bold text-orange-700">{formatCurrency(stats.outgoingWeek || 42000)}</p>
              </div>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl ${netCashFlow >= 0 ? 'bg-brand-50' : 'bg-red-50'}`}>
              <div>
                <p className="text-xs text-gray-500">Net Position</p>
                <p className={`font-bold text-lg ${netCashFlow >= 0 ? 'text-brand-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(netCashFlow || 47000))}
                </p>
              </div>
              <Zap className={`w-5 h-5 ${netCashFlow >= 0 ? 'text-brand-600' : 'text-red-600'}`} />
            </div>
          </div>

          <div className="mt-auto">
            <p className="text-xs text-gray-500 mb-1">Safe to spend</p>
            <p className="text-2xl font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>
              {formatCurrency((user?.bank_balance || 0) + (netCashFlow || 47000))}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column: Recent Orders + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Recent Orders</h3>
            <Link href="/orders" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <EmptyState icon="🛒" text="No orders yet" cta="Create Order" href="/orders" />
          ) : (
            <div className="space-y-3">
              {(stats.recentOrders.length > 0 ? stats.recentOrders : demoOrders).map((order: any, i: number) => (
                <Link key={order.id || i} href={`/orders/${order.id || i}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {order.customers?.name || order.customer_name || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">{order.order_number || `ORD-${i+1}`} • {formatDate(order.order_date || new Date())}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <span className={statusColors[order.status] || 'badge-gray'}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Alerts</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
              {(stats.overdueInvoices.length + stats.lowStockCount) || 3} actions needed
            </span>
          </div>

          <div className="space-y-3">
            {/* Overdue Invoices */}
            {(stats.overdueInvoices.length > 0 ? stats.overdueInvoices : demoOverdue).slice(0,3).map((inv: any, i: number) => (
              <Link key={inv.id || i} href="/invoices" className="flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-red-900">{inv.invoice_number || `INV-${i+1}`}</p>
                  <p className="text-xs text-red-600">{inv.overdue_days || (i+1)*3} days overdue</p>
                </div>
                <p className="font-bold text-sm text-red-700 flex-shrink-0">{formatCurrency(inv.total || 25000 + i*10000)}</p>
              </Link>
            ))}

            {/* Low Stock */}
            {(stats.lowStockItems.length > 0 ? stats.lowStockItems : demoLowStock).slice(0,2).map((prod: any, i: number) => (
              <Link key={prod.id || `ls${i}`} href="/inventory" className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-all">
                <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-yellow-900">{prod.name || `Product ${i+1}`}</p>
                  <p className="text-xs text-yellow-600">Only {prod.stock_quantity || (i+1)*2} {prod.unit || 'pcs'} left</p>
                </div>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-semibold flex-shrink-0">Low Stock</span>
              </Link>
            ))}

            <Link href="/orders" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900">3 WhatsApp orders pending</p>
                <p className="text-xs text-blue-600">Review and confirm</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4" style={{fontFamily:'Sora,sans-serif'}}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Order', icon: '🛒', href: '/orders', color: 'bg-brand-50 hover:bg-brand-100 border-brand-100' },
            { label: 'Add Customer', icon: '👤', href: '/customers', color: 'bg-blue-50 hover:bg-blue-100 border-blue-100' },
            { label: 'Create Invoice', icon: '📄', href: '/invoices', color: 'bg-purple-50 hover:bg-purple-100 border-purple-100' },
            { label: 'Add Product', icon: '📦', href: '/inventory', color: 'bg-orange-50 hover:bg-orange-100 border-orange-100' },
          ].map((action) => (
            <Link key={action.label} href={action.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${action.color} transition-all card-hover`}>
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-semibold text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, change, positive, icon, color, bg, alert }: any) {
  return (
    <div className="stat-card relative">
      {alert && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1" style={{fontFamily:'Sora,sans-serif'}}>{value}</p>
      <div className="flex items-center gap-2">
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {change}
          </span>
        )}
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, cta, href }: any) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-500 text-sm mb-3">{text}</p>
      <Link href={href} className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:underline">
        <Plus className="w-4 h-4" /> {cta}
      </Link>
    </div>
  )
}

// Demo data fallbacks
const demoOrders = [
  { id: '1', customers: { name: 'Suresh Traders' }, order_number: 'ORD-240001', order_date: new Date().toISOString(), total_amount: 84500, status: 'confirmed' },
  { id: '2', customers: { name: 'Mehta Brothers' }, order_number: 'ORD-240002', order_date: new Date().toISOString(), total_amount: 32000, status: 'pending' },
  { id: '3', customers: { name: 'Kapoor Stores' }, order_number: 'ORD-240003', order_date: new Date().toISOString(), total_amount: 156000, status: 'processing' },
]

const demoOverdue = [
  { id: '1', invoice_number: 'INV-2024-001', overdue_days: 12, total: 45000 },
  { id: '2', invoice_number: 'INV-2024-002', overdue_days: 7, total: 28000 },
]

const demoLowStock = [
  { id: '1', name: 'Cotton Fabric (White)', stock_quantity: 45, unit: 'Metres' },
  { id: '2', name: 'Polyester Blend', stock_quantity: 8, unit: 'Rolls' },
]
