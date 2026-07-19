import { ChevronDown, ChevronUp, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { deleteProductSetFn, reorderProductSetsFn } from '@/lib/serverFunctions'
import type { ProductSet } from '@/lib/inventory/types'

function bySortOrder(sets: ProductSet[]): ProductSet[] {
  return [...sets].sort((a, b) => a.sort_order - b.sort_order)
}

export function ManageProductSetsModal({
  productSets,
  onClose,
  onChanged,
}: {
  productSets: ProductSet[]
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [filter, setFilter] = useState('')
  const [order, setOrder] = useState<ProductSet[]>(() => bySortOrder(productSets))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Re-sync whenever the parent refetches (e.g. after a successful reorder
  // or a delete elsewhere), so this panel never drifts from server state.
  useEffect(() => {
    setOrder(bySortOrder(productSets))
  }, [productSets])

  const isFiltering = filter.trim().length > 0
  const visible = useMemo(
    () => order.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())),
    [order, filter],
  )

  const persistOrder = async (next: ProductSet[]) => {
    setSaving(true)
    setError('')
    try {
      await reorderProductSetsFn({ data: { ids: next.map((s) => s.id) } })
      await onChanged()
    } catch {
      setError('Could not save the new order. Please try again.')
      setOrder(bySortOrder(productSets))
    } finally {
      setSaving(false)
    }
  }

  const move = (id: string, direction: -1 | 1) => {
    if (isFiltering || saving) return
    const idx = order.findIndex((s) => s.id === id)
    const targetIdx = idx + direction
    if (idx === -1 || targetIdx < 0 || targetIdx >= order.length) return
    const next = [...order]
    ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
    setOrder(next)
    void persistOrder(next)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this product set?')) return
    await deleteProductSetFn({ data: { id } })
    await onChanged()
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--sets dash-modal--sets-reorder" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Manage Product Sets</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <p className="dash-muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Use the arrows to change the order sets appear in on the Sales / POS grid.
          </p>

          <div className="dash-sets-list-panel__head">
            <div className="dash-search-field" style={{ flex: 1 }}>
              <Search size={13} />
              <input placeholder="Filter sets…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            {saving && <span className="dash-muted">Saving order…</span>}
          </div>
          {isFiltering && <p className="dash-field__hint">Clear the filter to reorder sets.</p>}
          {error && <p className="dash-login__error">{error}</p>}

          <div className="dash-sets-list-panel dash-sets-list-panel--full">
            {visible.map((set) => {
              const idx = order.findIndex((s) => s.id === set.id)
              return (
                <div className="dash-set-row" key={set.id}>
                  <div className="dash-set-row__reorder">
                    <button
                      type="button"
                      className="dash-icon-btn"
                      title="Move up"
                      disabled={isFiltering || saving || idx === 0}
                      onClick={() => move(set.id, -1)}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="dash-icon-btn"
                      title="Move down"
                      disabled={isFiltering || saving || idx === order.length - 1}
                      onClick={() => move(set.id, 1)}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                  <div className="dash-set-row__body">
                    <b>{set.name}</b>
                    <span className="dash-muted">{set.items.length} item(s)</span>
                    <span className="dash-muted">Display order: {idx + 1}</span>
                  </div>
                  <div className="dash-set-row__actions">
                    <button type="button" className="dash-link-btn dash-link-btn--danger" onClick={() => remove(set.id)}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && <p className="dash-empty-state">No sets match.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
