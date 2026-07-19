import { X } from 'lucide-react'
import type { SalesOrder } from '@/lib/inventory/types'
import { formatPeso } from '@/routes/dashboard/pos'

export function SaleDetailsModal({ order, onClose }: { order: SalesOrder; onClose: () => void }) {
  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal dash-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal__header">
          <h2>Order {order.order_number}</h2>
          <button type="button" className="dash-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-modal__body">
          <div className="dash-form-grid">
            <div><span className="dash-muted">Status</span><br /><span className={`dash-badge dash-badge--sale-${order.status}`}>{order.status.replace('_', ' ')}</span></div>
            <div><span className="dash-muted">Customer</span><br />{order.customer_name || 'Walk-in'}</div>
            <div><span className="dash-muted">Payment Method</span><br />{order.payment_method}</div>
            <div><span className="dash-muted">Date</span><br />{new Date(order.created_at).toLocaleString('en-PH')}</div>
            <div><span className="dash-muted">Courier</span><br />{order.courier || '—'}</div>
            <div>
              <span className="dash-muted">Shipping Fee</span><br />
              {order.shipping_fee > 0
                ? `${formatPeso(order.shipping_fee)} (${order.shipping_paid_by === 'customer' ? 'customer pays' : 'shouldered by you'})`
                : 'None'}
            </div>
          </div>

          <div className="dash-table-wrap" style={{ border: 'none' }}>
            <table className="dash-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Unit Price</th><th>Line Profit</th></tr></thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPeso(item.unit_cost)}</td>
                    <td>{formatPeso(item.unit_price)}</td>
                    <td>{formatPeso(item.line_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-financials">
            <div><span>Subtotal</span><span>{formatPeso(order.subtotal)}</span></div>
            <div><span>Discount</span><span>-{formatPeso(order.discount)}</span></div>
            <div><span>Total Cost (COGS)</span><span>{formatPeso(order.total_cost)}</span></div>
            <div><span>Gross Profit</span><span>{formatPeso(order.gross_profit)}</span></div>
            <div><span>Margin</span><span>{order.margin_pct.toFixed(2)}%</span></div>
            <div className="dash-financials__total"><span>Total</span><span>{formatPeso(order.total)}</span></div>
          </div>

          {order.receipt_url && (
            <div className="dash-field">
              <span>Payment Proof</span>
              <img src={order.receipt_url} alt="proof" className="dash-invoice-side__banner-preview" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
