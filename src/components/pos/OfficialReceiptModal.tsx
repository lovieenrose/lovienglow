import { Download, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { BusinessProfile, SalesOrder } from '@/lib/inventory/types'
import { formatPeso } from '@/routes/dashboard/pos'

// A downloadable Official Receipt (OR) — proof of payment received, issued
// only once a sale is actually `paid`. Deliberately separate from the
// Invoice ("Order Form"): the invoice is what's owed before payment; this
// is what was actually received, with its own OR-000001 sequence assigned
// server-side the first time the sale reaches `paid` (see mark_sale_paid).
export function OfficialReceiptModal({
  order,
  businessProfile,
  onClose,
}: {
  order: SalesOrder
  businessProfile: BusinessProfile | null
  onClose: () => void
}) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const downloadPng = async () => {
    if (!receiptRef.current) return
    setDownloading(true)
    setError('')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const link = document.createElement('a')
      link.download = `${order.receipt_number ?? order.order_number}.png`
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
          <h2>Official Receipt</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body dash-invoice-layout">
          <div className="dash-invoice-preview" ref={receiptRef}>
            <div className="dash-invoice-preview__head">
              <h3>{businessProfile?.business_name || 'Official Receipt'}</h3>
              <div className="dash-invoice-preview__meta">
                <b>OFFICIAL RECEIPT</b>
                <span>{order.receipt_number ?? '—'}</span>
              </div>
            </div>
            <div className="dash-invoice-preview__info">
              <div>
                <span className="dash-muted">Date Paid</span><br />
                {order.paid_at ? new Date(order.paid_at).toLocaleString('en-PH') : '—'}
              </div>
              <div><span className="dash-muted">Received From</span><br />{order.customer_name || 'Walk-in'}</div>
              <div><span className="dash-muted">Payment Method</span><br />{order.payment_method}</div>
              <div><span className="dash-muted">Order Reference</span><br />{order.order_number}</div>
            </div>
            <div className="dash-receipt-amount">
              <span>Amount Received</span>
              <b>{formatPeso(order.total)}</b>
            </div>
            <p className="dash-invoice-preview__note">
              Payment received in full for Order {order.order_number}. Thank you for your business!
            </p>
          </div>

          <div className="dash-invoice-side">
            <button className="button button--outline button--wide" onClick={downloadPng} disabled={downloading}>
              <Download size={14} /> {downloading ? 'Generating…' : 'Download Official Receipt (PNG)'}
            </button>
            {error && <p className="dash-login__error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
