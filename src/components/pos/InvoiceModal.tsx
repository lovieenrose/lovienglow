import { Download, Image as ImageIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { markSalePaidFn, uploadInvoiceBannerFn, uploadPaymentProofFn } from '@/lib/serverFunctions'
import type { BusinessProfile, SalesOrder } from '@/lib/inventory/types'
import { formatPeso } from '@/routes/dashboard/pos'

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
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [marking, setMarking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

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

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true)
    setError('')
    try {
      const { base64, contentType } = await fileToBase64(file)
      await uploadInvoiceBannerFn({ data: { filename: file.name, contentType, base64 } })
      await router.invalidate()
    } catch {
      setError('Could not upload banner.')
    } finally {
      setUploadingBanner(false)
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
            {businessProfile?.invoice_banner_url && (
              <img src={businessProfile.invoice_banner_url} alt="" className="dash-invoice-preview__banner" />
            )}
            <div className="dash-invoice-preview__head">
              <h3>{businessProfile?.business_name ?? 'Invoice'}</h3>
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
            </div>
            <table className="dash-invoice-preview__table">
              <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPeso(item.unit_price)}</td>
                    <td>{formatPeso(item.line_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="dash-invoice-preview__totals">
              <div><span>Subtotal (Products)</span><span>{formatPeso(order.subtotal)}</span></div>
              <div><span>Shipping Fee</span><span>{order.shipping_fee > 0 ? formatPeso(order.shipping_fee) : 'FREE'}</span></div>
              {order.discount > 0 && <div><span>Discount</span><span>-{formatPeso(order.discount)}</span></div>}
              <div className="dash-invoice-preview__due"><span>TOTAL AMOUNT DUE</span><span>{formatPeso(order.total)}</span></div>
            </div>
            <p className="dash-invoice-preview__note">Thank you for your order. Please send your payment receipt to complete confirmation.</p>
          </div>

          <div className="dash-invoice-side">
            <button className="button button--outline button--wide" onClick={downloadPng} disabled={downloading}>
              <Download size={14} /> {downloading ? 'Generating…' : 'Download Invoice (PNG)'}
            </button>

            <div className="dash-field">
              <span>Invoice Banner</span>
              {businessProfile?.invoice_banner_url && (
                <img src={businessProfile.invoice_banner_url} alt="" className="dash-invoice-side__banner-preview" />
              )}
              <label className="button button--outline button--wide" style={{ cursor: 'pointer' }}>
                <ImageIcon size={14} /> {uploadingBanner ? 'Uploading…' : 'Replace Banner'}
                <input type="file" accept="image/*" hidden disabled={uploadingBanner}
                  onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} />
              </label>
            </div>

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
