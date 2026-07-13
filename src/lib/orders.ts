import { getSupabaseAdmin, uploadReceipt } from './supabase'

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

// Single unified status the admin actually manages. payment_status /
// fulfillment_status above are kept in sync automatically for backward
// compatibility (CSV export, existing badge classes, etc.) but are no
// longer edited directly.
export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const LEGACY_STATUS_BY_ORDER_STATUS: Record<OrderStatus, { paymentStatus: PaymentStatus; fulfillmentStatus: FulfillmentStatus }> = {
  pending_payment: { paymentStatus: 'pending', fulfillmentStatus: 'pending' },
  processing: { paymentStatus: 'confirmed', fulfillmentStatus: 'processing' },
  shipped: { paymentStatus: 'confirmed', fulfillmentStatus: 'shipped' },
  delivered: { paymentStatus: 'confirmed', fulfillmentStatus: 'delivered' },
  cancelled: { paymentStatus: 'rejected', fulfillmentStatus: 'cancelled' },
}

export interface OrderItemInput {
  // Exactly one of productId/productSetId is set — bundles ("sets") are
  // recorded as a single line referencing the set, not exploded into their
  // real component products, so the customer/admin summary only ever shows
  // what's actually on the pricelist.
  productId?: string
  productSetId?: string
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
  discount: number
  promoCode?: string
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
  discount: number
  promo_code: string | null
  total: number
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  order_status: OrderStatus
  tracking_code: string
  tracking_number: string | null
  internal_notes: string
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_set_id: string | null
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

  const { data: trackingData, error: trackingError } = await supabase.rpc('next_tracking_code')
  if (trackingError) throw trackingError
  const trackingCode = trackingData as string

  const receiptUrl = await uploadReceipt(input.receiptFilename, input.receiptContentType, bytes)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      reference,
      tracking_code: trackingCode,
      order_status: 'pending_payment',
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
      discount: input.discount,
      promo_code: input.promoCode || null,
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
        product_id: item.productId ?? null,
        product_set_id: item.productSetId ?? null,
        product_name: item.productName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
      })),
    )
    .select()
  if (itemsError) throw itemsError

  // Stock is not deducted here — it's reserved against real inventory only
  // once staff confirms fulfillment (Sales/POS "Complete Sale", Phase 2).

  return { ...orderRow, items: (items as OrderItemRow[]) ?? [], history: [], emails: [] }
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
  orderStatus?: string
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

  if (filters.orderStatus) query = query.eq('order_status', filters.orderStatus)
  if (filters.courier) query = query.eq('courier', filters.courier)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.search) {
    const term = filters.search.trim()
    query = query.or(
      `reference.ilike.%${term}%,tracking_code.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`,
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

  if (filters.orderStatus) query = query.eq('order_status', filters.orderStatus)
  if (filters.courier) query = query.eq('courier', filters.courier)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.search) {
    const term = filters.search.trim()
    query = query.or(
      `reference.ilike.%${term}%,tracking_code.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`,
    )
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data as OrderRow[]) ?? []
}

export interface UpdateOrderPatch {
  orderStatus?: OrderStatus
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
  if (patch.orderStatus !== undefined) {
    update.order_status = patch.orderStatus
    // Kept in sync for backward compatibility — CSV export, existing badge
    // classes, and getDashboardAnalytics still read these two columns.
    const legacy = LEGACY_STATUS_BY_ORDER_STATUS[patch.orderStatus]
    update.payment_status = legacy.paymentStatus
    update.fulfillment_status = legacy.fulfillmentStatus
  }

  const { error: updateError } = await supabase.from('orders').update(update).eq('id', existingRow.id)
  if (updateError) throw updateError

  if (patch.orderStatus !== undefined && patch.orderStatus !== existingRow.order_status) {
    await supabase.from('order_status_history').insert({
      order_id: existingRow.id,
      field: 'order_status',
      old_value: existingRow.order_status,
      new_value: patch.orderStatus,
      note: patch.note ?? null,
    })
  }

  const updated = await getOrder(reference)
  if (!updated) throw new Error('Order not found after update')
  return updated
}

// ── Public order tracking (no auth) ──────────────────────────────────────
// Deliberately excludes address, contact_number, email, receipt_url, and
// internal_notes — anyone with the tracking code can look up an order, so
// only non-sensitive fulfillment info is returned.

export interface PublicTrackedOrder {
  reference: string
  tracking_code: string
  order_status: OrderStatus
  courier: string
  created_at: string
  updated_at: string
  items: Array<Pick<OrderItemRow, 'product_name' | 'quantity' | 'unit_price' | 'line_total'>>
  history: Array<Pick<StatusHistoryRow, 'new_value' | 'changed_at'>>
}

export async function getOrderByTrackingCode(trackingCode: string): Promise<PublicTrackedOrder | null> {
  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, reference, tracking_code, order_status, courier, created_at, updated_at')
    .eq('tracking_code', trackingCode.trim())
    .maybeSingle()
  if (error) throw error
  if (!order) return null
  const orderRow = order as Pick<OrderRow, 'id' | 'reference' | 'tracking_code' | 'order_status' | 'courier' | 'created_at' | 'updated_at'>

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from('order_items').select('product_name, quantity, unit_price, line_total').eq('order_id', orderRow.id),
    supabase
      .from('order_status_history')
      .select('new_value, changed_at')
      .eq('order_id', orderRow.id)
      .eq('field', 'order_status')
      .order('changed_at', { ascending: true }),
  ])

  return {
    reference: orderRow.reference,
    tracking_code: orderRow.tracking_code,
    order_status: orderRow.order_status,
    courier: orderRow.courier,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    items: (items as PublicTrackedOrder['items']) ?? [],
    history: (history as PublicTrackedOrder['history']) ?? [],
  }
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

// Guards the automatic status-change triggers so each notification only
// goes out once per order, even if the same status is saved again later.
// Manual retries (resendOrderEmail) call the send functions directly and
// intentionally bypass this check.
export async function hasEmailBeenSent(orderId: string, emailType: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { count } = await supabase
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .eq('email_type', emailType)
    .eq('success', true)
  return (count ?? 0) > 0
}

