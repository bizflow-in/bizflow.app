export const NICHES = {
  textile: {
    key: 'textile',
    name: 'Textile / Apparel',
    emoji: '🧵',
    units: ['Metres', 'KG', 'Rolls', 'Pieces'],
    defaultUnit: 'Metres',
    productLabel: 'Fabric',
    batchLabel: 'Lot No.',
    hsnRange: 'Chapter 50–63',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  pharma: {
    key: 'pharma',
    name: 'Pharma Distribution',
    emoji: '💊',
    units: ['Strips', 'Boxes', 'Vials', 'Bottles'],
    defaultUnit: 'Strips',
    productLabel: 'Medicine',
    batchLabel: 'Batch No.',
    hsnRange: 'Chapter 30',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  steel: {
    key: 'steel',
    name: 'Steel / Metal',
    emoji: '⚙️',
    units: ['KG', 'Tonnes', 'Pieces', 'Bundles'],
    defaultUnit: 'KG',
    productLabel: 'Material',
    batchLabel: 'Heat No.',
    hsnRange: 'Chapter 72–73',
    color: '#6B7280',
    bgColor: '#F9FAFB',
  },
  electrical: {
    key: 'electrical',
    name: 'Electrical Goods',
    emoji: '🔌',
    units: ['Pieces', 'Sets', 'Boxes', 'Coils'],
    defaultUnit: 'Pieces',
    productLabel: 'Product',
    batchLabel: 'Serial No.',
    hsnRange: 'Chapter 85',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  agri: {
    key: 'agri',
    name: 'Agri / FMCG',
    emoji: '🌾',
    units: ['KG', 'Quintals', 'Tonnes', 'Bags'],
    defaultUnit: 'KG',
    productLabel: 'Commodity',
    batchLabel: 'Lot No.',
    hsnRange: 'Chapter 1–24',
    color: '#22C55E',
    bgColor: '#F0FDF4',
  },
  construction: {
    key: 'construction',
    name: 'Construction / Building',
    emoji: '🏗️',
    units: ['KG', 'Tonnes', 'Bags', 'Pieces', 'Sqft'],
    defaultUnit: 'Bags',
    productLabel: 'Material',
    batchLabel: 'Batch No.',
    hsnRange: 'Chapter 25–27',
    color: '#78716C',
    bgColor: '#FAFAF9',
  },
  auto: {
    key: 'auto',
    name: 'Auto Parts',
    emoji: '🚗',
    units: ['Pieces', 'Sets', 'Boxes'],
    defaultUnit: 'Pieces',
    productLabel: 'Part',
    batchLabel: 'Part No.',
    hsnRange: 'Chapter 87',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  retail: {
    key: 'retail',
    name: 'General Retail',
    emoji: '🛒',
    units: ['Pieces', 'Boxes', 'KG', 'Litres'],
    defaultUnit: 'Pieces',
    productLabel: 'Product',
    batchLabel: 'SKU',
    hsnRange: 'Various',
    color: '#EC4899',
    bgColor: '#FDF2F8',
  },
}

export type NicheKey = keyof typeof NICHES
export type NicheConfig = typeof NICHES[NicheKey]

export function getNicheConfig(niche: string): NicheConfig {
  return NICHES[niche as NicheKey] || NICHES.retail
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
]

export const GST_RATES = [0, 5, 12, 18, 28]

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled']
export const INVOICE_STATUSES = ['unpaid', 'partial', 'paid', 'cancelled']
export const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'neft', 'rtgs']
