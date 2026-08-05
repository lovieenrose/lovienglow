import type { OwnerContext } from '@/lib/auth'
import type { SalesOrder } from './types'

const SALES_ORDER_SELECT = '*, items:sales_order_items(*)'

export async function listSalesOrders(
  ctx: OwnerContext,
  filters?: { from?: string; to?: string; limit?: number },
): Promise<SalesOrder[]> {
  let query = ctx.supabase
    .from('sales_orders')
    .select(SALES_ORDER_SELECT)
    .eq('owner_id', ctx.ownerId)
    .order('created_at', { ascending: false })

  if (filters?.from) query = query.gte('created_at', filters.from)
  if (filters?.to) query = query.lte('created_at', filters.to)
  if (filters?.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return (data as SalesOrder[]) ?? []
}

export async function getSalesOrder(ctx: OwnerContext, id: string): Promise<SalesOrder | null> {
  const { data, error } = await ctx.supabase
    .from('sales_orders')
    .select(SALES_ORDER_SELECT)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .maybeSingle()
  if (error) throw error
  return data as SalesOrder | null
}

export interface CompleteSaleInput {
  customerName?: string
  customerContact?: string
  discount?: number
  shippingFee?: number
  courier?: string
  shippingPaidBy?: 'customer' | 'business'
  orderCreatedAt?: string
  paymentMethod: string
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>
}

// Delegates to the `complete_sale` Postgres function so the order, its line
// items, the stock decrement, and the stock_adjustments audit row all happen
// atomically in one transaction. Every sale starts as 'awaiting_payment' —
// see markSalePaid.
export async function completeSale(ctx: OwnerContext, input: CompleteSaleInput): Promise<SalesOrder> {
  const { data, error } = await ctx.supabase.rpc('complete_sale', {
    p_customer_name: input.customerName ?? null,
    p_customer_contact: input.customerContact ?? null,
    p_discount: input.discount ?? 0,
    p_payment_method: input.paymentMethod,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice ?? null,
    })),
    p_shipping_fee: input.shippingFee ?? 0,
    p_courier: input.courier ?? null,
    p_shipping_paid_by: input.shippingPaidBy ?? 'customer',
    p_order_created_at: input.orderCreatedAt ?? null,
  })
  if (error) throw error

  const order = await getSalesOrder(ctx, (data as { id: string }).id)
  if (!order) throw new Error('Sales order not found after checkout')
  return order
}

export async function markSalePaid(ctx: OwnerContext, id: string, receiptUrl?: string): Promise<SalesOrder> {
  const { error } = await ctx.supabase.rpc('mark_sale_paid', {
    p_sales_order_id: id,
    p_receipt_url: receiptUrl ?? null,
  })
  if (error) throw error

  const order = await getSalesOrder(ctx, id)
  if (!order) throw new Error('Sales order not found after marking paid')
  return order
}

export async function reverseSale(ctx: OwnerContext, id: string): Promise<SalesOrder> {
  const { error } = await ctx.supabase.rpc('reverse_sale', { p_sales_order_id: id })
  if (error) throw error

  const order = await getSalesOrder(ctx, id)
  if (!order) throw new Error('Sales order not found after reversal')
  return order
}

// Permanently removes a sale from history. Only allowed once it's already
// `reversed` — that's the step that restores stock — so a delete can never
// silently leave inventory decremented with no record of why. Cascades to
// sales_order_items via its FK; stock_adjustments audit rows are left as-is
// (same as everywhere else in this app, they're an append-only log).
export async function deleteSalesOrder(ctx: OwnerContext, id: string): Promise<void> {
  const { data, error: fetchError } = await ctx.supabase
    .from('sales_orders')
    .select('status')
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .single()
  if (fetchError) throw fetchError
  if ((data as { status: SalesOrder['status'] }).status !== 'reversed') {
    throw new Error('Only reversed sales can be deleted — reverse the sale first to restore stock.')
  }

  const { error } = await ctx.supabase.from('sales_orders').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}

// Purely cosmetic override of what the printed/downloaded invoice shows —
// e.g. collapsing a bundle's real per-item rows (Tirzepatide, Bac Water,
// alcohol pads, ...) down to a single "TR15 Complete Set" line. Never
// touches sales_order_items, so COGS/profit/dashboard metrics (the "company
// data") stay derived from the real, fully itemized sale regardless of how
// the invoice is customized. Pass `null` to revert to the itemized default.
export async function updateSaleInvoiceItems(
  ctx: OwnerContext,
  id: string,
  invoiceItems: SalesOrder['invoice_items'],
): Promise<SalesOrder> {
  const { error } = await ctx.supabase
    .from('sales_orders')
    .update({ invoice_items: invoiceItems })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
  if (error) throw error

  const order = await getSalesOrder(ctx, id)
  if (!order) throw new Error('Sales order not found after updating invoice items')
  return order
}

// Per-order override of the invoice's header title (defaults to the
// business name) — e.g. "LOVIE X PINC" for an occasional co-branded sale,
// without touching the actual Business Profile. Pass `null` to revert to
// the business name.
export async function updateSaleInvoiceTitle(
  ctx: OwnerContext,
  id: string,
  invoiceTitle: string | null,
): Promise<SalesOrder> {
  const { error } = await ctx.supabase
    .from('sales_orders')
    .update({ invoice_title: invoiceTitle })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
  if (error) throw error

  const order = await getSalesOrder(ctx, id)
  if (!order) throw new Error('Sales order not found after updating invoice title')
  return order
}

// Optional, editable discount line shown on the invoice — entirely separate
// from the real transaction discount (sales_orders.discount, set by promo
// codes at checkout), which stays untouched for company data/COGS/margin.
// Pass `null` to remove the invoice's discount line entirely.
export async function updateSaleInvoiceDiscount(
  ctx: OwnerContext,
  id: string,
  invoiceDiscount: number | null,
): Promise<SalesOrder> {
  const { error } = await ctx.supabase
    .from('sales_orders')
    .update({ invoice_discount: invoiceDiscount })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
  if (error) throw error

  const order = await getSalesOrder(ctx, id)
  if (!order) throw new Error('Sales order not found after updating invoice discount')
  return order
}
