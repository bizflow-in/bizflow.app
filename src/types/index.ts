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
  niche_meta?: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_percent: number
  total_price: number
  product?: Product
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'
export type OrderSource = 'manual' | 'whatsapp' | 'community'

export interface Order {
  id: string
  user_id: string
  customer_id: string
  order_number: string
  order_date: string
  delivery_date?: string
  status: OrderStatus
  total_amount: number
  source: OrderSource
  wa_message_id?: string
  notes?: string
  created_at: string
  customer?: Customer
  order_items?: OrderItem[]
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled'

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
  total: number
  status: InvoiceStatus
  pdf_url?: string
  created_at: string
  order?: Order
}

export interface Payment {
  id: string
  invoice_id: string
  user_id: string
  payment_date: string
  amount: number
  method: 'cash' | 'upi' | 'bank_transfer' | 'cheque'
  reference_number?: string
  notes?: string
  created_at: string
  invoice?: Invoice
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
  vendor?: Vendor
}

export type PostType = 'question' | 'market_update' | 'announcement' | 'deal'

export interface CommunityPost {
  id: string
  user_id: string
  niche: string
  type: PostType
  title?: string
  content: string
  tags?: string[]
  upvotes: number
  is_pinned: boolean
  created_at: string
  user?: Pick<User, 'business_name' | 'owner_name' | 'city'>
}

export interface DashboardStats {
  totalRevenue: number
  pendingAmount: number
  totalOrders: number
  lowStockCount: number
  weekIncoming: number
  weekOutgoing: number
  netPosition: number
}

export interface WhatsAppMessage {
  id: string
  from: string
  text: string
  timestamp: number
  type: 'text' | 'image' | 'document'
}
