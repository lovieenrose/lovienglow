import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Circle, Loader2, PackageSearch, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/currency'
import { trackOrderFn } from '@/lib/serverFunctions'
import type { PublicTrackedOrder } from '@/lib/orders'
import { orderStatusBadgeClass, orderStatusLabels } from '@/lib/statusLabels'

interface TrackSearch {
  code?: string
}

export const Route = createFileRoute('/track')({
  validateSearch: (search: Record<string, unknown>): TrackSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Track Your Order — LovieNGlow' }],
  }),
  component: TrackPage,
})

const STATUS_DESCRIPTIONS: Record<PublicTrackedOrder['order_status'], string> = {
  pending_payment: "We're validating your payment. This usually takes up to 24 hours.",
  processing: 'Your payment is confirmed and your order is being prepared.',
  shipped: 'Your order has shipped and is on its way to you.',
  delivered: 'Your order has been delivered. We hope you love it!',
  cancelled: 'This order has been cancelled.',
}

interface Milestone {
  label: string
  done: boolean
  timestamp: string | null
}

function buildMilestones(order: PublicTrackedOrder): Milestone[] {
  const findTimestamp = (status: string) => order.history.find((h) => h.new_value === status)?.changed_at ?? null
  const reachedProcessing = order.order_status === 'processing' || order.order_status === 'shipped' || order.order_status === 'delivered'
  const reachedShipped = order.order_status === 'shipped' || order.order_status === 'delivered'
  const reachedDelivered = order.order_status === 'delivered'
  const processingAt = findTimestamp('processing')

  return [
    { label: 'Order Received', done: true, timestamp: order.created_at },
    { label: 'Payment Confirmed', done: reachedProcessing, timestamp: processingAt },
    { label: 'Processing', done: reachedProcessing, timestamp: processingAt },
    { label: 'Shipped', done: reachedShipped, timestamp: findTimestamp('shipped') },
    { label: 'Delivered', done: reachedDelivered, timestamp: findTimestamp('delivered') },
  ]
}

function TrackPage() {
  const { code } = Route.useSearch()
  const [input, setInput] = useState(code ?? '')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [order, setOrder] = useState<PublicTrackedOrder | null>(null)

  const runSearch = async (trackingCode: string) => {
    if (!trackingCode.trim()) return
    setLoading(true)
    setSearched(true)
    const result = await trackOrderFn({ data: { trackingCode: trackingCode.trim() } })
    setOrder(result)
    setLoading(false)
  }

  useEffect(() => {
    if (code) runSearch(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(input)
  }

  return (
    <div className="track-page">
      <div className="track-page__hero">
        <h1>Track Your Order</h1>
        <p>Enter the tracking code from your confirmation email — no account needed.</p>
        <form className="track-page__form" onSubmit={handleSubmit}>
          <div className="dash-search-field" style={{ background: '#fff' }}>
            <Search size={16} />
            <input
              placeholder="e.g. LNG-20260713-000123"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
            />
          </div>
          <button className="button button--dark" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="spin" size={14} /> Searching…</> : 'Track Order'}
          </button>
        </form>
      </div>

      {searched && !loading && !order && (
        <div className="track-page__empty">
          <PackageSearch size={28} />
          <p>We couldn't find an order with that tracking code. Please double-check and try again.</p>
        </div>
      )}

      {order && (
        <div className="track-page__result">
          <div className="track-page__summary">
            <div>
              <span className="track-page__label">Tracking Number</span>
              <b>{order.tracking_code}</b>
            </div>
            <div>
              <span className="track-page__label">Order Number</span>
              <b>{order.reference}</b>
            </div>
            <div>
              <span className="track-page__label">Last Updated</span>
              <b>{new Date(order.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</b>
            </div>
          </div>

          <div className="track-page__status">
            <span className={`dash-badge ${orderStatusBadgeClass[order.order_status]}`}>{orderStatusLabels[order.order_status]}</span>
            <p>{STATUS_DESCRIPTIONS[order.order_status]}</p>
          </div>

          {order.order_status !== 'cancelled' && (
            <ul className="track-page__timeline">
              {buildMilestones(order).map((m) => (
                <li key={m.label} className={m.done ? 'is-done' : ''}>
                  {m.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <span>{m.label}</span>
                  {m.timestamp && <span className="track-page__timeline-time">{new Date(m.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>}
                </li>
              ))}
            </ul>
          )}

          <h2 className="track-page__items-title">Ordered Items</h2>
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                  <td>{formatPrice(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
