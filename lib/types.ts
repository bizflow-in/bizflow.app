export interface User {
  id: string
  phone?: string
  email?: string
  business_name: string
  owner_name: string
  gstin?: string
  city?: string
  state?: string
  niche: string
  bank_balance: number
  wa_number?: string
  logo_url?: string
  onboarding_complete: boolean
  created_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  phone?: string
  gstin?: string
  billing_address?: string
  city?: string
  state?: string
  credit_limit: number
  payment_score: number
  total_outstanding: number
  notes?: string
  created_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  hsn_code?: string
  unit: string
  price: number
  cost_price?: number
  stock_quantity: number
  low_stock_alert: number
  niche_meta?: Record<string, any>
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_id?: string
  order_number: string
  order_date: string
  delivery_date?: string
  status: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'
  total_amount: number
  source: 'manual' | 'whatsapp' | 'community'
  wa_message_id?: string
  notes?: string
  created_at: string
  customers?: Customer
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name?: string
  quantity: number
  unit_price: number
  discount_percent: number
  total_price: number
  products?: Product
}

export interface Invoice {
  id: string
  order_id: string
  user_id: string
  invoice_number: string
  invoice_date: string
  due_date?: string
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  gst_rate?: number
  total: number
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled'
  pdf_url?: string
  created_at: string
  orders?: Order & { customers?: Customer; order_items?: (OrderItem & { products?: Product })[] }
}

export interface Payment {
  id: string
  invoice_id: string
  user_id: string
  payment_date: string
  amount: number
  method: string
  reference_number?: string
  notes?: string
  created_at: string
  invoices?: Invoice
}

export interface Vendor {
  id: string
  user_id: string
  name: string
  phone?: string
  gstin?: string
  address?: string
  credit_terms: number
  total_outstanding: number
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  vendor_id: string
  purchase_date: string
  due_date?: string
  total_amount: number
  paid_amount: number
  invoice_number?: string
  notes?: string
  created_at: string
  vendors?: Vendor
}

export interface CommunityPost {
  id: string
  user_id: string
  niche: string
  type: 'question' | 'market_update' | 'announcement' | 'deal'
  title?: string
  content: string
  tags?: string[]
  upvotes: number
  created_at: string
  users?: Pick<User, 'business_name' | 'niche' | 'city'>
}

export interface DashboardStats {
  totalRevenue: number
  pendingInvoices: number
  totalOrders: number
  lowStockItems: number
  incomingThisWeek: number
  outgoingThisWeek: number
  recentOrders: Order[]
  cashFlowData: { date: string; in: number; out: number }[]
}
