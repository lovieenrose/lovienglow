import { getSupabaseAdmin } from './supabase'
import type { PublicProduct } from '@/data/catalog'

// The storefront is single-tenant today — everything sold on the public
// site belongs to this one business account.
export const STOREFRONT_OWNER_ID = 'ea319e69-8643-463d-84dd-01661ca0bb5a'

interface StorefrontMeta {
  slug: string
  category: string
  shortCategory: string
  shortDescription: string
  rating: number
  reviews: number
  isNew?: boolean
  isBestSeller?: boolean
  strength: string[]
  benefits: string[]
  palette: [string, string, string]
  form: PublicProduct['form']
  // Bundles are priced at a discount to the sum of their parts — when set,
  // this overrides the computed component-sum price for product_sets.
  fixedPrice?: number
  // Admin-controlled public display fields — never affect real inventory data.
  gallery?: string[]
  visibility?: 'visible' | 'hidden'
  statusOverride?: 'auto' | 'out_of_stock' | 'coming_soon' | 'discontinued'
}

// Applies the admin's visibility/status-override settings to a real stock
// count, without ever touching the database. Returns null when the item
// should be dropped from the public catalog entirely.
function applyDisplayOverrides(
  meta: StorefrontMeta,
  realStock: number,
): { stock: number; purchasable: boolean; badge?: PublicProduct['badge'] } | null {
  if (meta.visibility === 'hidden') return null

  switch (meta.statusOverride) {
    case 'out_of_stock':
      return { stock: 0, purchasable: false, badge: 'out_of_stock' }
    case 'coming_soon':
      return { stock: realStock, purchasable: false, badge: 'coming_soon' }
    case 'discontinued':
      return { stock: realStock, purchasable: false, badge: 'discontinued' }
    default:
      return realStock > 0
        ? { stock: realStock, purchasable: true }
        : { stock: 0, purchasable: false, badge: 'out_of_stock' }
  }
}

export async function listPublicCatalog(): Promise<PublicProduct[]> {
  const supabase = getSupabaseAdmin()

  const [{ data: products, error: productsError }, { data: sets, error: setsError }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, selling_price, stock_quantity, image_url, storefront_meta')
      .eq('owner_id', STOREFRONT_OWNER_ID)
      .not('storefront_meta', 'is', null),
    supabase
      .from('product_sets')
      .select('id, name, storefront_meta, items:product_set_items(product_id, quantity, product:products(name, selling_price, stock_quantity))')
      .eq('owner_id', STOREFRONT_OWNER_ID)
      .not('storefront_meta', 'is', null),
  ])
  if (productsError) throw productsError
  if (setsError) throw setsError

  const catalog: PublicProduct[] = []

  for (const row of (products as Array<{ id: string; name: string; description: string | null; selling_price: number; stock_quantity: number; image_url: string | null; storefront_meta: StorefrontMeta }>) ?? []) {
    const meta = row.storefront_meta
    const display = applyDisplayOverrides(meta, row.stock_quantity)
    if (!display) continue
    catalog.push({
      id: row.id,
      slug: meta.slug,
      name: row.name,
      category: meta.category as PublicProduct['category'],
      shortCategory: meta.shortCategory,
      description: row.description ?? '',
      shortDescription: meta.shortDescription,
      price: row.selling_price,
      stock: display.stock,
      purchasable: display.purchasable,
      badge: display.badge,
      rating: meta.rating,
      reviews: meta.reviews,
      isNew: meta.isNew,
      isBestSeller: meta.isBestSeller,
      strength: meta.strength,
      benefits: meta.benefits,
      palette: meta.palette,
      form: meta.form,
      image: row.image_url ?? undefined,
      gallery: meta.gallery,
    })
  }

  interface RawSet {
    id: string
    name: string
    storefront_meta: StorefrontMeta
    items: Array<{ product_id: string; quantity: number; product: { name: string; selling_price: number; stock_quantity: number } | { name: string; selling_price: number; stock_quantity: number }[] | null }>
  }

  const resolveProduct = (product: RawSet['items'][number]['product']) => (Array.isArray(product) ? product[0] : product)

  for (const row of (sets as unknown as RawSet[]) ?? []) {
    const meta = row.storefront_meta
    const componentSum = row.items.reduce((sum, item) => sum + item.quantity * (resolveProduct(item.product)?.selling_price ?? 0), 0)
    const price = meta.fixedPrice ?? componentSum
    const stock = row.items.reduce((min, item) => {
      const available = Math.floor((resolveProduct(item.product)?.stock_quantity ?? 0) / item.quantity)
      return Math.min(min, available)
    }, Infinity)
    const included = row.items.map((item) => `${item.quantity}× ${resolveProduct(item.product)?.name ?? 'Component'}`)
    const realStock = Number.isFinite(stock) ? stock : 0
    const display = applyDisplayOverrides(meta, realStock)
    if (!display) continue

    catalog.push({
      id: row.id,
      slug: meta.slug,
      name: row.name,
      category: meta.category as PublicProduct['category'],
      shortCategory: meta.shortCategory,
      description: meta.shortDescription,
      shortDescription: meta.shortDescription,
      price,
      compareAt: meta.fixedPrice && componentSum > meta.fixedPrice ? componentSum : undefined,
      stock: display.stock,
      purchasable: display.purchasable,
      badge: display.badge,
      rating: meta.rating,
      reviews: meta.reviews,
      isNew: meta.isNew,
      isBestSeller: meta.isBestSeller,
      strength: meta.strength,
      benefits: meta.benefits,
      included,
      palette: meta.palette,
      form: 'set',
      isSet: true,
      gallery: meta.gallery,
      setItems: row.items.map((item) => ({
        productId: item.product_id,
        name: resolveProduct(item.product)?.name ?? 'Component',
        price: resolveProduct(item.product)?.selling_price ?? 0,
        quantity: item.quantity,
      })),
    })
  }

  return catalog
}

