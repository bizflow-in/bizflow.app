import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateInput(date: string | Date): string {
  return new Date(date).toISOString().split('T')[0]
}

export function generateOrderNumber(): string {
  const prefix = 'ORD'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${prefix}-${timestamp}${random}`
}

export function generateInvoiceNumber(existing: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const seq = (existing + 1).toString().padStart(4, '0')
  return `INV-${year}${month}-${seq}`
}

export function validateGSTIN(gstin: string): boolean {
  const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/
  return regex.test(gstin)
}

export function calculateGST(amount: number, rate: number, isIntraState: boolean) {
  const gstAmount = (amount * rate) / 100
  if (isIntraState) {
    return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 }
  } else {
    return { cgst: 0, sgst: 0, igst: gstAmount }
  }
}

export function getStateCode(gstin: string): string {
  return gstin.substring(0, 2)
}

export function isIntraState(sellerGSTIN: string, buyerGSTIN: string): boolean {
  if (!sellerGSTIN || !buyerGSTIN) return true
  return getStateCode(sellerGSTIN) === getStateCode(buyerGSTIN)
}

export function getOverdueDays(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diff = today.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getPaymentStatus(dueDate: string): 'upcoming' | 'due' | 'overdue' {
  const days = getOverdueDays(dueDate)
  if (days < 0) return 'upcoming'
  if (days === 0) return 'due'
  return 'overdue'
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + '…' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function parseWhatsAppMessage(text: string): {
  isOrder: boolean
  items?: { product: string; quantity: string }[]
  customer?: string
  notes?: string
} {
  const orderKeywords = ['order', 'chahiye', 'bhejo', 'send', 'need', 'want', 'piece', 'kg', 'metre', 'strip', 'box']
  const lowerText = text.toLowerCase()
  const isOrder = orderKeywords.some(kw => lowerText.includes(kw))

  if (!isOrder) return { isOrder: false }

  // Simple pattern matching for demo
  const items: { product: string; quantity: string }[] = []
  const lines = text.split('\n').filter(l => l.trim())
  
  for (const line of lines) {
    const match = line.match(/(\d+[\d.]*)\s*(kg|piece|pc|metre|m|strip|box|roll|bag|ton|quintal)?\s+(.+)/i)
    if (match) {
      items.push({ quantity: `${match[1]} ${match[2] || 'pcs'}`, product: match[3] })
    }
  }

  return { isOrder: true, items: items.length > 0 ? items : undefined }
}
