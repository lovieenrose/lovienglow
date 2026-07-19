import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { clearOwnerSession, establishOwnerSession, isOwnerAuthenticated, requireOwner } from './auth'
import { uploadBusinessLogo, uploadInvoiceBanner, uploadPaymentProof, uploadProductImage } from './supabase'
import {
  adjustProductStock,
  createCategory,
  createProduct,
  createProductBatch,
  createProductSet,
  createSupplier,
  deleteCategory,
  deleteProduct,
  deleteProductBatch,
  deleteProductSet,
  deleteSupplier,
  ensureBusinessProfile,
  getBusinessProfile,
  listCategories,
  listProductBatches,
  listProductSets,
  listProducts,
  listSuppliers,
  reorderProductSets,
  updateBusinessProfile,
  updateCategory,
  updateProduct,
  updateProductBatch,
  updateProductSet,
  updateSupplier,
} from './inventory/catalog'
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from './inventory/purchasing'
import { completeSale, getSalesOrder, listSalesOrders, markSalePaid, reverseSale, updateSaleInvoiceItems } from './inventory/sales'
import { createExpense, deleteExpense, listExpenses, updateExpense } from './inventory/expenses'
import { createPromo, deletePromo, listPromos, updatePromo } from './inventory/promos'
import { getDashboardMetrics } from './inventory/dashboard'

// ── Owner auth (Supabase Auth) ───────────────────────────────────────────
// Sign-in/sign-up itself happens client-side against Supabase Auth (see
// supabaseClient.ts). These server functions mirror the resulting session
// into an httpOnly cookie so SSR route guards and other server functions can
// build a request-scoped, RLS-respecting Supabase client.

export const ownerEstablishSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      fallbackName: z.string().optional(),
      businessType: z.string().optional(),
      currency: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await establishOwnerSession(data.accessToken, data.refreshToken)
    const ctx = await requireOwner()
    await ensureBusinessProfile(ctx, data.fallbackName || user.email || '', {
      businessType: data.businessType,
      currency: data.currency,
    })
    return { success: true as const }
  })

export const ownerLogoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await clearOwnerSession()
  return { success: true as const }
})

export const verifyOwnerFn = createServerFn({ method: 'GET' }).handler(async () => {
  return { valid: await isOwnerAuthenticated() }
})

// ── Business profile ──────────────────────────────────────────────────────

export const getBusinessProfileFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return getBusinessProfile(ctx)
})

export const updateBusinessProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      businessName: z.string().min(1),
      businessType: z.string().optional(),
      fullName: z.string().min(1),
      currency: z.string().min(1),
      logoUrl: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return updateBusinessProfile(ctx, {
      business_name: data.businessName,
      business_type: data.businessType || null,
      full_name: data.fullName,
      currency: data.currency,
      ...(data.logoUrl !== undefined ? { logo_url: data.logoUrl } : {}),
    })
  })

// ── Categories ─────────────────────────────────────────────────────────────

export const listCategoriesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listCategories(ctx)
})

export const createCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().min(1), description: z.string().optional() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createCategory(ctx, data)
  })

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), name: z.string().min(1).optional(), description: z.string().optional() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...patch } = data
    return updateCategory(ctx, id, patch)
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteCategory(ctx, data.id)
    return { success: true as const }
  })

// ── Suppliers ─────────────────────────────────────────────────────────────

export const listSuppliersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listSuppliers(ctx)
})

const supplierInputSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const createSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(supplierInputSchema)
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createSupplier(ctx, data)
  })

export const updateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(supplierInputSchema.partial().extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...patch } = data
    return updateSupplier(ctx, id, patch)
  })

export const deleteSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteSupplier(ctx, data.id)
    return { success: true as const }
  })

// ── Products ──────────────────────────────────────────────────────────────

export const listProductsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listProducts(ctx)
})

const productInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().nullable().optional(),
  supplier_id: z.string().nullable().optional(),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  image_url: z.string().optional(),
  description: z.string().optional(),
})

export const createProductFn = createServerFn({ method: 'POST' })
  .inputValidator(productInputSchema)
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createProduct(ctx, data)
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .inputValidator(productInputSchema.partial().extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...patch } = data
    return updateProduct(ctx, id, patch)
  })

export const deleteProductFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteProduct(ctx, data.id)
    return { success: true as const }
  })

export const adjustProductStockFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      direction: z.enum(['add', 'remove']),
      quantity: z.number().int().min(1),
      reason: z.string().min(1),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...input } = data
    return adjustProductStock(ctx, id, input)
  })

// ── Product batches (batch/lot tracking) ────────────────────────────────
// Equivalent to POST /api/products/:productId/batches and
// PATCH/DELETE /api/batches/:id, expressed as TanStack Start server
// functions (the pattern used throughout this app instead of REST routes).

export const listProductBatchesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return listProductBatches(ctx, data.productId)
  })

export const createProductBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      batch_name: z.string().min(1),
      quantity: z.number().int().min(0),
      cost_price: z.number().min(0),
      expiration_date: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { productId, ...input } = data
    return createProductBatch(ctx, productId, input)
  })

export const updateProductBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      batch_name: z.string().min(1).optional(),
      quantity: z.number().int().min(0).optional(),
      cost_price: z.number().min(0).optional(),
      expiration_date: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...patch } = data
    return updateProductBatch(ctx, id, patch)
  })

export const deleteProductBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteProductBatch(ctx, data.id)
    return { success: true as const }
  })

// ── Product sets ──────────────────────────────────────────────────────────

export const listProductSetsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listProductSets(ctx)
})

export const createProductSetFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      icon: z.string().optional(),
      color: z.string().optional(),
      sort_order: z.number().optional(),
      items: z.array(z.object({ product_id: z.string(), quantity: z.number().int().min(1) })),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createProductSet(ctx, data)
  })