export interface PromoValidationResult {
  valid: boolean
  discount: number
  message?: string
  promoId?: string
}

export async function validatePromoCode(
  code: string,
  input: { cartProductIds: string[]; subtotal: number; customerEmail?: string },
): Promise<PromoValidationResult> {
  const supabase = getSupabaseAdmin()

  const { data: promo, error } = await supabase
    .from('promos')
    .select('*')
    .eq('owner_id', STOREFRONT_OWNER_ID)
    .ilike('code', code.trim())
    .maybeSingle()
  if (error) throw error
  if (!promo || !promo.active) return { valid: false, discount: 0, message: 'Invalid or inactive promo code.' }

  const today = new Date().toISOString().slice(0, 10)
  if (promo.start_date && today < promo.start_date) return { valid: false, discount: 0, message: 'This promo code is not active yet.' }
  if (promo.end_date && today > promo.end_date) return { valid: false, discount: 0, message: 'This promo code has expired.' }

  if (promo.min_purchase_amount && input.subtotal < promo.min_purchase_amount) {
    return { valid: false, discount: 0, message: `Minimum purchase of ${promo.min_purchase_amount} required.` }
  }

  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    return { valid: false, discount: 0, message: 'This promo code has reached its usage limit.' }
  }

  const { data: triggers } = await supabase.from('promo_trigger_products').select('product_id').eq('promo_id', promo.id)
  const triggerIds = (triggers as Array<{ product_id: string }> | null)?.map((t) => t.product_id) ?? []
  if (triggerIds.length > 0 && !triggerIds.some((id) => input.cartProductIds.includes(id))) {
    return { valid: false, discount: 0, message: 'This promo code does not apply to items in your cart.' }
  }

  if (input.customerEmail) {
    if (promo.single_use_per_customer) {
      const { count } = await supabase
        .from('promo_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('promo_id', promo.id)
        .eq('customer_email', input.customerEmail)
      if ((count ?? 0) > 0) return { valid: false, discount: 0, message: 'You have already used this promo code.' }
    }
    if (promo.first_time_customer_only) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('email', input.customerEmail)
      if ((count ?? 0) > 0) return { valid: false, discount: 0, message: 'This promo code is for first-time customers only.' }
    }
  }

  let discount = 0
  if (promo.reward_type === 'percent_discount') discount = input.subtotal * (promo.reward_value / 100)
  else if (promo.reward_type === 'fixed_discount') discount = promo.reward_value
  if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount)
  discount = Math.min(discount, input.subtotal)

  return { valid: true, discount: Math.round(discount * 100) / 100, promoId: promo.id }
}

export async function redeemPromo(promoId: string, orderId: string, customerEmail?: string) {
  const supabase = getSupabaseAdmin()
  const { data: promo } = await supabase.from('promos').select('times_used').eq('id', promoId).single()
  if (promo) {
    await supabase.from('promos').update({ times_used: (promo as { times_used: number }).times_used + 1 }).eq('id', promoId)
  }
  await supabase.from('promo_redemptions').insert({
    owner_id: STOREFRONT_OWNER_ID,
    promo_id: promoId,
    order_id: orderId,
    customer_email: customerEmail || null,
  })
}
