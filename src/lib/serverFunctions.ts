import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getAdminSession, getAdminSessionManager, requireAdmin, verifyAdminCredentials } from './auth'
import {
  createOrder,
  getDashboardAnalytics,
  getInventory,
  getOrder,
  listAllOrdersForExport,
  listOrders,
  updateInventory,
  updateOrder,
  type ListOrdersFilters,
} from './orders'
import { sendAdminNotification, sendOrderPacked, sendOrderReceived, sendOrderShipped, sendPaymentConfirmed } from './email'

// ── Storefront ─────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number(),
})

const submitOrderSchema = z.object({
  fullName: z.string().min(1),
  contactNumber: z.string().min(1),
  email: z.string(),
  socialHandle: z.string(),
  address: z.string().min(1),
  courier: z.string(),
  region: z.string(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number(),
  shippingFee: z.number(),
  total: z.number(),
  receiptBase64: z.string().min(1),
  receiptFilename: z.string().min(1),
  receiptContentType: z.string().min(1),
})

export const submitOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(submitOrderSchema)
  .handler(async ({ data }) => {
    const order = await createOrder(data)
    await Promise.all([sendOrderReceived(order), sendAdminNotification(order)])
    return order
  })

// ── Admin auth ───────────────────────────────────────────────────────────

export const adminLoginFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    if (!verifyAdminCredentials(data.email, data.password)) {
      return { success: false as const }
    }
    const session = await getAdminSessionManager()
    await session.update({ email: data.email })
    return { success: true as const }
  })

export const adminLogoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAdminSessionManager()
  await session.clear()
  return { success: true as const }
})

export const verifyAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getAdminSession()
  return { valid: Boolean(session.data.email), email: session.data.email ?? null }
})

// ── Dashboard: orders ────────────────────────────────────────────────────

const listFiltersSchema = z.object({
  search: z.string().optional(),
  paymentStatus: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
  courier: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
})

export const getOrdersFn = createServerFn({ method: 'GET' })
  .inputValidator(listFiltersSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    return listOrders(data as ListOrdersFilters)
  })

export const exportOrdersCsvFn = createServerFn({ method: 'GET' })
  .inputValidator(listFiltersSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const orders = await listAllOrdersForExport(data as ListOrdersFilters)
    const headers = [
      'Reference', 'Placed At', 'Full Name', 'Contact Number', 'Email', 'Address', 'Courier', 'Region',
      'Payment Method', 'Subtotal', 'Shipping Fee', 'Total', 'Payment Status', 'Fulfillment Status', 'Tracking Number',
    ]
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = orders.map((order) =>
      [
        order.reference, order.placed_at, order.full_name, order.contact_number, order.email ?? '',
        order.address, order.courier, order.region ?? '', order.payment_method, order.subtotal,
        order.shipping_fee, order.total, order.payment_status, order.fulfillment_status, order.tracking_number ?? '',
      ].map(escape).join(','),
    )
    return [headers.join(','), ...rows].join('\n')
  })

export const getOrderFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ reference: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    return getOrder(data.reference)
  })

const updateOrderSchema = z.object({
  reference: z.string(),
  paymentStatus: z.enum(['pending', 'confirmed', 'rejected', 'refunded']).optional(),
  fulfillmentStatus: z
    .enum(['pending', 'processing', 'packed', 'ready_for_pickup', 'shipped', 'delivered', 'completed', 'cancelled'])
    .optional(),
  trackingNumber: z.string().optional(),
  internalNotes: z.string().optional(),
  note: z.string().optional(),
})

export const updateOrderStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(updateOrderSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const { reference, ...patch } = data
    const updated = await updateOrder(reference, patch)

    if (patch.paymentStatus === 'confirmed') await sendPaymentConfirmed(updated)
    if (patch.fulfillmentStatus === 'packed') await sendOrderPacked(updated)
    if (patch.fulfillmentStatus === 'shipped') await sendOrderShipped(updated, updated.tracking_number ?? '')

    return getOrder(reference)
  })

// ── Dashboard: inventory ─────────────────────────────────────────────────

export const getInventoryFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return getInventory()
})

export const updateInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ productId: z.number(), stock: z.number(), lowStockThreshold: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    await updateInventory(data.productId, data.stock, data.lowStockThreshold)
    return { success: true as const }
  })

// ── Dashboard: analytics ─────────────────────────────────────────────────

export const getDashboardAnalyticsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return getDashboardAnalytics()
})
