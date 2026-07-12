import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Clock, PackageCheck, TrendingUp, Wallet } from 'lucide-react'
import { formatPrice } from '@/data/products'
import { getDashboardAnalyticsFn } from '@/lib/serverFunctions'
import { fulfillmentLabels, paymentLabels } from '@/lib/statusLabels'

export const Route = createFileRoute('/dashboard/')({
  loader: () => getDashboardAnalyticsFn(),
  component: DashboardHome,
})

function DashboardHome() {
  const data = Route.useLoaderData()

  const cards = [
    { label: "Today's Orders", value: data.todayOrders, icon: TrendingUp },
    { label: "Today's Revenue", value: formatPrice(data.todayRevenue), icon: Wallet },
    { label: 'Pending Payments', value: data.pendingPayments, icon: Clock },
    { label: 'Pending Fulfillments', value: data.pendingFulfillments, icon: PackageCheck },
  ]

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Dashboard</h1>

      <div className="dash-cards">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div className="dash-card" key={card.label}>
              <div className="dash-card__icon"><Icon size={18} /></div>
              <div>
                <span className="dash-card__label">{card.label}</span>
                <b className="dash-card__value">{card.value}</b>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dash-cards dash-cards--secondary">
        <div className="dash-card dash-card--warn">
          <div className="dash-card__icon"><AlertTriangle size={18} /></div>
          <div>
            <span className="dash-card__label">Low Stock Items</span>
            <b className="dash-card__value">{data.lowStockCount}</b>
          </div>
        </div>
        <div className="dash-card dash-card--danger">
          <div className="dash-card__icon"><AlertTriangle size={18} /></div>
          <div>
            <span className="dash-card__label">Out of Stock Items</span>
            <b className="dash-card__value">{data.outOfStockCount}</b>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card__icon"><TrendingUp size={18} /></div>
          <div>
            <span className="dash-card__label">Top Selling Product</span>
            <b className="dash-card__value">
              {data.topProduct ? `${data.topProduct.name} (${data.topProduct.units} units)` : '—'}
            </b>
          </div>
        </div>
      </div>

      <h2 className="dash-section-title">Recent Orders</h2>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.length === 0 && (
              <tr><td colSpan={6} className="dash-table__empty">No orders yet.</td></tr>
            )}
            {data.recentOrders.map((order) => (
              <tr key={order.id}>
                <td><Link to="/dashboard/orders/$ref" params={{ ref: order.reference }}>{order.reference}</Link></td>
                <td>{order.full_name}</td>
                <td>{formatPrice(order.total)}</td>
                <td><span className={`dash-badge dash-badge--${order.payment_status}`}>{paymentLabels[order.payment_status]}</span></td>
                <td><span className={`dash-badge dash-badge--${order.fulfillment_status}`}>{fulfillmentLabels[order.fulfillment_status]}</span></td>
                <td>{new Date(order.placed_at).toLocaleDateString('en-PH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
