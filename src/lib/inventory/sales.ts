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
