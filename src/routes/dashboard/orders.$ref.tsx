import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Download, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/data/products'
import paymentMethods from '@/data/paymentMethods'
import { shippingRegions } from '@/data/shipping'
import { getOrderFn, updateOrderStatusFn } from '@/lib/serverFunctions'
import {
  fulfillmentLabels,
  fulfillmentStatusOptions,
  paymentLabels,
  paymentStatusOptions,
} from '@/lib/statusLabels'

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
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillment_status)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [internalNotes, setInternalNotes] = useState(order.internal_notes)
  const [savingPayment, setSavingPayment] = useState(false)
  const [savingFulfillment, setSavingFulfillment] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const method = paymentMethods.find((item) => item.id === order.payment_method)
  const region = shippingRegions.find((item) => item.id === order.region)
  const isPdf = order.receipt_filename?.toLowerCase().endsWith('.pdf')

  const savePayment = async () => {
    setSavingPayment(true)
    await updateOrderStatusFn({ data: { reference: order.reference, paymentStatus } })
    await router.invalidate()
    setSavingPayment(false)
  }

  const saveFulfillment = async () => {
    setSavingFulfillment(true)
    await updateOrderStatusFn({ data: { reference: order.reference, fulfillmentStatus, trackingNumber } })
    await router.invalidate()
    setSavingFulfillment(false)
  }

  const saveNotes = async () => {
    if (internalNotes === order.internal_notes) return
    await updateOrderStatusFn({ data: { reference: order.reference, internalNotes } })
    await router.invalidate()
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
        </div>
        <div className="dash-detail-header__badges">
          <span className={`dash-badge dash-badge--${order.payment_status}`}>{paymentLabels[order.payment_status]}</span>
          <span className={`dash-badge dash-badge--${order.fulfillment_status}`}>{fulfillmentLabels[order.fulfillment_status]}</span>
        </div>
      </div>

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
          <label>
            <span>Payment Status</span>
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}>
              {paymentStatusOptions.map((status) => (
                <option key={status} value={status}>{paymentLabels[status]}</option>
              ))}
            </select>
          </label>
          <button className="button button--dark" onClick={savePayment} disabled={savingPayment}>
            {savingPayment ? 'Saving…' : 'Save Payment Status'}
          </button>
        </section>

        <section className="dash-panel">
          <h2>Fulfillment</h2>
          <label>
            <span>Fulfillment Status</span>
            <select value={fulfillmentStatus} onChange={(event) => setFulfillmentStatus(event.target.value as typeof fulfillmentStatus)}>
              {fulfillmentStatusOptions.map((status) => (
                <option key={status} value={status}>{fulfillmentLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Tracking Number</span>
            <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Optional" />
          </label>
          <button className="button button--dark" onClick={saveFulfillment} disabled={savingFulfillment}>
            {savingFulfillment ? 'Saving…' : 'Save Fulfillment Status'}
          </button>
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
                    {entry.field === 'payment_status' ? 'Payment' : 'Fulfillment'}: {entry.old_value ?? '—'} → {entry.new_value}
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
                <li key={entry.id}>
                  <span className="dash-timeline__time">
                    {new Date(entry.sent_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span>{entry.email_type} → {entry.sent_to} {entry.success ? '' : '(failed)'}</span>
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
