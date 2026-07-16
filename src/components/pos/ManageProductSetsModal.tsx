import { ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  createProductSetFn,
  deleteProductSetFn,
  swapProductSetOrderFn,
  updateProductSetFn,
} from '@/lib/serverFunctions'
import type { Product, ProductSet } from '@/lib/inventory/types'

const ICON_OPTIONS = ['Package', 'Box', 'Gift', 'Star', 'Tag', 'Sparkles', 'Heart', 'Layers', 'ShoppingBag', 'Bookmark', 'Award', 'Flame']

interface SetForm {
  id: string | null
  name: string
  color: string
  icon: string
  sort_order: number
  items: Array<{ product_id: string; quantity: number }>
}

function emptyForm(nextSortOrder: number): SetForm {
  return { id: null, name: '', color: '#EFF6FF', icon: 'Package', sort_order: nextSortOrder, items: [] }
}

export function ManageProductSetsModal({
  productSets,
  products,
  onClose,
  onChanged,
}: {
  productSets: ProductSet[]
  products: Product[]
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState<SetForm>(emptyForm(productSets.length))
  const [saving, setSaving] = useState(false)

  const sorted = [...productSets].sort((a, b) => a.sort_order - b.sort_order)
  const visible = sorted.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    [products],
  )

  const startEdit = (set: ProductSet) => {
    setForm({
      id: set.id,
      name: set.name,
      color: set.color ?? '#EFF6FF',
      icon: set.icon ?? 'Package',
      sort_order: set.sort_order,
      items: set.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    })
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this product set?')) return
    await deleteProductSetFn({ data: { id } })
    await onChanged()
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = sorted[index + direction]
    const current = sorted[index]
    if (!target) return
    await swapProductSetOrderFn({
      data: {
        a: { id: current.id, sort_order: current.sort_order },
        b: { id: target.id, sort_order: target.sort_order },
      },
    })
    await onChanged()
  }

  const addItem = () => {
    if (sortedProducts.length === 0) return
    setForm((f) => ({ ...f, items: [...f.items, { product_id: sortedProducts[0].id, quantity: 1 }] }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.items.length === 0) return
    setSaving(true)
    try {
      const payload = { name: form.name, icon: form.icon, color: form.color, sort_order: form.sort_order, items: form.items }
      if (form.id) {
        await updateProductSetFn({ data: { id: form.id, ...payload } })
      } else {
        await createProductSetFn({ data: payload })
      }
      await onChanged()
      setForm(emptyForm(productSets.length + 1))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--sets" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Manage Product Sets</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body dash-sets-layout">
          <div className="dash-sets-list-panel">
            <div className="dash-sets-list-panel__head">
              <div className="dash-search-field" style={{ flex: 1 }}>
                <Search size={13} />
                <input placeholder="Filter sets…" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <button type="button" className="button button--dark" onClick={() => setForm(emptyForm(productSets.length))}>
                <Plus size={13} /> New
              </button>
            </div>
            {visible.map((set, i) => (
              <div className="dash-set-row" key={set.id}>
                <div className="dash-set-row__reorder">
                  <button type="button" className="dash-icon-btn" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp size={13} /></button>
                  <button type="button" className="dash-icon-btn" disabled={i === visible.length - 1} onClick={() => move(i, 1)}><ChevronDown size={13} /></button>
                </div>
                <div className="dash-set-row__body">
                  <b>{set.name}</b>
                  <span className="dash-muted">{set.items.length} item(s)</span>
                  <span className="dash-muted">Color: {set.color ?? '—'}</span>
                </div>
                <div className="dash-set-row__actions">
                  <button type="button" className="dash-link-btn" onClick={() => startEdit(set)}><Pencil size={12} /> Edit</button>
                  <button type="button" className="dash-link-btn dash-link-btn--danger" onClick={() => remove(set.id)}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            ))}
            {visible.length === 0 && <p className="dash-empty-state">No sets match.</p>}
          </div>

          <form className="dash-set-form" onSubmit={submit}>
            <h3>{form.id ? 'Edit product set' : 'New product set'}</h3>
            <p className="dash-muted">Bundles are expanded into line items when added to the cart.</p>
            <div className="dash-form-grid">
              <label className="dash-field">
                <span>Name</span>
                <input required placeholder="TRX30 Kit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="dash-field">
                <span>Color</span>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </label>
              <label className="dash-field">
                <span>Icon</span>
                <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </label>
              <label className="dash-field">
                <span>Display order</span>
                <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </label>
            </div>

            <div>
              <span className="dash-field__hint" style={{ display: 'block', marginBottom: 6 }}>Products — each item will be added to the cart individually.</span>
              <div className="dash-line-items">
                {form.items.map((item, i) => (
                  <div className="dash-line-item" style={{ gridTemplateColumns: '2fr 1fr auto' }} key={i}>
                    <select value={item.product_id} onChange={(e) => {
                      const next = [...form.items]; next[i] = { ...item, product_id: e.target.value }; setForm({ ...form, items: next })
                    }}>
                      {sortedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min={1} value={item.quantity} onChange={(e) => {
                      const next = [...form.items]; next[i] = { ...item, quantity: Number(e.target.value) }; setForm({ ...form, items: next })
                    }} />
                    <button type="button" className="dash-line-item__remove" onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="button button--outline" onClick={addItem} style={{ marginTop: 8 }}>
                <Plus size={13} /> Add product
              </button>
            </div>

            <div className="dash-modal__footer" style={{ padding: 0, border: 'none' }}>
              <button type="button" className="button button--outline" onClick={() => setForm(emptyForm(productSets.length))}>Cancel</button>
              <button type="submit" className="button button--dark" disabled={saving || !form.name || form.items.length === 0}>
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create set'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
