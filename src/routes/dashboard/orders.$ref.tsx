import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Check, Copy, Download, Maximize2, RotateCcw, XCircle, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/currency'
import paymentMethods from '@/data/paymentMethods'
import { shippingRegions } from '@/data/shipping'
import { getOrderFn, resendOrderEmailFn, updateOrderStatusFn } from '@/lib/serverFunctions'
import { orderStatusBadgeClass, orderStatusLabels, orderStatusSteps } from '@/lib/statusLabels'
import type { OrderStatus } from '@/lib/orders'

type EmailType = 'order_received' | 'payment_confirmed' | 'packed' | 'shipped' | 'delivered' | 'admin_notification'
const RETRYABLE_EMAIL_TYPES = new Set<string>(['order_received', 'payment_confirmed', 'packed', 'shipped', 'delivered', 'admin_notification'])

const STEP_ACTION_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  processing: 'Confirm Payment',
  shipped: 'Mark as Shipped',
  delivered: 'Mark as Delivered',
  cancelled: 'Cancelled',
}

export const Route = createFileRoute('/dashboard/orders/$ref')({
  loader: async ({ params }) => {
    const order = await getOrderFn({ data: { reference: params.ref } })
    if (!order) throw notFound()
    return order
  },
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const order = Route.useLoaderData()
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [internalNotes, setInternalNotes] = useState(order.internal_notes)
  const [savingTracking, setSavingTracking] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [retrying, setRetrying] = useState<EmailType | null>(null)
  const [copied, setCopied] = useState(false)

  const method = paymentMethods.find((item) => item.id === order.payment_method)
  const region = shippingRegions.find((item) => item.id === order.region)
  const isPdf = order.receipt_filename?.toLowerCase().endsWith('.pdf')

  const currentStepIndex = orderStatusSteps.indexOf(order.order_status)
  const nextStep = order.order_status === 'cancelled' ? null : orderStatusSteps[currentStepIndex + 1]

  const advanceTo = async (status: OrderStatus) => {
    setAdvancing(true)
    await updateOrderStatusFn({ data: { reference: order.reference, orderStatus: status, trackingNumber: status === 'shipped' ? trackingNumber : undefined } })
    await router.invalidate()
    setAdvancing(false)
  }

  const cancelOrder = async () => {
    if (!confirm('Cancel this order? This cannot be undone from here.')) return
    setCancelling(true)
    await updateOrderStatusFn({ data: { reference: order.reference, orderStatus: 'cancelled' } })
    await router.invalidate()
    setCancelling(false)
  }

  const saveNotes = async () => {
    if (internalNotes === order.internal_notes) return
    await updateOrderStatusFn({ data: { reference: order.reference, internalNotes } })
    await router.invalidate()
  }

  const saveTrackingNumber = async () => {
    setSavingTracking(true)
    await updateOrderStatusFn({ data: { reference: order.reference, trackingNumber } })
    await router.invalidate()
    setSavingTracking(false)
  }

  const retryEmail = async (emailType: EmailType) => {
    setRetrying(emailType)
    await resendOrderEmailFn({ data: { reference: order.reference, emailType } })
    await router.invalidate()
    setRetrying(null)
  }

  const copyTrackingCode = async () => {
    await navigator.clipboard.writeText(order.tracking_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="dash-page">
      <Link to="/dashboard/orders" className="dash-back-link">
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="dash-detail-header">
        <div>
          <h1 className="dash-page__title">{order.reference}</h1>
          <span className="dash-detail-header__date">
            {new Date(order.placed_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          <div className="dash-tracking-code">
            <span className="dash-muted">Tracking Code:</span> <b>{order.tracking_code}</b>
            <button className="dash-icon-btn" title="Copy tracking code" onClick={copyTrackingCode}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        <div className="dash-detail-header__badges">
          <span className={`dash-badge ${orderStatusBadgeClass[order.order_status]}`}>{orderStatusLabels[order.order_status]}</span>
        </div>
      </div>

      <div className="dash-status-stepper">
        {orderStatusSteps.map((step, i) => (
          <div key={step} className={`dash-status-step ${i <= currentStepIndex ? 'is-done' : ''} ${i === currentStepIndex ? 'is-current' : ''}`}>
            <span className="dash-status-step__dot" />
            <span className="dash-status-step__label">{orderStatusLabels[step]}</span>
          </div>
        ))}
      </div>

      {order.order_status !== 'cancelled' && (
        <div className="dash-toolbar" style={{ marginTop: 0 }}>
          <div />
          <div className="dash-toolbar__actions">
            {nextStep && (
              <button className="button button--dark" onClick={() => advanceTo(nextStep)} disabled={advancing}>
                {advancing ? 'Saving…' : STEP_ACTION_LABEL[nextStep]}
              </button>
            )}
            <button className="dash-link-btn dash-link-btn--danger" onClick={cancelOrder} disabled={cancelling}>
              <XCircle size={14} /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          </div>
        </div>
      )}

      <div className="dash-detail-grid">
        <section className="dash-panel">
          <h2>Customer Info</h2>
          <dl>
            <div><dt>Full Name</dt><dd>{order.full_name}</dd></div>
            <div><dt>Contact Number</dt><dd>{order.contact_number}</dd></div>
            <div><dt>Email</dt><dd>{order.email || '—'}</dd></div>
            <div><dt>Social Handle</dt><dd>{order.social_handle || '—'}</dd></div>
          </dl>
        </section>

        <section className="dash-panel">
          <h2>Delivery</h2>
          <dl>
            <div><dt>Address</dt><dd>{order.address}</dd></div>
            <div><dt>Courier</dt><dd>{order.courier === 'lalamove' ? 'Lalamove' : 'J&T Express'}</dd></div>
            <div><dt>Region</dt><dd>{region?.label ?? '—'}</dd></div>
          </dl>
          <label>
            <span>Courier Tracking Number (optional)</span>
            <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Optional" />
          </label>
          <button className="button button--outline" onClick={saveTrackingNumber} disabled={savingTracking}>
            {savingTracking ? 'Saving…' : 'Save Tracking Number'}
          </button>
        </section>

        <section className="dash-panel">
          <h2>Receipt</h2>
          {order.receipt_url ? (
            isPdf ? (
              <a className="button button--outline" href={order.receipt_url} target="_blank" rel="noreferrer" download>
                <Download size={14} /> Download PDF Receipt
              </a>
            ) : (
              <div className="dash-receipt">
                <img src={order.receipt_url} alt="Payment receipt" onClick={() => setLightboxOpen(true)} />
                <div className="dash-receipt__actions">
                  <button className="button button--outline" onClick={() => setLightboxOpen(true)}>
                    <Maximize2 size={13} /> Zoom
                  </button>
                  <a className="button button--outline" href={order.receipt_url} target="_blank" rel="noreferrer" download>
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            )
          ) : (
            <p className="dash-muted">No receipt on file.</p>
          )}
        </section>

        <section className="dash-panel dash-panel--wide">
          <h2>Order Items</h2>
          <table className="dash-table">
            <thead>
              <tr><th>Product</th><th>Unit Price</th><th>Qty</th><th>Line Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dash-financials">
            <div><span>Subtotal</span><b>{formatPrice(order.subtotal)}</b></div>
            <div><span>Shipping Fee</span><b>{formatPrice(order.shipping_fee)}</b></div>
            <div className="dash-financials__total"><span>Total</span><b>{formatPrice(order.total)}</b></div>
          </div>
        </section>

        <section className="dash-panel">
          <h2>Payment</h2>
          <p className="dash-muted">Method: {method?.label ?? order.payment_method}</p>
        </section>

        <section className="dash-panel dash-panel--wide">
          <h2>Internal Notes</h2>
          <textarea
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            onBlur={saveNotes}
            rows={3}
            placeholder="Notes visible only to the admin team…"
          />
        </section>

        <section className="dash-panel">
          <h2>Status History</h2>
          {order.history.length === 0 ? (
            <p className="dash-muted">No status changes yet.</p>
          ) : (
            <ul className="dash-timeline">
              {order.history.map((entry) => (
                <li key={entry.id}>
                  <span className="dash-timeline__time">
                    {new Date(entry.changed_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span>
                    {orderStatusLabels[(entry.old_value as OrderStatus) ?? 'pending_payment'] ?? entry.old_value ?? '—'} → {orderStatusLabels[entry.new_value as OrderStatus] ?? entry.new_value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-panel">
          <h2>Email History</h2>
          {order.emails.length === 0 ? (
            <p className="dash-muted">No emails sent yet.</p>
          ) : (
            <ul className="dash-timeline">
              {order.emails.map((entry) => (
                <li key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    <span className="dash-timeline__time" style={{ display: 'block' }}>
                      {new Date(entry.sent_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {entry.email_type} → {entry.sent_to}{' '}
                    {entry.success ? '' : <span style={{ color: '#a03030', fontWeight: 600 }}>(failed)</span>}
                  </span>
                  {!entry.success && RETRYABLE_EMAIL_TYPES.has(entry.email_type) && (
                    <button
                      className="button button--outline"
                      onClick={() => retryEmail(entry.email_type as EmailType)}
                      disabled={retrying !== null}
                    >
                      <RotateCcw size={12} /> {retrying === entry.email_type ? 'Retrying…' : 'Retry'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {lightboxOpen && order.receipt_url && (
        <div className="dash-lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="dash-lightbox__close" onClick={() => setLightboxOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
          <img src={order.receipt_url} alt="Payment receipt full size" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
