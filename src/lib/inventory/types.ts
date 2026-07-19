export interface BusinessProfile {
  id: string
  owner_id: string
  business_name: string
  business_type: string | null
  full_name: string
  currency: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  owner_id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  owner_id: string
  name: string
  sku: string | null
  barcode: string | null
  category_id: string | null
  supplier_id: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  reorder_level: number
  unit: string
  image_url: string | null
  description: string | null
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name'> | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  batches?: ProductBatch[]
}

export interface ProductBatch {
  id: string
  owner_id: string
  product_id: string
  batch_name: string
  quantity: number
  cost_price: number
  expiration_date: string | null
  created_at: string
  updated_at: string
}

export interface ProductSet {
  id: string
  owner_id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
  items: ProductSetItem[]
}

export interface ProductSetItem {
  id: string
  owner_id: string
  product_set_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Pick<Product, 'id' | 'name' | 'selling_price' | 'stock_quantity'> | null
}

export interface StockAdjustment {
  id: string
  owner_id: string
  product_id: string
  change: number
  resulting_qty: number
  reason: string
  source: 'manual' | 'purchase_order' | 'sale_order'
  source_id: string | null
  notes: string | null
  created_at: string
}

export type PurchaseOrderStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  owner_id: string
  supplier_id: string | null
  status: PurchaseOrderStatus
  total_cost: number
  handling_fee: number
  shipping_fee: number
  expected_date: string | null
  received_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  owner_id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  created_at: string
  updated_at: string
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null
}

export type SalesOrderStatus = 'awaiting_payment' | 'paid' | 'reversed'

export interface SalesOrder {
  id: string
  owner_id: string
  order_number: string
  customer_name: string | null
  customer_contact: string | null
  subtotal: number
  discount: number
  shipping_fee: number
  courier: string | null
  shipping_paid_by: 'customer' | 'business'
  total: number
  total_cost: number
  gross_profit: number
  margin_pct: number
  payment_method: string
  status: SalesOrderStatus
  receipt_url: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  items?: SalesOrderItem[]
  invoice_items: InvoiceLineItem[] | null
  invoice_title: string | null
}

// A cosmetic override of what the printed invoice shows — see
// updateSaleInvoiceItems in lib/inventory/sales.ts.
export interface InvoiceLineItem {
  label: string
  quantity: number
  unit_price: number
}

export interface SalesOrderItem {
  id: string
  owner_id: string
  sales_order_id: string
  product_id: string | null
  product_name: string
  sku: string | null
  quantity: number
  unit_cost: number
  unit_price: number
  line_cost: number
  line_revenue: number
  line_profit: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  owner_id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  purchase_order_id: string | null
  created_at: string
  updated_at: string
}

export type DateRangeKey = '7d' | '30d' | '90d' | '12m'

export interface DashboardMetrics {
  totalRevenue: number
  totalCogs: number
  grossProfit: number
  totalExpenses: number
  netProfit: number
  inventoryValue: number
  totalOrders: number
  pendingDeliveries: number
  lowStock: { count: number; items: Array<Pick<Product, 'id' | 'name' | 'stock_quantity' | 'reorder_level'>> }
  topProducts: Array<{ productId: string | null; name: string; unitsSold: number; revenue: number; profit: number }>
  salesTrend: Array<{ date: string; revenue: number; profit: number; orders: number }>
  expenseBreakdown: Array<{ category: string; amount: number }>
}

export type PromoRewardType = 'fixed_discount' | 'percent_discount' | 'free_item'

export interface Promo {
  id: string
  owner_id: string
  code: string
  reward_type: PromoRewardType
  reward_value: number
  active: boolean
  created_at: string
  updated_at: string
  trigger_product_ids: string[]
  reward_product_ids: string[]
}
