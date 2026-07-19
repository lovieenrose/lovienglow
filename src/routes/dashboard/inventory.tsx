import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Download, Minus, Package, Plus, Search, Settings2, SlidersHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  adjustProductStockFn,
  createCategoryFn,
  createProductBatchFn,
  createProductFn,
  createProductSetFn,
  createSupplierFn,
  deleteCategoryFn,
  deleteProductBatchFn,
  deleteProductFn,
  deleteProductSetFn,
  deleteSupplierFn,
  listCategoriesFn,
  listProductSetsFn,
  listProductsFn,
  listSuppliersFn,
  updateProductBatchFn,
  updateProductFn,
  updateProductSetFn,
} from '@/lib/serverFunctions'
import type { Category, Product, ProductBatch, ProductSet, Supplier } from '@/lib/inventory/types'
import { ImageUploaderSingle } from '@/components/ImageUploader'
import { ExportInventoryModal } from '@/components/inventory/ExportInventoryModal'

export const Route = createFileRoute('/dashboard/inventory')({
  loader: async () => {
    const [products, categories, suppliers, productSets] = await Promise.all([
      listProductsFn(),
      listCategoriesFn(),
      listSuppliersFn(),
      listProductSetsFn(),
    ])
    return { products, categories, suppliers, productSets }
  },
  component: InventoryPage,
})

function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

// The oldest batch with stock remaining is the one FIFO will sell from next,
// so it's the "current" cost — products.cost_price is only a stale fallback
// once a product has batches (see product_batch_costing_migration.sql).
function effectiveCostPrice(product: Product): number {
  const activeBatch = product.batches?.find((b) => b.quantity > 0)
  return activeBatch ? activeBatch.cost_price : product.cost_price
}

function stockBadgeClass(product: Product): string {
  if (product.stock_quantity <= 0) return 'dash-badge--stock-out'
  if (product.stock_quantity <= product.reorder_level) return 'dash-badge--stock-low'
  return 'dash-badge--stock-ok'
}

type Tab = 'products' | 'sets'

function InventoryPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('products')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  const visible = useMemo(() => {
    return data.products
      .filter((p) => {
        if (categoryId && p.category_id !== categoryId) return false
        if (lowStockOnly && p.stock_quantity > p.reorder_level) return false
        if (search) {
          const term = search.toLowerCase()
          const match = p.name.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term) || (p.barcode ?? '').toLowerCase().includes(term)
          if (!match) return false
        }
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  }, [data.products, search, categoryId, lowStockOnly])

  const removeProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    await deleteProductFn({ data: { id: product.id } })
    await router.invalidate()
  }

  return (
    <div className="dash-page">
      <div className="dash-inv-header">
        <div>
          <h1 className="dash-page__title" style={{ marginBottom: 4 }}>Inventory</h1>
          <p>Manage products, stock levels, categories, and suppliers</p>
        </div>
        <div className="dash-toolbar__actions">
          <button className="button button--outline" onClick={() => setShowExportModal(true)}>
            <Download size={14} /> Export
          </button>
          <button className="button button--outline" onClick={() => setShowCatalogModal(true)}>
            <Settings2 size={14} /> Categories &amp; Suppliers
          </button>
          <button className="button button--dark" onClick={() => setModalProduct('new')}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      <div className="dash-tabs">
        <button className={`dash-tab ${tab === 'products' ? 'is-active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`dash-tab ${tab === 'sets' ? 'is-active' : ''}`} onClick={() => setTab('sets')}>Product Sets</button>
      </div>

      {tab === 'products' && (
        <>
          <div className="dash-inv-filters">
            <div className="dash-search-field">
              <Search size={14} />
              <input placeholder="Search by name, SKU, or barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="button"
              className={`dash-toggle-btn dash-toggle-btn--danger ${lowStockOnly ? 'is-active' : ''}`}
              onClick={() => setLowStockOnly(!lowStockOnly)}
            >
              <SlidersHorizontal size={13} /> Low stock only
            </button>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th><th>Cost</th><th>Price</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={7} className="dash-table__empty">No products match.</td></tr>
                )}
                {visible.map((product) => {
                  const batches = product.batches ?? []
                  const isBatchTracked = batches.length > 0
                  const isExpanded = expandedProductId === product.id
                  return (
                    <Fragment key={product.id}>
                      <tr>
                        <td>
                          <div className="dash-product-cell">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" />
                            ) : (
                              <span className="dash-product-cell__icon"><Package size={14} /></span>
                            )}
                            {product.name}
                          </div>
                        </td>
                        <td>{product.sku ?? '—'}</td>
                        <td>{product.category?.name ?? '—'}</td>
                        <td>{formatPeso(effectiveCostPrice(product))}</td>
                        <td>{formatPeso(product.selling_price)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`dash-badge ${stockBadgeClass(product)}`}>{product.stock_quantity} {product.unit}</span>
                            {isBatchTracked && (
                              <button
                                type="button"
                                className="dash-icon-btn"
                                title={`${batches.length} batch(es) — click to ${isExpanded ? 'hide' : 'view'}`}
                                onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="dash-row-actions">
                            <button
                              className="dash-icon-btn"
                              title="Adjust stock"
                              onClick={() => setAdjustingProduct(product)}
                            >
                              <SlidersHorizontal size={14} />
                            </button>
                            <button className="dash-icon-btn" title="Edit" onClick={() => setModalProduct(product)}>
                              <Pencil size={14} />
                            </button>
                            <button className="dash-icon-btn dash-icon-btn--danger" title="Delete" onClick={() => removeProduct(product)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && isBatchTracked && (
                        <tr className="dash-batch-subrow">
                          <td colSpan={7}>
                            <ul className="dash-batch-list">
                              {batches.map((batch) => (
                                <li key={batch.id}>
                                  <b>{batch.quantity}</b> {product.unit} left <span className="dash-muted">({batch.batch_name})</span>
                                  {' '}<span className="dash-muted">@ {formatPeso(batch.cost_price)} cost</span>
                                  {batch.expiration_date && <span className="dash-muted"> — exp. {batch.expiration_date}</span>}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'sets' && <ProductSetsTab productSets={data.productSets} products={data.products} />}

      {modalProduct && (
        <ProductModal
          product={modalProduct === 'new' ? null : modalProduct}
          categories={data.categories}
          suppliers={data.suppliers}
          onClose={() => setModalProduct(null)}
          onSaved={async () => {
            setModalProduct(null)
            await router.invalidate()
          }}
        />
      )}

      {adjustingProduct && (
        <AdjustStockModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={async () => {
            setAdjustingProduct(null)
            await router.invalidate()
          }}
        />
      )}

      {showCatalogModal && (
        <CategoriesSuppliersModal
          categories={data.categories}
          suppliers={data.suppliers}
          onClose={() => setShowCatalogModal(false)}
        />
      )}

      {showExportModal && (
        <ExportInventoryModal products={data.products} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}

// ── Add / Edit Product ───────────────────────────────────────────────────

function ProductModal({
  product,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  suppliers: Supplier[]
  onClose: () => void
  onSaved: () => void
}) {
  const router = useRouter()
  const hasActiveBatches = product?.batches?.some((b) => b.quantity > 0) ?? false
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    category_id: product?.category_id ?? '',
    supplier_id: product?.supplier_id ?? '',
    cost_price: product ? effectiveCostPrice(product) : 0,
    selling_price: product?.selling_price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    reorder_level: product?.reorder_level ?? 5,
    unit: product?.unit ?? 'pc',
    image_url: product?.image_url ?? '',
    description: product?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: Omit<typeof form, 'category_id' | 'supplier_id'> & {
        category_id: string | null
        supplier_id: string | null
      } = {
        ...form,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
      }
      if (product) {
        const { stock_quantity: _stock, ...editablePayload } = payload
        await updateProductFn({ data: { id: product.id, ...editablePayload } })
      } else {
        await createProductFn({ data: payload })
      }
      onSaved()
    } catch {
      setError('Could not save product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <form className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <div className="dash-form-grid">
            <label className="dash-field dash-field--span2">
              <span>Inventory image</span>
              <ImageUploaderSingle value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </label>
            <label className="dash-field dash-field--span2">
              <span>Product name *</span>
              <input required placeholder="e.g. Ceramic Mug" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>SKU *</span>
              <input required placeholder="e.g. MUG-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Barcode</span>
              <input placeholder="Optional" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Category</span>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="dash-field">
              <span>Supplier</span>
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className={`dash-field ${hasActiveBatches ? 'dash-field--locked' : ''}`}>
              <span>Cost price *</span>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                disabled={hasActiveBatches}
                title={hasActiveBatches ? 'Computed from the oldest active batch below' : undefined}
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
              />
            </label>
            <label className="dash-field">
              <span>Selling price *</span>
              <input type="number" step="0.01" min={0} required value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} />
            </label>
            <label className={`dash-field ${product ? 'dash-field--locked' : ''}`}>
              <span>Stock quantity *</span>
              <input
                type="number"
                min={0}
                required
                disabled={Boolean(product)}
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
              />
            </label>
            <label className="dash-field">
              <span>Reorder level *</span>
              <input type="number" min={0} required value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} />
            </label>
            <label className="dash-field">
              <span>Unit</span>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </label>
            <label className="dash-field dash-field--span2">
              <span>Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          {product && (
            <p className="dash-field__hint">
              {hasActiveBatches
                ? 'Stock quantity and cost price are locked here — both are computed automatically from the batches below (cost follows the oldest active batch, next up for FIFO).'
                : 'Stock quantity is locked here — use "Adjust Stock" for manual corrections so every change stays audited.'}
            </p>
          )}

          {product && (
            <ProductBatchesSection product={product} onChanged={() => router.invalidate()} />
          )}

          {error && <p className="dash-login__error">{error}</p>}
        </div>
        <div className="dash-modal__footer">
          <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Batch/Lot tracking ───────────────────────────────────────────────────

function ProductBatchesSection({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const [batches, setBatches] = useState<ProductBatch[]>(product.batches ?? [])
  const [newBatch, setNewBatch] = useState({
    batch_name: '',
    quantity: '',
    cost_price: String(product.cost_price ?? 0),
    expiration_date: '',
  })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const total = batches.reduce((sum, b) => sum + b.quantity, 0)

  const commitBatch = async (
    batch: ProductBatch,
    patch: Partial<{ batch_name: string; quantity: number; cost_price: number; expiration_date: string | null }>,
  ) => {
    setSavingId(batch.id)
    setError('')
    try {
      const updated = await updateProductBatchFn({ data: { id: batch.id, ...patch } })
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? updated : b)))
      onChanged()
    } catch {
      setError('Could not save batch change.')
    } finally {
      setSavingId(null)
    }
  }

  const addBatch = async () => {
    if (!newBatch.batch_name.trim()) return
    setAdding(true)
    setError('')
    try {
      const created = await createProductBatchFn({
        data: {
          productId: product.id,
          batch_name: newBatch.batch_name.trim(),
          quantity: Number(newBatch.quantity) || 0,
          cost_price: Number(newBatch.cost_price) || 0,
          expiration_date: newBatch.expiration_date || undefined,
        },
      })
      setBatches((prev) => [...prev, created])
      setNewBatch({ batch_name: '', quantity: '', cost_price: String(product.cost_price ?? 0), expiration_date: '' })
      onChanged()
    } catch {
      setError('Could not add batch.')
    } finally {
      setAdding(false)
    }
  }

  const removeBatch = async (batch: ProductBatch) => {
    if (!confirm(`Remove batch "${batch.batch_name}"?`)) return
    setSavingId(batch.id)
    setError('')
    try {
      await deleteProductBatchFn({ data: { id: batch.id } })
      setBatches((prev) => prev.filter((b) => b.id !== batch.id))
      onChanged()
    } catch {
      setError('Could not remove batch.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="dash-batch-section">
      <div className="dash-section-divider">Batches</div>
      <p className="dash-field__hint">
        Split this product's stock into manufacturing/arrival batches. Sales deduct from the oldest batch first (FIFO).
      </p>

      {batches.length > 0 && (
        <div className="dash-batch-row-head">
          <span>Batch name</span>
          <span>Qty</span>
          <span>Cost price</span>
          <span>Expiry</span>
          <span />
        </div>
      )}

      {batches.map((batch) => (
        <BatchRow
          key={batch.id}
          batch={batch}
          unit={product.unit}
          saving={savingId === batch.id}
          onCommit={(patch) => commitBatch(batch, patch)}
          onRemove={() => removeBatch(batch)}
        />
      ))}

      <div
        className="dash-batch-row"
        onKeyDown={(e) => {
          // This section lives inside the outer "Edit Product" <form> — an
          // Enter keypress here would otherwise submit that form (saving
          // just the top-level product fields and closing the modal),
          // silently discarding whatever batch draft hadn't been added yet.
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (!adding && newBatch.batch_name.trim()) void addBatch()
        }}
      >
        <input
          type="text"
          placeholder="Batch name, e.g. June Batch"
          value={newBatch.batch_name}
          onChange={(e) => setNewBatch({ ...newBatch, batch_name: e.target.value })}
        />
        <input
          type="number"
          min={0}
          placeholder="Qty"
          value={newBatch.quantity}
          onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Cost price"
          title="Cost price for this batch"
          value={newBatch.cost_price}
          onChange={(e) => setNewBatch({ ...newBatch, cost_price: e.target.value })}
        />
        <input
          type="date"
          value={newBatch.expiration_date}
          onChange={(e) => setNewBatch({ ...newBatch, expiration_date: e.target.value })}
        />
        <button type="button" className="button button--outline" disabled={adding || !newBatch.batch_name.trim()} onClick={addBatch}>
          <Plus size={13} /> Add New Batch
        </button>
      </div>

      <p className="dash-batch-total">Total across batches: <b>{total}</b> {product.unit}</p>
      {error && <p className="dash-login__error">{error}</p>}
    </div>
  )
}

function BatchRow({
  batch,
  unit,
  saving,
  onCommit,
  onRemove,
}: {
  batch: ProductBatch
  unit: string
  saving: boolean
  onCommit: (patch: Partial<{ batch_name: string; quantity: number; cost_price: number; expiration_date: string | null }>) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(batch.batch_name)
  const [quantity, setQuantity] = useState(batch.quantity)
  const [costPrice, setCostPrice] = useState(batch.cost_price)
  const [expiration, setExpiration] = useState(batch.expiration_date ?? '')

  useEffect(() => {
    setName(batch.batch_name)
    setQuantity(batch.quantity)
    setCostPrice(batch.cost_price)
    setExpiration(batch.expiration_date ?? '')
  }, [batch])

  return (
    <div
      className="dash-batch-row"
      onKeyDown={(e) => {
        // Same reasoning as the "add new batch" row: this lives inside the
        // outer "Edit Product" <form>, so Enter must commit the field
        // (blur) instead of submitting the whole product form and skipping
        // whatever hadn't been blurred yet.
        if (e.key !== 'Enter') return
        e.preventDefault()
        ;(document.activeElement as HTMLElement | null)?.blur()
      }}
    >
      <input
        type="text"
        value={name}
        disabled={saving}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => { if (name.trim() && name !== batch.batch_name) onCommit({ batch_name: name.trim() }) }}
      />
      <input
        type="number"
        min={0}
        title={`Quantity (${unit})`}
        value={quantity}
        disabled={saving}
        onChange={(e) => setQuantity(Number(e.target.value))}
        onBlur={() => { if (quantity !== batch.quantity) onCommit({ quantity }) }}
      />
      <input
        type="number"
        min={0}
        step="0.01"
        title="Cost price for this batch"
        value={costPrice}
        disabled={saving}
        onChange={(e) => setCostPrice(Number(e.target.value))}
        onBlur={() => { if (costPrice !== batch.cost_price) onCommit({ cost_price: costPrice }) }}
      />
      <input
        type="date"
        value={expiration}
        disabled={saving}
        onChange={(e) => setExpiration(e.target.value)}
        onBlur={() => { if (expiration !== (batch.expiration_date ?? '')) onCommit({ expiration_date: expiration || null }) }}
      />
      <button type="button" className="dash-line-item__remove" disabled={saving} onClick={onRemove}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Adjust Stock ──────────────────────────────────────────────────────────

const ADJUST_REASONS = ['Stock recount', 'Damaged / Lost', 'Restock', 'Return from customer', 'Other']

function AdjustStockModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [direction, setDirection] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState(ADJUST_REASONS[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) return
    setSaving(true)
    setError('')
    try {
      await adjustProductStockFn({ data: { id: product.id, direction, quantity, reason, notes: notes || undefined } })
      onSaved()
    } catch {
      setError('Could not save adjustment.')
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>Adjust stock — {product.name}</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <p className="dash-current-qty">Current quantity: <b>{product.stock_quantity} {product.unit}</b></p>

          <div className="dash-segmented">
            <button
              type="button"
              className={`dash-segmented__btn dash-segmented__btn--add ${direction === 'add' ? 'is-active' : ''}`}
              onClick={() => setDirection('add')}
            >
              <Plus size={14} /> Add stock
            </button>
            <button
              type="button"
              className={`dash-segmented__btn dash-segmented__btn--remove ${direction === 'remove' ? 'is-active' : ''}`}
              onClick={() => setDirection('remove')}
            >
              <Minus size={14} /> Remove stock
            </button>
          </div>

          <label className="dash-field">
            <span>Quantity</span>
            <input type="number" min={1} value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </label>
          <label className="dash-field">
            <span>Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {ADJUST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="dash-field">
            <span>Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {error && <p className="dash-login__error">{error}</p>}
        </div>
        <div className="dash-modal__footer">
          <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || quantity <= 0}>
            {saving ? 'Saving…' : 'Save adjustment'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Categories & Suppliers (combined modal) ───────────────────────────────

function CategoriesSuppliersModal({
  categories,
  suppliers,
  onClose,
}: {
  categories: Category[]
  suppliers: Supplier[]
  onClose: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'categories' | 'suppliers'>('categories')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const addCategory = async () => {
    if (!name.trim()) return
    setSaving(true)
    await createCategoryFn({ data: { name } })
    setName('')
    setSaving(false)
    await router.invalidate()
  }

  const addSupplier = async () => {
    if (!name.trim()) return
    setSaving(true)
    await createSupplierFn({ data: { name } })
    setName('')
    setSaving(false)
    await router.invalidate()
  }

  const removeCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return
    await deleteCategoryFn({ data: { id } })
    await router.invalidate()
  }

  const removeSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    await deleteSupplierFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-cs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Manage Categories &amp; Suppliers</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <div className="dash-cs-tabs">
            <button className={`dash-cs-tab ${tab === 'categories' ? 'is-active' : ''}`} onClick={() => { setTab('categories'); setName('') }}>Categories</button>
            <button className={`dash-cs-tab ${tab === 'suppliers' ? 'is-active' : ''}`} onClick={() => { setTab('suppliers'); setName('') }}>Suppliers</button>
          </div>

          <form
            className="dash-cs-add-row"
            onSubmit={(e) => {
              e.preventDefault()
              tab === 'categories' ? addCategory() : addSupplier()
            }}
          >
            <input placeholder={tab === 'categories' ? 'New category name' : 'New supplier name'} value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit" disabled={saving || !name.trim()}><Plus size={16} /></button>
          </form>

          {tab === 'categories' ? (
            <div className="dash-cs-list">
              {categories.length === 0 && <p className="dash-cs-list__empty">No categories yet.</p>}
              {categories.map((c) => (
                <div className="dash-cs-list__row" key={c.id}>
                  <span>{c.name}</span>
                  <button className="dash-icon-btn dash-icon-btn--danger" onClick={() => removeCategory(c.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-cs-list">
              {suppliers.length === 0 && <p className="dash-cs-list__empty">No suppliers yet.</p>}
              {suppliers.map((s) => (
                <div className="dash-cs-list__row" key={s.id}>
                  <span>{s.name}</span>
                  <button className="dash-icon-btn dash-icon-btn--danger" onClick={() => removeSupplier(s.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Product Sets ──────────────────────────────────────────────────────────

function ProductSetsTab({ productSets, products }: { productSets: ProductSet[]; products: Product[] }) {
  const router = useRouter()
  const [modalSet, setModalSet] = useState<ProductSet | 'new' | null>(null)

  const remove = async (id: string) => {
    if (!confirm('Delete this product set?')) return
    await deleteProductSetFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div>
      <div className="dash-toolbar">
        <div />
        <button className="button button--dark" onClick={() => setModalSet('new')}><Plus size={14} /> Add Product Set</button>
      </div>

      {productSets.length === 0 ? (
        <p className="dash-empty-state">No product sets yet. Bundle products together for quick POS access.</p>
      ) : (
        <div className="dash-cards">
          {productSets.map((set) => (
            <div className="dash-card" key={set.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <b>{set.name}</b>
                <div className="dash-row-actions">
                  <button className="dash-icon-btn" title="Edit" onClick={() => setModalSet(set)}><Pencil size={13} /></button>
                  <button className="dash-icon-btn dash-icon-btn--danger" title="Delete" onClick={() => remove(set.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <ul style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 16 }}>
                {set.items.map((item) => (
                  <li key={item.id}>{item.quantity}× {item.product?.name ?? 'Unknown product'}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {modalSet && (
        <ProductSetModal
          set={modalSet === 'new' ? null : modalSet}
          products={products}
          onClose={() => setModalSet(null)}
          onSaved={async () => { setModalSet(null); await router.invalidate() }}
        />
      )}
    </div>
  )
}

function ProductSetModal({
  set,
  products,
  onClose,
  onSaved,
}: {
  set: ProductSet | null
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(set?.name ?? '')
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>(
    set?.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) ?? [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    [products],
  )

  const addItem = () => {
    if (sortedProducts.length === 0) return
    setItems([...items, { product_id: sortedProducts[0].id, quantity: 1 }])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || items.length === 0) return
    setSaving(true)
    setError('')
    try {
      if (set) {
        await updateProductSetFn({ data: { id: set.id, name, icon: set.icon ?? undefined, color: set.color ?? undefined, sort_order: set.sort_order, items } })
      } else {
        await createProductSetFn({ data: { name, items } })
      }
      onSaved()
    } catch {
      setError('Could not save product set.')
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <form className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>{set ? 'Edit Product Set' : 'Add Product Set'}</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <label className="dash-field">
            <span>Set Name *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="dash-line-items">
            {items.map((item, i) => (
              <div className="dash-line-item" key={i}>
                <select value={item.product_id} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, product_id: e.target.value }; setItems(next)
                }}>
                  {sortedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} value={item.quantity} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, quantity: Number(e.target.value) }; setItems(next)
                }} />
                <div />
                <button type="button" className="dash-line-item__remove" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="button button--outline" onClick={addItem}><Plus size={13} /> Add Item</button>
          {items.length === 0 && <p className="dash-field__hint">Add at least one product to this set.</p>}
          {error && <p className="dash-login__error">{error}</p>}
        </div>
        <div className="dash-modal__footer">
          <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || !name.trim() || items.length === 0}>
            {saving ? 'Saving…' : set ? 'Save changes' : 'Save Set'}
          </button>
        </div>
      </form>
    </div>
  )
}
