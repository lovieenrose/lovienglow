import type { OwnerContext } from '@/lib/auth'
import type { BusinessProfile, Category, Product, ProductBatch, ProductSet, Supplier } from './types'

// ── business_profiles ────────────────────────────────────────────────────

export async function ensureBusinessProfile(
  ctx: OwnerContext,
  fallbackName: string,
  extra?: { businessType?: string; currency?: string },
): Promise<BusinessProfile> {
  const { data: existing } = await ctx.supabase
    .from('business_profiles')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .maybeSingle()
  if (existing) return existing as BusinessProfile

  const { data, error } = await ctx.supabase
    .from('business_profiles')
    .insert({
      owner_id: ctx.ownerId,
      business_name: fallbackName || 'My Business',
      full_name: fallbackName || '',
      business_type: extra?.businessType || null,
      currency: extra?.currency || 'PHP',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as BusinessProfile
}

export async function getBusinessProfile(ctx: OwnerContext): Promise<BusinessProfile | null> {
  const { data, error } = await ctx.supabase
    .from('business_profiles')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .maybeSingle()
  if (error) throw error
  return data as BusinessProfile | null
}

export async function updateBusinessProfile(
  ctx: OwnerContext,
  patch: Partial<Pick<BusinessProfile, 'business_name' | 'business_type' | 'full_name' | 'currency' | 'invoice_banner_url'>>,
): Promise<BusinessProfile> {
  const { data, error } = await ctx.supabase
    .from('business_profiles')
    .update(patch)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  return data as BusinessProfile
}

// ── categories ────────────────────────────────────────────────────────────

export async function listCategories(ctx: OwnerContext): Promise<Category[]> {
  const { data, error } = await ctx.supabase
    .from('categories')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .order('name', { ascending: true })
  if (error) throw error
  return (data as Category[]) ?? []
}

export async function createCategory(
  ctx: OwnerContext,
  input: { name: string; description?: string },
): Promise<Category> {
  const { data, error } = await ctx.supabase
    .from('categories')
    .insert({ owner_id: ctx.ownerId, name: input.name, description: input.description ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(
  ctx: OwnerContext,
  id: string,
  patch: { name?: string; description?: string },
): Promise<Category> {
  const { data, error } = await ctx.supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('categories').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}

// ── suppliers ─────────────────────────────────────────────────────────────

export async function listSuppliers(ctx: OwnerContext): Promise<Supplier[]> {
  const { data, error } = await ctx.supabase
    .from('suppliers')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .order('name', { ascending: true })
  if (error) throw error
  return (data as Supplier[]) ?? []
}

export interface SupplierInput {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export async function createSupplier(ctx: OwnerContext, input: SupplierInput): Promise<Supplier> {
  const { data, error } = await ctx.supabase
    .from('suppliers')
    .insert({ owner_id: ctx.ownerId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(ctx: OwnerContext, id: string, patch: Partial<SupplierInput>): Promise<Supplier> {
  const { data, error } = await ctx.supabase
    .from('suppliers')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('suppliers').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}

// ── products ──────────────────────────────────────────────────────────────

const PRODUCT_SELECT = '*, category:categories(id, name), supplier:suppliers(id, name)'

export async function listProducts(ctx: OwnerContext): Promise<Product[]> {
  const { data, error } = await ctx.supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('owner_id', ctx.ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const productRows = (data as Product[]) ?? []
  if (productRows.length === 0) return []

  const { data: batches, error: batchesError } = await ctx.supabase
    .from('product_batches')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .in('product_id', productRows.map((p) => p.id))
    .order('created_at', { ascending: true })
  if (batchesError) throw batchesError

  const batchesByProduct = new Map<string, ProductBatch[]>()
  for (const batch of (batches as ProductBatch[]) ?? []) {
    const list = batchesByProduct.get(batch.product_id) ?? []
    list.push(batch)
    batchesByProduct.set(batch.product_id, list)
  }

  return productRows.map((p) => ({ ...p, batches: batchesByProduct.get(p.id) ?? [] }))
}

export interface ProductInput {
  name: string
  sku?: string
  barcode?: string
  category_id?: string | null
  supplier_id?: string | null
  cost_price: number
  selling_price: number
  stock_quantity?: number
  reorder_level?: number
  unit?: string
  image_url?: string
  description?: string
}

export async function createProduct(ctx: OwnerContext, input: ProductInput): Promise<Product> {
  const { data, error } = await ctx.supabase
    .from('products')
    .insert({ owner_id: ctx.ownerId, ...input })
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(ctx: OwnerContext, id: string, patch: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await ctx.supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('products').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}

// Manual stock correction via the "Adjust Stock" modal — always logged as a
// delta (add/remove) with a reason and optional notes, so the audit trail in
// stock_adjustments stays complete and human-readable.
export async function adjustProductStock(
  ctx: OwnerContext,
  id: string,
  input: { direction: 'add' | 'remove'; quantity: number; reason: string; notes?: string },
): Promise<Product> {
  const { data: current, error: fetchError } = await ctx.supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .single()
  if (fetchError) throw fetchError

  const previousQty = (current as { stock_quantity: number }).stock_quantity
  const signedDelta = input.direction === 'add' ? input.quantity : -input.quantity
  const nextQty = Math.max(0, previousQty + signedDelta)
  const actualDelta = nextQty - previousQty

  const { data, error } = await ctx.supabase
    .from('products')
    .update({ stock_quantity: nextQty })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw error

  if (actualDelta !== 0) {
    await ctx.supabase.from('stock_adjustments').insert({
      owner_id: ctx.ownerId,
      product_id: id,
      change: actualDelta,
      resulting_qty: nextQty,
      reason: input.reason,
      source: 'manual',
      notes: input.notes ?? null,
    })
  }

  return data as Product
}

// ── product_batches (batch/lot tracking) ─────────────────────────────────
// A product with zero batch rows keeps the legacy single-count behavior.
// The moment it has one or more batches, products.stock_quantity is kept in
// sync automatically by a DB trigger (see product_batches_migration.sql) —
// these functions never need to touch products.stock_quantity themselves.

export interface ProductBatchInput {
  batch_name: string
  quantity: number
  cost_price: number
  expiration_date?: string | null
}

async function currentStockQuantity(ctx: OwnerContext, productId: string): Promise<number> {
  const { data, error } = await ctx.supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .eq('owner_id', ctx.ownerId)
    .single()
  if (error) throw error
  return (data as { stock_quantity: number }).stock_quantity
}

export async function listProductBatches(ctx: OwnerContext, productId: string): Promise<ProductBatch[]> {
  const { data, error } = await ctx.supabase
    .from('product_batches')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ProductBatch[]) ?? []
}

export async function createProductBatch(
  ctx: OwnerContext,
  productId: string,
  input: ProductBatchInput,
): Promise<ProductBatch> {
  const { data, error } = await ctx.supabase
    .from('product_batches')
    .insert({
      owner_id: ctx.ownerId,
      product_id: productId,
      batch_name: input.batch_name,
      quantity: input.quantity,
      cost_price: input.cost_price,
      expiration_date: input.expiration_date ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  const batch = data as ProductBatch

  await ctx.supabase.from('stock_adjustments').insert({
    owner_id: ctx.ownerId,
    product_id: productId,
    change: input.quantity,
    resulting_qty: await currentStockQuantity(ctx, productId),
    reason: `Added batch "${input.batch_name}"`,
    source: 'batch',
    source_id: batch.id,
  })

  return batch
}

export async function updateProductBatch(
  ctx: OwnerContext,
  id: string,
  patch: Partial<ProductBatchInput>,
): Promise<ProductBatch> {
  const { data: before, error: beforeError } = await ctx.supabase
    .from('product_batches')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .single()
  if (beforeError) throw beforeError
  const previous = before as ProductBatch

  const { data, error } = await ctx.supabase
    .from('product_batches')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .select('*')
    .single()
  if (error) throw error
  const updated = data as ProductBatch

  if (patch.quantity !== undefined && patch.quantity !== previous.quantity) {
    await ctx.supabase.from('stock_adjustments').insert({
      owner_id: ctx.ownerId,
      product_id: updated.product_id,
      change: patch.quantity - previous.quantity,
      resulting_qty: await currentStockQuantity(ctx, updated.product_id),
      reason: `Adjusted batch "${updated.batch_name}"`,
      source: 'batch',
      source_id: updated.id,
    })
  }

  return updated
}

export async function deleteProductBatch(ctx: OwnerContext, id: string): Promise<void> {
  const { data: before, error: beforeError } = await ctx.supabase
    .from('product_batches')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
    .single()
  if (beforeError) throw beforeError
  const previous = before as ProductBatch

  const { error } = await ctx.supabase.from('product_batches').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error

  await ctx.supabase.from('stock_adjustments').insert({
    owner_id: ctx.ownerId,
    product_id: previous.product_id,
    change: -previous.quantity,
    resulting_qty: await currentStockQuantity(ctx, previous.product_id),
    reason: `Removed batch "${previous.batch_name}"`,
    source: 'batch',
    source_id: previous.id,
  })
}

// ── product_sets / product_set_items ─────────────────────────────────────

const SET_ITEM_SELECT = '*, product:products(id, name, selling_price, stock_quantity)'

export async function listProductSets(ctx: OwnerContext): Promise<ProductSet[]> {
  const { data: sets, error } = await ctx.supabase
    .from('product_sets')
    .select('*')
    .eq('owner_id', ctx.ownerId)
    .order('sort_order', { ascending: true })
  if (error) throw error

  const setRows = (sets as Array<Omit<ProductSet, 'items'>>) ?? []
  if (setRows.length === 0) return []

  const { data: items, error: itemsError } = await ctx.supabase
    .from('product_set_items')
    .select(SET_ITEM_SELECT)
    .eq('owner_id', ctx.ownerId)
    .in('product_set_id', setRows.map((s) => s.id))
  if (itemsError) throw itemsError

  const itemsBySet = new Map<string, ProductSet['items']>()
  for (const item of (items as ProductSet['items']) ?? []) {
    const list = itemsBySet.get(item.product_set_id) ?? []
    list.push(item)
    itemsBySet.set(item.product_set_id, list)
  }

  return setRows.map((set) => ({ ...set, items: itemsBySet.get(set.id) ?? [] }))
}

export interface ProductSetInput {
  name: string
  icon?: string
  color?: string
  sort_order?: number
  items: Array<{ product_id: string; quantity: number }>
}

export async function createProductSet(ctx: OwnerContext, input: ProductSetInput): Promise<ProductSet> {
  const { data: set, error } = await ctx.supabase
    .from('product_sets')
    .insert({
      owner_id: ctx.ownerId,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select('*')
    .single()
  if (error) throw error

  const setRow = set as Omit<ProductSet, 'items'>
  if (input.items.length > 0) {
    const { error: itemsError } = await ctx.supabase.from('product_set_items').insert(
      input.items.map((item) => ({
        owner_id: ctx.ownerId,
        product_set_id: setRow.id,
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    )
    if (itemsError) throw itemsError
  }

  const [refreshed] = (await listProductSets(ctx)).filter((s) => s.id === setRow.id)
  return refreshed ?? { ...setRow, items: [] }
}

export async function updateProductSet(ctx: OwnerContext, id: string, input: ProductSetInput): Promise<ProductSet> {
  const { error } = await ctx.supabase
    .from('product_sets')
    .update({
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .eq('id', id)
    .eq('owner_id', ctx.ownerId)
  if (error) throw error

  await ctx.supabase.from('product_set_items').delete().eq('product_set_id', id).eq('owner_id', ctx.ownerId)
  if (input.items.length > 0) {
    const { error: itemsError } = await ctx.supabase.from('product_set_items').insert(
      input.items.map((item) => ({
        owner_id: ctx.ownerId,
        product_set_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    )
    if (itemsError) throw itemsError
  }

  const [refreshed] = (await listProductSets(ctx)).filter((s) => s.id === id)
  if (!refreshed) throw new Error('Product set not found after update')
  return refreshed
}

// Assigns sort_order = array position for every id, atomically, via the
// reorder_product_sets RPC (see supabase/reorder_product_sets_migration.sql).
export async function reorderProductSets(ctx: OwnerContext, orderedIds: string[]): Promise<void> {
  const { error } = await ctx.supabase.rpc('reorder_product_sets', { p_ids: orderedIds })
  if (error) throw error
}

export async function deleteProductSet(ctx: OwnerContext, id: string): Promise<void> {
  const { error } = await ctx.supabase.from('product_sets').delete().eq('id', id).eq('owner_id', ctx.ownerId)
  if (error) throw error
}
