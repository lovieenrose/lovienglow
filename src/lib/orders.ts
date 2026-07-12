import { getSupabaseAdmin, uploadReceipt } from './supabase'
import products from '@/data/products'

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded'
export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface OrderItemInput {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface CreateOrderInput {
  fullName: string
  contactNumber: string
  email: string
  socialHandle: string
  address: string
  courier: string
  region: string
  paymentMethod: string
  items: OrderItemInput[]
  subtotal: number
  shippingFee: number
  total: number
  receiptBase64: string
  receiptFilename: string
  receiptContentType: string
}

export interface OrderRow {
  id: string
  reference: string
  placed_at: string
  full_name: string
  contact_number: string
  email: string | null
  social_handle: string | null
  address: string
  courier: string
  region: string | null
  payment_method: string
  receipt_url: string | null
  receipt_filename: string | null
  subtotal: number
  shipping_fee: number
  total: number
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  tracking_number: string | null
  internal_notes: string
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface StatusHistoryRow {
  id: string
  order_id: string
  field: string
  old_value: string | null
  new_value: string
  note: string | null
  changed_at: string
}

export interface EmailLogRow {
  id: string
  order_id: string
  email_type: string
  sent_to: string
  subject: string | null
  success: boolean
  sent_at: string
}

export interface OrderWithRelations extends OrderRow {
  items: OrderItemRow[]
  history: StatusHistoryRow[]
  emails: EmailLogRow[]
}

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

function base64ToBytes(base64: string) {
  return new Uint8Array(Buffer.from(base64, 'base64'))
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithRelations> {
  const bytes = base64ToBytes(input.receiptBase64)
  if (bytes.byteLength > MAX_RECEIPT_BYTES) {
    throw new Error('Receipt file exceeds the 5 MB limit')
  }

  const supabase = getSupabaseAdmin()

  const { data: refData, error: refError } = await supabase.rpc('next_order_reference')
  if (refError) throw refError
  const reference = refData as string

  const receiptUrl = await uploadReceipt(input.receiptFilename, input.receiptContentType, bytes)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      reference,
      placed_at: new Date().toISOString(),
      full_name: input.fullName,
      contact_number: input.contactNumber,
      email: input.email || null,
      social_handle: input.socialHandle || null,
      address: input.address,
      courier: input.courier,
      region: input.region || null,
      payment_method: input.paymentMethod,
      receipt_url: receiptUrl,
      receipt_filename: input.receiptFilename,
      subtotal: input.subtotal,
      shipping_fee: input.shippingFee,
      total: input.total,
    })
    .select()
    .single()
  if (orderError) throw orderError

  const orderRow = order as OrderRow

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .insert(
      input.items.map((item) => ({
        order_id: orderRow.id,
        product_id: item.productId,
        product_name: item.productName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
      })),
    )
    .select()
  if (itemsError) throw itemsError

  await decrementInventory(input.items)

  return { ...orderRow, items: (items as OrderItemRow[]) ?? [], history: [], emails: [] }
}

export async function decrementInventory(items: OrderItemInput[]) {
  const supabase = getSupabaseAdmin()
  for (const item of items) {
    const { data: current } = await supabase
      .from('product_inventory')
      .select('stock')
      .eq('product_id', item.productId)
      .maybeSingle()
    if (!current) continue
    const nextStock = Math.max(0, (current as { stock: number }).stock - item.quantity)
    await supabase
      .from('product_inventory')
      .update({ stock: nextStock, updated_at: new Date().toISOString() })
      .eq('product_id', item.productId)
  }
}

export async function getOrder(reference: string): Promise<OrderWithRelations | null> {
  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select()
    .eq('reference', reference)
    .maybeSingle()
  if (error) throw error
  if (!order) return null
  const orderRow = order as OrderRow

  const [{ data: items }, { data: history }, { data: emails }] = await Promise.all([
    supabase.from('order_items').select().eq('order_id', orderRow.id),
    supabase.from('order_status_history').select().eq('order_id', orderRow.id).order('changed_at', { ascending: false }),
    supabase.from('email_log').select().eq('order_id', orderRow.id).order('sent_at', { ascending: false }),
  ])

  return {
    ...orderRow,
    items: (items as OrderItemRow[]) ?? [],
    history: (history as StatusHistoryRow[]) ?? [],
    emails: (emails as EmailLogRow[]) ?? [],
  }
}

export interface ListOrdersFilters {
  search?: string
  paymentStatus?: string
  fulfillmentStatus?: string
  courier?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export async function listOrders(filters: ListOrdersFilters = {}) {
  const supabase = getSupabaseAdmin()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 25

  let query = supabase.from('orders').select('*', { count: 'exact' })

  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus) query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  if (filters.courier) query = query.eq('courier', filters.courier)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.search) {
    const term = filters.search.trim()
    query = query.or(
      `reference.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`,
    )
  }

  query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { orders: (data as OrderRow[]) ?? [], total: count ?? 0, page, pageSize }
}

export async function listAllOrdersForExport(filters: ListOrdersFilters = {}) {
  const supabase = getSupabaseAdmin()
  let query = supabase.from('orders').select('*')

  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus)
  if (filters.fulfillmentStatus) query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  if (filters.courier) query = query.eq('courier', filters.courier)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.search) {
    const term = filters.search.trim()
    query = query.or(
      `reference.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`,
    )
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data as OrderRow[]) ?? []
}

