import { Download, Image as ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { markSalePaidFn, updateSaleInvoiceItemsFn, updateSaleInvoiceTitleFn, uploadPaymentProofFn } from '@/lib/serverFunctions'
import type { BusinessProfile, InvoiceLineItem, SalesOrder } from '@/lib/inventory/types'
import { formatPeso } from '@/routes/dashboard/pos'

function itemizedDefault(order: SalesOrder): InvoiceLineItem[] {
  return (order.items ?? []).map((item) => ({
    label: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))
}

function InvoiceItemsEditor({ order, onSaved }: { order: SalesOrder; onSaved: (order: SalesOrder) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<InvoiceLineItem[]>(order.invoice_items ?? itemizedDefault(order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isCustomized = Boolean(order.invoice_items && order.invoice_items.length > 0)

  const startEditing = () => {
    setDraft(isCustomized ? (order.invoice_items as InvoiceLineItem[]) : itemizedDefault(order))
    setError('')
    setEditing(true)
  }

  const addLine = () => setDraft((prev) => [...prev, { label: '', quantity: 1, unit_price: 0 }])
  const removeLine = (i: number) => setDraft((prev) => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<InvoiceLineItem>) =>
    setDraft((prev) => prev.map((line, idx) => (idx === i ? { ...line, ...patch } : line)))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const cleaned = draft.filter((line) => line.label.trim().length > 0)
      const updated = await updateSaleInvoiceItemsFn({ data: { id: order.id, invoiceItems: cleaned } })
      onSaved(updated)
      setEditing(false)
    } catch {
      setError('Could not save invoice items.')
    } finally {
      setSaving(false)
    }
  }

  const resetToItemized = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateSaleInvoiceItemsFn({ data: { id: order.id, invoiceItems: null } })
      onSaved(updated)
      setDraft(itemizedDefault(updated))
      setEditing(false)
    } catch {
      setError('Could not reset invoice items.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="dash-field">
        <span>Invoice Items</span>
        <button type="button" className="button button--outline button--wide" onClick={startEditing}>
          <Pencil size={14} /> Customize Invoice Items
        </button>
        {isCustomized && (
          <p className="dash-field__hint">Showing a customized invoice — your real per-item sale record is unaffected.</p>
        )}
      </div>
    )
  }

  return (
    <div className="dash-field dash-invoice-editor">
      <span>Customize Invoice Items</span>
      <p className="dash-field__hint">
        Replace the itemized breakdown with whatever you want printed (e.g. one "TR15 Complete Set" line instead
        of every component). This only changes what's shown on the invoice — your real sales/COGS data is unaffected.
      </p>
      {draft.map((line, i) => (
        <div className="dash-invoice-editor__row" key={i}>
          <input
            type="text"
            placeholder="Item label"
            value={line.label}
            onChange={(e) => updateLine(i, { label: e.target.value })}
          />
          <input
            type="number"
            min={0}
            placeholder="Qty"
            value={line.quantity}
            onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Unit price"
            value={line.unit_price}
            onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })}
          />
          <button type="button" className="dash-line-item__remove" onClick={() => removeLine(i)}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="button button--outline" onClick={addLine}>
        <Plus size={13} /> Add Line
      </button>
      {error && <p className="dash-login__error">{error}</p>}
      <div className="dash-invoice-editor__actions">
        <button type="button" className="button button--outline" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="button button--outline" onClick={resetToItemized} disabled={saving}>
          Reset to itemized
        </button>
        <button
          type="button"
          className="button button--dark"
          onClick={save}
          disabled={saving || draft.every((l) => !l.label.trim())}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function InvoiceTitleEditor({
  order,
  defaultTitle,
  onSaved,
}: {
  order: SalesOrder
  defaultTitle: string
  onSaved: (order: SalesOrder) => void
}) {
  const [title, setTitle] = useState(order.invoice_title ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const commit = async (value: string | null) => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateSaleInvoiceTitleFn({ data: { id: order.id, invoiceTitle: value } })
      onSaved(updated)
    } catch {
      setError('Could not save invoice title.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-field">
      <span>Invoice Title</span>
      <input
        type="text"
        placeholder={defaultTitle}
        value={title}
        disabled={saving}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const trimmed = title.trim()
          if (trimmed !== (order.invoice_title ?? '')) void commit(trimmed || null)
        }}
      />
      <p className="dash-field__hint">
        Defaults to your business name — override it for an occasional co-branded sale (e.g. "LOVIE X PINC").
      </p>
      {order.invoice_title && (
        <button
          type="button"
          className="dash-link-btn"
          disabled={saving}
          onClick={() => {
            setTitle('')
            void commit(null)
          }}
        >
          Reset to business name
        </button>
      )}
      {error && <p className="dash-login__error">{error}</p>}
    </div>
  )
}

function fileToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [, base64] = result.split(',')
      resolve({ base64, contentType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const STATUS_LABEL: Record<SalesOrder['status'], string> = {
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  reversed: 'Reversed',
}

export function InvoiceModal({
  order,
  businessProfile,
  onClose,
  onChanged,
}: {
  order: SalesOrder
  businessProfile: BusinessProfile | null
  onClose: () => void
  onChanged: (order: SalesOrder) => void
}) {
  const router = useRouter()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [marking, setMarking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const displayItems = order.invoice_items && order.invoice_items.length > 0 ? order.invoice_items : itemizedDefault(order)
  const displaySubtotal = displayItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const displayTotal = Math.max(0, displaySubtotal - order.discount)

  const handleProofUpload = async (file: File) => {
    setUploadingProof(true)
    setError('')
    try {
      const { base64, contentType } = await fileToBase64(file)
      const updated = await uploadPaymentProofFn({ data: { saleId: order.id, filename: file.name, contentType, base64 } })
      onChanged(updated)
      await router.invalidate()
    } catch {
      setError('Could not upload payment receipt.')
    } finally {
      setUploadingProof(false)
    }
  }

  const markPaid = async () => {
    setMarking(true)
    setError('')
    try {
      const updated = await markSalePaidFn({ data: { id: order.id } })
      onChanged(updated)
      await router.invalidate()
    } catch {
      setError('Could not update payment status.')
    } finally {
      setMarking(false)
    }
  }

  const downloadPng = async () => {
    if (!invoiceRef.current) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(invoiceRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const link = document.createElement('a')
      link.download = `${order.order_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      setError('Could not generate PNG.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--invoice" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <div>
            <h2>Order Form / Invoice</h2>
            <span className={`dash-badge dash-badge--sale-${order.status}`}>Status: {STATUS_LABEL[order.status]}</span>
          </div>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body dash-invoice-layout">
          <div className="dash-invoice-preview" ref={invoiceRef}>
            <div className="dash-invoice-preview__head">
              <h3>{order.invoice_title || businessProfile?.business_name || 'Invoice'}</h3>
              <div className="dash-invoice-preview__meta">
                <b>INVOICE</b>
                <span>{order.order_number}</span>
              </div>
            </div>
            <div className="dash-invoice-preview__info">
              <div><span className="dash-muted">Invoice Date</span><br />{new Date(order.created_at).toLocaleString('en-PH')}</div>
              <div><span className="dash-muted">Customer</span><br />{order.customer_name || 'Walk-in'}</div>
              <div><span className="dash-muted">Payment Method</span><br />{order.payment_method}</div>
              <div><span className="dash-muted">Payment Terms</span><br />Payment first before fulfillment</div>
              {order.courier && <div><span className="dash-muted">Courier</span><br />{order.courier}</div>}
            </div>
            <table className="dash-invoice-preview__table">
              <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
              <tbody>
                {displayItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.label}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPeso(item.unit_price)}</td>
                    <td>{formatPeso(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="dash-invoice-preview__totals">
              <div><span>Subtotal (Products)</span><span>{formatPeso(displaySubtotal)}</span></div>
              <div>
                <span>Shipping Fee{order.courier ? ` (${order.courier})` : ''}</span>
                <span>
                  {order.courier === 'Lalamove'
                    ? 'Pay courier directly'
                    : order.shipping_fee <= 0
                      ? 'FREE'
                      : order.shipping_paid_by === 'customer'
                        ? `${formatPeso(order.shipping_fee)} — pay courier directly`
                        : 'FREE (shipping on us)'}
                </span>
              </div>
              {order.discount > 0 && <div><span>Discount</span><span>-{formatPeso(order.discount)}</span></div>}
              <div className="dash-invoice-preview__due"><span>TOTAL AMOUNT DUE</span><span>{formatPeso(displayTotal)}</span></div>
            </div>
            <p className="dash-invoice-preview__note">Thank you for your order. Please send your payment receipt to complete confirmation.</p>
          </div>

          <div className="dash-invoice-side">
            <button className="button button--outline button--wide" onClick={downloadPng} disabled={downloading}>
              <Download size={14} /> {downloading ? 'Generating…' : 'Download Invoice (PNG)'}
            </button>

            <InvoiceItemsEditor order={order} onSaved={onChanged} />

            <InvoiceTitleEditor order={order} defaultTitle={businessProfile?.business_name ?? 'Invoice'} onSaved={onChanged} />

            {order.status !== 'reversed' && (
              <div className="dash-field">
                <span>Payment Proof</span>
                {order.receipt_url && <img src={order.receipt_url} alt="proof" className="dash-invoice-side__banner-preview" />}
                <label className="button button--outline button--wide" style={{ cursor: 'pointer' }}>
                  <ImageIcon size={14} /> {uploadingProof ? 'Uploading…' : 'Upload Payment Receipt'}
                  <input type="file" accept="image/*" hidden disabled={uploadingProof}
                    onChange={(e) => e.target.files?.[0] && handleProofUpload(e.target.files[0])} />
                </label>
              </div>
            )}

            {error && <p className="dash-login__error">{error}</p>}

            {order.status === 'awaiting_payment' && (
              <button className="button button--dark button--wide" onClick={markPaid} disabled={marking}>
                {marking ? 'Saving…' : 'Mark as Paid'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
