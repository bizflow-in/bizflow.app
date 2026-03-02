'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { getNicheConfig } from '@/lib/niche/config'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileText,
  CreditCard, Truck, MessageSquare, Menu, X, LogOut,
  ChevronRight, Bell, Settings, MessageCircle
} from 'lucide-react'
import type { User } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/vendors', label: 'Vendors', icon: Truck },
  { href: '/dashboard/community', label: 'Community', icon: MessageSquare },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, user, setUser } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) setUser(data as User)
      else {
        // New user — redirect to onboarding
        window.location.href = '/auth/onboarding'
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const nicheConfig = user ? getNicheConfig(user.niche) : null

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-lg">⚡</span>
        </div>
        {sidebarOpen && (
          <div className="animate-in">
            <div className="font-bold text-gray-900">BizFlow</div>
            {nicheConfig && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <span>{nicheConfig.emoji}</span> {nicheConfig.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', active ? 'nav-item-active' : 'nav-item-inactive')}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-brand-600' : 'text-gray-500')} />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && active && <ChevronRight className="w-4 h-4 ml-auto text-brand-400" />}
            </Link>
          )
        })}
      </nav>

      {/* WhatsApp Demo Banner */}
      {sidebarOpen && (
        <div className="mx-3 mb-3 p-3 bg-[#25D366]/10 rounded-xl border border-[#25D366]/20">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span className="text-xs font-semibold text-[#128C7E]">WhatsApp Connected</span>
          </div>
          <p className="text-xs text-gray-500">Demo mode — orders simulated</p>
        </div>
      )}

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-700">
                {user?.owner_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.owner_name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.business_name}</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center p-2 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
              setMobileOpen(!mobileOpen)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>

          <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
          </Link>

          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">
              {user?.owner_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
