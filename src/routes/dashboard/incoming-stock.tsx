import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PackageCheck, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  createPurchaseOrderFn,
  deletePurchaseOrderFn,
  listProductsFn,
  listPurchaseOrdersFn,
  listSuppliersFn,
  receivePurchaseOrderFn,
  updatePurchaseOrderStatusFn,
} from '@/lib/serverFunctions'
import type { Product, PurchaseOrder, PurchaseOrderStatus, Supplier } from '@/lib/inventory/types'

export const Route = createFileRoute('/dashboard/incoming-stock')({
  loader: async () => {
    const [purchaseOrders, suppliers, products] = await Promise.all([
      listPurchaseOrdersFn(),
      listSuppliersFn(),
      listProductsFn(),
    ])
    return { purchaseOrders, suppliers, products }
  },
  component: IncomingStockPage,
})

function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

const FILTERS: Array<{ key: 'all' | PurchaseOrderStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'received', label: 'Received' },
  { key: 'cancelled', label: 'Cancelled' },
]

function IncomingStockPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | PurchaseOrderStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null)

  const visible = useMemo(
    () => (filter === 'all' ? data.purchaseOrders : data.purchaseOrders.filter((po) => po.status === filter)),
    [data.purchaseOrders, filter],
  )

  const deletePo = async (po: PurchaseOrder) => {
    if (!confirm(`Delete this purchase order from ${po.supplier?.name ?? 'this supplier'}? This cannot be undone.`)) return
    await deletePurchaseOrderFn({ data: { id: po.id } })
    await router.invalidate()
  }

  return (
    <div className="dash-page">
      <div className="dash-inv-header">
        <div>
          <h1 className="dash-page__title" style={{ marginBottom: 4 }}>Incoming Stock</h1>
          <p>Track purchase orders and receive deliveries into inventory</p>
        </div>
        <button className="button button--dark" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Purchase Order
        </button>
      </div>

      <div className="dash-range-tabs" style={{ marginBottom: 'var(--space-lg)', width: 'fit-content' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`dash-range-tab ${filter === f.key ? 'is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr><th>Supplier</th><th>Items</th><th>Expected Date</th><th>Total Cost</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} className="dash-table__empty">No purchase orders yet.</td></tr>
            )}
            {visible.map((po) => (
              <tr key={po.id}>
                <td>{po.supplier?.name ?? '—'}</td>
                <td>{po.items.length} item{po.items.length === 1 ? '' : 's'}</td>
                <td>{po.expected_date ? new Date(po.expected_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                <td>{formatPeso(po.total_cost)}</td>
                <td><span className={`dash-badge dash-badge--${po.status}`}>{po.status.replace('_', ' ')}</span></td>
                <td>
                  <div className="dash-row-actions" style={{ justifyContent: 'flex-end' }}>
                    <a href="#" className="dash-view-link" onClick={(e) => { e.preventDefault(); setViewingPo(po) }}>View →</a>
                    <button className="dash-icon-btn dash-icon-btn--danger" title="Delete" onClick={() => deletePo(po)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreatePurchaseOrderModal
          suppliers={data.suppliers}
          products={data.products}
          onClose={() => setShowCreate(false)}
          onSaved={async () => { setShowCreate(false); await router.invalidate() }}
        />
      )}

      {viewingPo && (
        <PurchaseOrderModal
          po={viewingPo}
          onClose={() => setViewingPo(null)}
          onChanged={async (updated) => {
            setViewingPo(updated)
            await router.invalidate()
          }}
          onDeleted={async () => {
            setViewingPo(null)
            await router.invalidate()
          }}
        />
      )}
    </div>
  )
}

function CreatePurchaseOrderModal({
  suppliers,
  products,
  onClose,
  onSaved,
}: {
  suppliers: Supplier[]
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [handlingFee, setHandlingFee] = useState(0)
  const [shippingFee, setShippingFee] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ product_id: string; quantity_ordered: number; unit_cost: number }>>([])
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    if (products.length === 0) return
    setItems([...items, { product_id: products[0].id, quantity_ordered: 1, unit_cost: products[0].cost_price }])
  }

  const total = items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0) + handlingFee + shippingFee

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !supplierId) return
    setSaving(true)
    await createPurchaseOrderFn({
      data: {
        supplier_id: supplierId,
        expected_date: expectedDate || null,
        handling_fee: handlingFee,
        shipping_fee: shippingFee,
        notes: notes || undefined,
        items,
      },
    })
    onSaved()
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <form className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="dash-modal__header">
          <h2>New Purchase Order</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <div className="dash-form-grid">
            <label className="dash-field">
              <span>Supplier *</span>
              <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="dash-field">
              <span>Expected delivery date</span>
              <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </label>
            <label className="dash-field">
              <span>Handling fee</span>
              <input type="number" min={0} step="0.01" placeholder="0.00" value={handlingFee || ''} onChange={(e) => setHandlingFee(Number(e.target.value))} />
            </label>
            <label className="dash-field">
              <span>Shipping fee</span>
              <input type="number" min={0} step="0.01" placeholder="0.00" value={shippingFee || ''} onChange={(e) => setShippingFee(Number(e.target.value))} />
            </label>
          </div>

          <div className="dash-inv-filters" style={{ justifyContent: 'space-between', marginTop: 'var(--space-sm)' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Items</span>
            <button type="button" className="dash-link-btn" onClick={addItem}><Plus size={13} /> Add item</button>
          </div>

          <div className="dash-line-items">
            {items.map((item, i) => (
              <div className="dash-line-item" key={i}>
                <select value={item.product_id} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, product_id: e.target.value }; setItems(next)
                }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} placeholder="Qty" value={item.quantity_ordered} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, quantity_ordered: Number(e.target.value) }; setItems(next)
                }} />
                <input type="number" min={0} step="0.01" placeholder="Unit cost" value={item.unit_cost} onChange={(e) => {
                  const next = [...items]; next[i] = { ...item, unit_cost: Number(e.target.value) }; setItems(next)
                }} />
                <button type="button" className="dash-line-item__remove" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="dash-empty-state" style={{ padding: 'var(--space-md)' }}>No items yet — add at least one.</p>}
          </div>

          <label className="dash-field">
            <span>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="dash-financials">
            <div><span>Handling fee</span><span>{formatPeso(handlingFee)}</span></div>
            <div><span>Shipping fee</span><span>{formatPeso(shippingFee)}</span></div>
            <div className="dash-financials__total"><span>Estimated total</span><span>{formatPeso(total)}</span></div>
          </div>
        </div>
        <div className="dash-modal__footer">
          <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || items.length === 0 || !supplierId}>
            {saving ? 'Creating…' : 'Create order'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PurchaseOrderModal({
  po,
  onClose,
  onChanged,
  onDeleted,
}: {
  po: PurchaseOrder
  onClose: () => void
  onChanged: (updated: PurchaseOrder) => void
  onDeleted: () => void
}) {
  const [status, setStatus] = useState<Extract<PurchaseOrderStatus, 'pending' | 'in_transit' | 'cancelled'>>(
    po.status === 'received' ? 'in_transit' : po.status,
  )
  const [savingStatus, setSavingStatus] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(po.items.map((i) => [i.id, Math.max(0, i.quantity_ordered - i.quantity_received)])),
  )

  const editable = po.status === 'pending' || po.status === 'in_transit'

  const saveStatus = async () => {
    setSavingStatus(true)
    const updated = await updatePurchaseOrderStatusFn({ data: { id: po.id, status } })
    setSavingStatus(false)
    onChanged(updated)
  }

  const markReceived = async () => {
    setReceiving(true)
    const updated = await receivePurchaseOrderFn({
      data: {
        purchaseOrderId: po.id,
        items: Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([purchaseOrderItemId, quantityReceivedNow]) => ({ purchaseOrderItemId, quantityReceivedNow })),
      },
    })
    setReceiving(false)
    onChanged(updated)
  }

  const deletePo = async () => {
    if (!confirm(`Delete this purchase order from ${po.supplier?.name ?? 'this supplier'}? This cannot be undone.`)) return
    setDeleting(true)
    await deletePurchaseOrderFn({ data: { id: po.id } })
    setDeleting(false)
    onDeleted()
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Purchase Order — {po.supplier?.name ?? 'Unknown supplier'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="dash-link-btn dash-link-btn--danger" onClick={deletePo} disabled={deleting}>
              <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <div className="dash-modal__body">
          <div className="dash-po-top">
            <div className="dash-po-top__left">
              <span className={`dash-badge dash-badge--${po.status}`}>{po.status.replace('_', ' ')}</span>
              <span className="dash-muted">
                {po.expected_date ? `Expected ${new Date(po.expected_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No expected date'}
              </span>
            </div>
            {editable && (
              <div className="dash-po-top__right">
                <label className="dash-field" style={{ gap: 4 }}>
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <button type="button" className="button button--outline" onClick={saveStatus} disabled={savingStatus || status === po.status}>
                  {savingStatus ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </div>

          <div className="dash-table-wrap" style={{ border: 'none' }}>
            <table className="dash-table">
              <thead>
                <tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit Cost</th><th>Line Total</th></tr>
              </thead>
              <tbody>
                {po.items.map((item) => {
                  const remaining = item.quantity_ordered - item.quantity_received
                  return (
                    <tr key={item.id}>
                      <td>{item.product?.name ?? 'Product'}</td>
                      <td>{item.quantity_ordered}</td>
                      <td>
                        {editable && remaining > 0 ? (
                          <input
                            type="number"
                            className="dash-inline-input"
                            min={0}
                            max={remaining}
                            value={quantities[item.id] ?? 0}
                            onChange={(e) => setQuantities({ ...quantities, [item.id]: Math.min(remaining, Number(e.target.value)) })}
                          />
                        ) : (
                          item.quantity_received
                        )}
                        <span className="dash-muted"> / {item.quantity_ordered}</span>
                      </td>
                      <td>{formatPeso(item.unit_cost)}</td>
                      <td>{formatPeso(item.unit_cost * item.quantity_ordered)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="dash-financials">
            <div><span>Handling fee</span><span>{formatPeso(po.handling_fee)}</span></div>
            <div><span>Shipping fee</span><span>{formatPeso(po.shipping_fee)}</span></div>
            <div className="dash-financials__total"><span>Current total</span><span>{formatPeso(po.total_cost)}</span></div>
          </div>
        </div>
        {editable && (
          <div className="dash-modal__footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="dash-muted" style={{ maxWidth: 380 }}>
              Marking as received automatically adds these quantities to inventory and updates cost pricing — no manual stock entry needed.
            </p>
            <button type="button" className="button button--dark" onClick={markReceived} disabled={receiving}>
              <PackageCheck size={14} /> {receiving ? 'Receiving…' : 'Mark as Received'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