export interface UpdateOrderPatch {
  paymentStatus?: PaymentStatus
  fulfillmentStatus?: FulfillmentStatus
  trackingNumber?: string
  internalNotes?: string
  note?: string
}

export async function updateOrder(reference: string, patch: UpdateOrderPatch): Promise<OrderWithRelations> {
  const supabase = getSupabaseAdmin()
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select()
    .eq('reference', reference)
    .single()
  if (fetchError) throw fetchError
  const existingRow = existing as OrderRow

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.trackingNumber !== undefined) update.tracking_number = patch.trackingNumber
  if (patch.internalNotes !== undefined) update.internal_notes = patch.internalNotes
  if (patch.paymentStatus !== undefined) update.payment_status = patch.paymentStatus
  if (patch.fulfillmentStatus !== undefined) update.fulfillment_status = patch.fulfillmentStatus

  const { error: updateError } = await supabase.from('orders').update(update).eq('id', existingRow.id)
  if (updateError) throw updateError

  const historyRows: Array<{ order_id: string; field: string; old_value: string; new_value: string; note: string | null }> = []
  if (patch.paymentStatus !== undefined && patch.paymentStatus !== existingRow.payment_status) {
    historyRows.push({
      order_id: existingRow.id,
      field: 'payment_status',
      old_value: existingRow.payment_status,
      new_value: patch.paymentStatus,
      note: patch.note ?? null,
    })
  }
  if (patch.fulfillmentStatus !== undefined && patch.fulfillmentStatus !== existingRow.fulfillment_status) {
    historyRows.push({
      order_id: existingRow.id,
      field: 'fulfillment_status',
      old_value: existingRow.fulfillment_status,
      new_value: patch.fulfillmentStatus,
      note: patch.note ?? null,
    })
  }
  if (historyRows.length) {
    await supabase.from('order_status_history').insert(historyRows)
  }

  const updated = await getOrder(reference)
  if (!updated) throw new Error('Order not found after update')
  return updated
}

export async function logEmail(orderId: string, emailType: string, sentTo: string, subject: string, success: boolean) {
  const supabase = getSupabaseAdmin()
  await supabase.from('email_log').insert({
    order_id: orderId,
    email_type: emailType,
    sent_to: sentTo,
    subject,
    success,
  })
}

export interface InventoryRow {
  product_id: number
  product_name: string
  stock: number
  low_stock_threshold: number
  updated_at: string
}

export async function getInventory(): Promise<InventoryRow[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('product_inventory').select().order('product_id', { ascending: true })
  if (error) throw error
  const nameById = new Map(products.map((product) => [product.id, product.name]))
  return ((data as Array<Omit<InventoryRow, 'product_name'>>) ?? []).map((row) => ({
    ...row,
    product_name: nameById.get(row.product_id) ?? `Product #${row.product_id}`,
  }))
}

export async function updateInventory(productId: number, stock: number, lowStockThreshold: number) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('product_inventory')
    .update({ stock, low_stock_threshold: lowStockThreshold, updated_at: new Date().toISOString() })
    .eq('product_id', productId)
  if (error) throw error
}

export interface DashboardAnalytics {
  todayOrders: number
  todayRevenue: number
  pendingPayments: number
  pendingFulfillments: number
  lowStockCount: number
  outOfStockCount: number
  topProduct: { name: string; units: number } | null
  recentOrders: OrderRow[]
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const supabase = getSupabaseAdmin()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [{ data: todayOrders }, { count: pendingPayments }, { count: pendingFulfillments }, { data: inventory }, { data: recentOrders }] =
    await Promise.all([
      supabase.from('orders').select('total').gte('created_at', startOfDay.toISOString()),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('fulfillment_status', ['pending', 'processing', 'packed', 'ready_for_pickup']),
      supabase.from('product_inventory').select(),
      supabase.from('orders').select().order('created_at', { ascending: false }).limit(10),
    ])

  const todayOrderRows = (todayOrders as Array<{ total: number }>) ?? []
  const inventoryRows = (inventory as Array<{ product_id: number; stock: number; low_stock_threshold: number }>) ?? []

  const { data: topLines } = await supabase
    .from('order_items')
    .select('product_id, product_name, quantity')
  const unitsByProduct = new Map<string, number>()
  for (const line of (topLines as Array<{ product_name: string; quantity: number }>) ?? []) {
    unitsByProduct.set(line.product_name, (unitsByProduct.get(line.product_name) ?? 0) + line.quantity)
  }
  let topProduct: DashboardAnalytics['topProduct'] = null
  for (const [name, units] of unitsByProduct) {
    if (!topProduct || units > topProduct.units) topProduct = { name, units }
  }

  return {
    todayOrders: todayOrderRows.length,
    todayRevenue: todayOrderRows.reduce((sum, row) => sum + Number(row.total), 0),
    pendingPayments: pendingPayments ?? 0,
    pendingFulfillments: pendingFulfillments ?? 0,
    lowStockCount: inventoryRows.filter((row) => row.stock > 0 && row.stock <= row.low_stock_threshold).length,
    outOfStockCount: inventoryRows.filter((row) => row.stock === 0).length,
    topProduct,
    recentOrders: (recentOrders as OrderRow[]) ?? [],
  }
}
