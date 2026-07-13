import type { OwnerContext } from '@/lib/auth'
import type { PurchaseOrder, PurchaseOrderStatus } from './types'

const PO_SELECT = '*, supplier:suppliers(id, name), items:purchase_order_items(*, product:products(id, name, sku))'

export async function listPurchaseOrders(ctx: OwnerContext): Promise<PurchaseOrder[]> {
  const { data, error } = await ctx.supabase
    .from('purchase_orders')
    .select(PO_SELECT)
    .eq('owner_id', ctx.ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PurchaseOrder[]) ?? []
}

export async function getPurchaseOrder(ctx: OwnerContext, id: string): Promise<PurchaseOrder | null> {
  const { data, error } = await ctx.supabase
    .from('purchase_orders')
    .select(PO_SELECT)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .maybeSingle()
  if (error) throw error
  return data as PurchaseOrder | null
}

export interface PurchaseOrderInput {
  supplier_id?: string | null
  expected_date?: string | null
  handling_fee?: number
  shipping_fee?: number
  notes?: string
  items: Array<{ product_id: string; quantity_ordered: number; unit_cost: number }>
}

export async function createPurchaseOrder(ctx: OwnerContext, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  if (input.items.length === 0) throw new Error('Purchase order must contain at least one item')

  const totalCost = input.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)
    + (input.handling_fee ?? 0) + (input.shipping_fee ?? 0)

  const { data: po, error } = await ctx.supabase
    .from('purchase_orders')
    .insert({
      owner_id: ctx.ownerId,
      supplier_id: input.supplier_id ?? null,
      status: 'pending',
      total_cost: totalCost,
      handling_fee: input.handling_fee ?? 0,
      shipping_fee: input.shipping_fee ?? 0,
      expected_date: input.expected_date ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error

  const poRow = po as PurchaseOrder
  const { error: itemsError } = await ctx.supabase.from('purchase_order_items').insert(
    input.items.map((item) => ({
      owner_id: ctx.ownerId,
      purchase_order_id: poRow.id,
      product_id: item.product_id,
      quantity_ordered: item.quantity_ordered,
      unit_cost: item.unit_cost,
    })),
  )
  if (itemsError) throw itemsError

  const created = await getPurchaseOrder(ctx, poRow.id)
  if (!created) throw new Error('Purchase order not found after creation')
  return created
}

export async function updatePurchaseOrderStatus(
  ctx: OwnerContext,
  id: string,
  status: Extract<PurchaseOrderStatus, 'pending' | 'in_transit' | 'cancelled'>,
): Promise<PurchaseOrder> {
  const { data, error } = await ctx.supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  const updated = await getPurchaseOrder(ctx, (data as PurchaseOrder).id)
  if (!updated) throw new Error('Purchase order not found after update')
  return updated
}

// purchase_order_items cascades on delete; deleting never touches product
// stock — that's only ever adjusted by receivePurchaseOrder.
export async function deletePurchaseOrder(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('purchase_orders').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}

export interface ReceivePurchaseOrderInput {
  purchaseOrderId: string
  items: Array<{ purchaseOrderItemId: string; quantityReceivedNow: number }>
}

// Delegates to the `receive_purchase_order` Postgres function so the item
// receipt, stock increment, and stock_adjustments audit row happen atomically.
export async function receivePurchaseOrder(ctx: OwnerContext, input: ReceivePurchaseOrderInput): Promise<PurchaseOrder> {
  const { error } = await ctx.supabase.rpc('receive_purchase_order', {
    p_purchase_order_id: input.purchaseOrderId,
    p_items: input.items.map((item) => ({
      purchase_order_item_id: item.purchaseOrderItemId,
      quantity_received_now: item.quantityReceivedNow,
    })),
  })
  if (error) throw error

  const updated = await getPurchaseOrder(ctx, input.purchaseOrderId)
  if (!updated) throw new Error('Purchase order not found after receiving')
  return updated
}
