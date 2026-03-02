'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getNicheConfig } from '@/lib/constants'
import { getInitials, formatCurrency } from '@/lib/utils'
import type { User } from '@/lib/types'
import {
  LayoutDashboard, ShoppingCart, Users, Package, FileText,
  CreditCard, Truck, MessageSquare, Settings, LogOut, Bell,
  Menu, X, ChevronDown, MessageCircle, TrendingUp
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/vendors', label: 'Vendors', icon: Truck },
  { href: '/community', label: 'Community', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (data) setUser(data)
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nicheConfig = user ? getNicheConfig(user.niche) : null

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-5'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🌿</div>
        <div>
          <span className="text-lg font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>BizFlow</span>
          {nicheConfig && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>{nicheConfig.emoji}</span>
              <span>{nicheConfig.name}</span>
            </div>
          )}
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.href === '/orders' && (
                <span className="ml-auto bg-saffron-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* WhatsApp Demo Banner */}
      <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-green-800">WhatsApp</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Demo</span>
        </div>
        <p className="text-xs text-green-700">Connect WhatsApp to auto-capture orders</p>
        <Link href="/settings" className="mt-2 text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1">
          Configure → 
        </Link>
      </div>

      {/* User Profile */}
      {user && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {getInitials(user.owner_name || user.business_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.business_name || user.owner_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-white shadow-2xl z-10">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 -ml-1"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 hidden sm:block" style={{fontFamily:'Sora,sans-serif'}}>
              {navItems.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'BizFlow'}
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Bank Balance */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-semibold text-brand-700">
                  {formatCurrency(user.bank_balance || 0)}
                </span>
                <span className="text-xs text-brand-500">Balance</span>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-saffron-500 rounded-full"></span>
            </button>

            {/* Profile avatar (mobile) */}
            {user && (
              <div className="lg:hidden w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                {getInitials(user.owner_name || user.business_name || 'U')}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