export const deleteProductSetFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteProductSet(ctx, data.id)
    return { success: true as const }
  })

export const updateProductSetFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      icon: z.string().optional(),
      color: z.string().optional(),
      sort_order: z.number().optional(),
      items: z.array(z.object({ product_id: z.string(), quantity: z.number().int().min(1) })),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...input } = data
    return updateProductSet(ctx, id, input)
  })

export const reorderProductSetsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await reorderProductSets(ctx, data.ids)
    return { success: true as const }
  })

// ── Purchase orders (incoming stock) ─────────────────────────────────────

export const listPurchaseOrdersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listPurchaseOrders(ctx)
})

export const getPurchaseOrderFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return getPurchaseOrder(ctx, data.id)
  })

export const createPurchaseOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      supplier_id: z.string().nullable().optional(),
      expected_date: z.string().nullable().optional(),
      handling_fee: z.number().min(0).optional(),
      shipping_fee: z.number().min(0).optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ product_id: z.string(), quantity_ordered: z.number().int().min(1), unit_cost: z.number().min(0) })).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createPurchaseOrder(ctx, data)
  })

export const updatePurchaseOrderStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), status: z.enum(['pending', 'in_transit', 'cancelled']) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return updatePurchaseOrderStatus(ctx, data.id, data.status)
  })

export const deletePurchaseOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deletePurchaseOrder(ctx, data.id)
    return { success: true as const }
  })

export const receivePurchaseOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      purchaseOrderId: z.string(),
      items: z.array(z.object({ purchaseOrderItemId: z.string(), quantityReceivedNow: z.number().int().min(0) })),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return receivePurchaseOrder(ctx, data)
  })

// ── Sales / POS ───────────────────────────────────────────────────────────

export const listSalesOrdersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ from: z.string().optional(), to: z.string().optional(), limit: z.number().optional() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return listSalesOrders(ctx, data)
  })

export const getSalesOrderFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return getSalesOrder(ctx, data.id)
  })

export const completeSaleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      customerName: z.string().optional(),
      customerContact: z.string().optional(),
      discount: z.number().min(0).optional(),
      shippingFee: z.number().min(0).optional(),
      paymentMethod: z.string().min(1),
      items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1), unitPrice: z.number().min(0).optional() })).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return completeSale(ctx, data)
  })

export const markSalePaidFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), receiptUrl: z.string().optional() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return markSalePaid(ctx, data.id, data.receiptUrl)
  })

export const updateSaleInvoiceItemsFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      invoiceItems: z
        .array(z.object({ label: z.string().min(1), quantity: z.number().min(0), unit_price: z.number().min(0) }))
        .nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return updateSaleInvoiceItems(ctx, data.id, data.invoiceItems)
  })

export const reverseSaleFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return reverseSale(ctx, data.id)
  })

function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'))
}

export const uploadPaymentProofFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      saleId: z.string(),
      filename: z.string().min(1),
      contentType: z.string().min(1),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const url = await uploadPaymentProof(data.filename, data.contentType, base64ToBytes(data.base64))
    return markSalePaid(ctx, data.saleId, url)
  })

export const uploadInvoiceBannerFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ filename: z.string().min(1), contentType: z.string().min(1), base64: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const url = await uploadInvoiceBanner(data.filename, data.contentType, base64ToBytes(data.base64))
    return updateBusinessProfile(ctx, { invoice_banner_url: url })
  })

export const uploadBusinessLogoFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ filename: z.string().min(1), contentType: z.string().min(1), base64: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const url = await uploadBusinessLogo(ctx.ownerId, data.filename, data.contentType, base64ToBytes(data.base64))
    return updateBusinessProfile(ctx, { logo_url: url })
  })

export const uploadProductImageFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ filename: z.string().min(1), contentType: z.string().min(1), base64: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const url = await uploadProductImage(ctx.ownerId, data.filename, data.contentType, base64ToBytes(data.base64))
    return { url }
  })

// ── Promo codes ───────────────────────────────────────────────────────────

export const listPromosFn = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await requireOwner()
  return listPromos(ctx)
})

const promoInputSchema = z.object({
  code: z.string().min(1),
  reward_type: z.enum(['fixed_discount', 'percent_discount', 'free_item']),
  reward_value: z.number().min(0),
  active: z.boolean(),
  trigger_product_ids: z.array(z.string()),
  reward_product_ids: z.array(z.string()),
})

export const createPromoFn = createServerFn({ method: 'POST' })
  .inputValidator(promoInputSchema)
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createPromo(ctx, data)
  })

export const updatePromoFn = createServerFn({ method: 'POST' })
  .inputValidator(promoInputSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...input } = data
    return updatePromo(ctx, id, input)
  })

export const deletePromoFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deletePromo(ctx, data.id)
    return { success: true as const }
  })

// ── Expenses ──────────────────────────────────────────────────────────────

export const listExpensesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ from: z.string().optional(), to: z.string().optional() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return listExpenses(ctx, data)
  })

const expenseInputSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
  expense_date: z.string(),
  purchase_order_id: z.string().nullable().optional(),
})

export const createExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(expenseInputSchema)
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return createExpense(ctx, data)
  })

export const updateExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(expenseInputSchema.partial().extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    const { id, ...patch } = data
    return updateExpense(ctx, id, patch)
  })

export const deleteExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    await deleteExpense(ctx, data.id)
    return { success: true as const }
  })

// ── Dashboard metrics (multi-tenant inventory & sales) ───────────────────

export const getDashboardMetricsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ range: z.enum(['7d', '30d', '90d', '12m']) }))
  .handler(async ({ data }) => {
    const ctx = await requireOwner()
    return getDashboardMetrics(ctx, data.range)
  })
