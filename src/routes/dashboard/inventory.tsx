import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Minus, Package, Plus, Search, Settings2, SlidersHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  adjustProductStockFn,
  createCategoryFn,
  createProductFn,
  createProductSetFn,
  createSupplierFn,
  deleteCategoryFn,
  deleteProductFn,
  deleteProductSetFn,
  deleteSupplierFn,
  listCategoriesFn,
  listProductSetsFn,
  listProductsFn,
  listSuppliersFn,
  updateProductFn,
} from '@/lib/serverFunctions'
import type { Category, Product, ProductSet, Supplier } from '@/lib/inventory/types'

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

  const visible = useMemo(() => {
    return data.products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false
      if (lowStockOnly && p.stock_quantity > p.reorder_level) return false
      if (search) {
        const term = search.toLowerCase()
        const match = p.name.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term) || (p.barcode ?? '').toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })
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
                {visible.map((product) => (
                  <tr key={product.id}>
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
                    <td>{formatPeso(product.cost_price)}</td>
                    <td>{formatPeso(product.selling_price)}</td>
                    <td><span className={`dash-badge ${stockBadgeClass(product)}`}>{product.stock_quantity} {product.unit}</span></td>
                    <td>
                      <div className="dash-row-actions">
                        <button className="dash-icon-btn" title="Adjust stock" onClick={() => setAdjustingProduct(product)}>
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
                ))}
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
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    category_id: product?.category_id ?? '',
    supplier_id: product?.supplier_id ?? '',
    cost_price: product?.cost_price ?? 0,
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
      const payload = {
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
      <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <div className="dash-form-grid">
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
            <label className="dash-field">
              <span>Cost price *</span>
              <input type="number" step="0.01" min={0} required value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
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
            <label className="dash-field">
              <span>Image URL</span>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </label>
            <label className="dash-field dash-field--span2">
              <span>Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          {product && (
            <p className="dash-field__hint">
              Stock quantity is locked here — use "Adjust Stock" for manual corrections so every change stays audited.
            </p>
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
  const [showModal, setShowModal] = useState(false)

  const remove = async (id: string) => {
    if (!confirm('Delete this product set?')) return
    await deleteProductSetFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div>
      <div className="dash-toolbar">
        <div />
        <button className="button button--dark" onClick={() => setShowModal(true)}><Plus size={14} /> Add Product Set</button>
      </div>

      {productSets.length === 0 ? (
        <p className="dash-empty-state">No product sets yet. Bundle products together for quick POS access.</p>
      ) : (
        <div className="dash-cards">
          {productSets.map((set) => (
            <div className="dash-card" key={set.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <b>{set.name}</b>
                <button className="dash-icon-btn dash-icon-btn--danger" onClick={() => remove(set.id)}><Trash2 size={13} /></button>
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

      {showModal && (
        <ProductSetModal products={products} onClose={() => setShowModal(false)} onSaved={async () => { setShowModal(false); await router.invalidate() }} />
      )}
    </div>
  )
}

function ProductSetModal({
  products,
  onClose,
  onSaved,
}: {
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>([])
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    if (products.length === 0) return
    setItems([...items, { product_id: products[0].id, quantity: 1 }])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setSaving(true)
    await createProductSetFn({ data: { name, items } })
    onSaved()
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <form className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>Add Product Set</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <label className="dash-field">
            <span>Set Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="dash-line-items">
            {items.map((item, i) => (
              <div className="dash-line-item" key={i}>
                <select value={item.product_id} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, product_id: e.target.value }; setItems(next)
                }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        </div>
        <div className="dash-modal__footer">
          <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || items.length === 0}>{saving ? 'Saving…' : 'Save Set'}</button>
        </div>
      </form>
    </div>
  )
}
