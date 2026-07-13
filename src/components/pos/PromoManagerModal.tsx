import { Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createPromoFn, deletePromoFn, updatePromoFn } from '@/lib/serverFunctions'
import type { Product, Promo, PromoRewardType } from '@/lib/inventory/types'
import { formatPeso } from '@/routes/dashboard/pos'

interface PromoForm {
  id: string | null
  code: string
  reward_type: PromoRewardType
  reward_value: number
  active: boolean
  trigger_product_ids: string[]
  reward_product_ids: string[]
}

function emptyForm(): PromoForm {
  return { id: null, code: '', reward_type: 'fixed_discount', reward_value: 0, active: true, trigger_product_ids: [], reward_product_ids: [] }
}

function rewardSummary(promo: Promo, products: Product[]): string {
  if (promo.reward_type === 'fixed_discount') return `Fixed amount discount: ${formatPeso(promo.reward_value)}`
  if (promo.reward_type === 'percent_discount') return `Percent discount: ${promo.reward_value}%`
  const names = promo.reward_product_ids.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean)
  if (names.length === 0) return 'Free item: (no products selected)'
  const [first, ...rest] = names
  return `Free item: ${first}${rest.length ? ` +${rest.length} more` : ''}`
}

function triggerSummary(promo: Promo, products: Product[]): string {
  const names = promo.trigger_product_ids.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean)
  if (names.length === 0) return 'Applies to any cart'
  const [first, ...rest] = names
  return `Trigger Products: ${first}${rest.length ? ` +${rest.length} more` : ''}`
}

export function PromoManagerModal({
  promos,
  products,
  onClose,
  onChanged,
}: {
  promos: Promo[]
  products: Product[]
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [form, setForm] = useState<PromoForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const toggleTrigger = (id: string) => {
    setForm((f) => ({
      ...f,
      trigger_product_ids: f.trigger_product_ids.includes(id)
        ? f.trigger_product_ids.filter((x) => x !== id)
        : [...f.trigger_product_ids, id],
    }))
  }

  const toggleReward = (id: string) => {
    setForm((f) => ({
      ...f,
      reward_product_ids: f.reward_product_ids.includes(id)
        ? f.reward_product_ids.filter((x) => x !== id)
        : [...f.reward_product_ids, id],
    }))
  }

  const startEdit = (promo: Promo) => {
    setForm({
      id: promo.id,
      code: promo.code,
      reward_type: promo.reward_type,
      reward_value: promo.reward_value,
      active: promo.active,
      trigger_product_ids: promo.trigger_product_ids,
      reward_product_ids: promo.reward_product_ids,
    })
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this promo?')) return
    await deletePromoFn({ data: { id } })
    await onChanged()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) return
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        reward_type: form.reward_type,
        reward_value: form.reward_value,
        active: form.active,
        trigger_product_ids: form.trigger_product_ids,
        reward_product_ids: form.reward_product_ids,
      }
      if (form.id) {
        await updatePromoFn({ data: { id: form.id, ...payload } })
      } else {
        await createPromoFn({ data: payload })
      }
      await onChanged()
      setForm(emptyForm())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--promos" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <div>
            <h2>Promo / Discount Manager</h2>
            <p className="dash-muted">Lightweight vouchers based on selected inventory products.</p>
          </div>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body dash-promo-layout">
          <form className="dash-promo-form" onSubmit={submit}>
            <label className="dash-field">
              <span>Promo Code</span>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="FIRSTDAY" />
            </label>

            <div className="dash-field">
              <span>Trigger Product(s)</span>
              <div className="dash-checklist">
                {products.map((p) => (
                  <label key={p.id} className="dash-checklist__row">
                    <input type="checkbox" checked={form.trigger_product_ids.includes(p.id)} onChange={() => toggleTrigger(p.id)} />
                    <span>{p.name}</span>
                    <span className="dash-muted">{formatPeso(p.selling_price)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="dash-field">
              <span>Reward</span>
              <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value as PromoRewardType })}>
                <option value="fixed_discount">Fixed amount discount</option>
                <option value="percent_discount">Percent discount</option>
                <option value="free_item">Free item</option>
              </select>
            </label>

            {form.reward_type === 'free_item' ? (
              <div className="dash-field">
                <span>Reward Item(s)</span>
                <div className="dash-checklist">
                  {products.map((p) => (
                    <label key={p.id} className="dash-checklist__row">
                      <input type="checkbox" checked={form.reward_product_ids.includes(p.id)} onChange={() => toggleReward(p.id)} />
                      <span>{p.name}</span>
                      <span className="dash-muted">{formatPeso(p.selling_price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <label className="dash-field">
                <span>{form.reward_type === 'percent_discount' ? 'Percent off (%)' : 'Discount amount'}</span>
                <input type="number" min={0} step="0.01" value={form.reward_value} onChange={(e) => setForm({ ...form, reward_value: Number(e.target.value) })} />
              </label>
            )}

            <label className="dash-checklist__row" style={{ padding: '4px 0' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>Active</span>
            </label>

            <button type="submit" className="button button--dark button--wide" disabled={saving}>
              {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add Promo'}
            </button>
          </form>

          <div className="dash-promo-list">
            <div className="dash-promo-list__head">
              <h3>Promo Vouchers</h3>
              <span className="dash-muted">{promos.length} total</span>
            </div>
            {promos.map((promo) => (
              <div className="dash-promo-card" key={promo.id}>
                <div className="dash-promo-card__head">
                  <b>{promo.code}</b>
                  <span className={`dash-badge ${promo.active ? 'dash-badge--stock-ok' : 'dash-badge--stock-out'}`}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="dash-muted">{triggerSummary(promo, products)}</p>
                <p className="dash-muted">Reward: {rewardSummary(promo, products)}</p>
                <div className="dash-promo-card__actions">
                  <button type="button" className="dash-icon-btn" onClick={() => startEdit(promo)}><Pencil size={13} /></button>
                  <button type="button" className="dash-icon-btn dash-icon-btn--danger" onClick={() => remove(promo.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {promos.length === 0 && <p className="dash-empty-state">No promos yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
