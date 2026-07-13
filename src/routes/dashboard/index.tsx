import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Clock, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDashboardMetricsFn } from '@/lib/serverFunctions'
import type { DashboardMetrics, DateRangeKey } from '@/lib/inventory/types'

export const Route = createFileRoute('/dashboard/')({
  loader: () => getDashboardMetricsFn({ data: { range: '30d' } }),
  component: DashboardHome,
})

const RANGES: Array<{ key: DateRangeKey; label: string }> = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '12m', label: '12 Months' },
]

const DONUT_COLORS = ['#c8546f', '#e5a3b3', '#8a3b52', '#f0c9d2', '#a06a10', '#6a3d9e', '#2a5f9e']

function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

function DashboardHome() {
  const initial = Route.useLoaderData()
  const [range, setRange] = useState<DateRangeKey>('30d')
  const [data, setData] = useState<DashboardMetrics>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDashboardMetricsFn({ data: { range } }).then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [range])

  const cards = [
    { label: 'Total Revenue', value: formatPeso(data.totalRevenue), icon: Wallet },
    { label: 'Total COGS', value: formatPeso(data.totalCogs), icon: Wallet },
    { label: 'Gross Profit', value: formatPeso(data.grossProfit), icon: TrendingUp },
    { label: 'Total Expenses', value: formatPeso(data.totalExpenses), icon: TrendingDown },
    { label: 'Net Profit', value: formatPeso(data.netProfit), icon: data.netProfit >= 0 ? TrendingUp : TrendingDown },
    { label: 'Inventory Value', value: formatPeso(data.inventoryValue), icon: Wallet },
    { label: 'Total Orders', value: String(data.totalOrders), icon: Clock },
    { label: 'Pending Deliveries', value: String(data.pendingDeliveries), icon: Clock },
  ]

  const maxTrend = Math.max(1, ...data.salesTrend.map((d) => d.revenue))
  const totalExpense = data.expenseBreakdown.reduce((sum, e) => sum + e.amount, 0) || 1
  let cumulative = 0
  const donutStops = data.expenseBreakdown.map((entry, i) => {
    const start = (cumulative / totalExpense) * 360
    cumulative += entry.amount
    const end = (cumulative / totalExpense) * 360
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}deg ${end}deg`
  })

  return (
    <div className="dash-page" style={{ opacity: loading ? 0.7 : 1 }}>
      <div className="dash-toolbar">
        <h1 className="dash-page__title">Dashboard</h1>
        <div className="dash-range-tabs">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`dash-range-tab ${range === r.key ? 'is-active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

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
            <span className="dash-card__label">Low Stock Alerts</span>
            <b className="dash-card__value">{data.lowStock.count}</b>
          </div>
        </div>
      </div>

      <div className="dash-chart-grid">
        <div className="dash-chart-panel">
          <h2>Sales Trend</h2>
          {data.salesTrend.length === 0 ? (
            <p className="dash-empty-state">No sales in this range.</p>
          ) : (
            <>
              <div className="dash-bar-chart">
                {data.salesTrend.map((d) => (
                  <div className="dash-bar-chart__col" key={d.date}>
                    <div
                      className="dash-bar-chart__bar dash-bar-chart__bar--profit"
                      style={{ height: `${Math.max(2, (Math.max(0, d.profit) / maxTrend) * 100)}%` }}
                      title={`Profit: ${formatPeso(d.profit)}`}
                    />
                    <div
                      className="dash-bar-chart__bar"
                      style={{ height: `${Math.max(2, (d.revenue / maxTrend) * 100)}%` }}
                      title={`Revenue: ${formatPeso(d.revenue)}`}
                    />
                    <span className="dash-bar-chart__label">
                      {new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="dash-bar-chart__legend">
                <span><i className="dash-bar-chart__swatch" style={{ background: 'var(--pink)' }} /> Revenue</span>
                <span><i className="dash-bar-chart__swatch" style={{ background: 'var(--deep-pink)' }} /> Profit</span>
              </div>
            </>
          )}
        </div>

        <div className="dash-chart-panel">
          <h2>Top Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="dash-empty-state">No sales yet.</p>
          ) : (
            <div className="dash-top-products">
              {data.topProducts.map((p, i) => (
                <div className="dash-top-product" key={p.productId ?? p.name}>
                  <span className="dash-top-product__rank">{i + 1}</span>
                  <span className="dash-top-product__name">{p.name}</span>
                  <span className="dash-top-product__meta">{p.unitsSold} sold · {formatPeso(p.profit)} profit</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-chart-grid">
        <div className="dash-chart-panel">
          <h2>Expense Breakdown</h2>
          {data.expenseBreakdown.length === 0 ? (
            <p className="dash-empty-state">No expenses recorded in this range.</p>
          ) : (
            <div className="dash-donut">
              <div className="dash-donut__ring" style={{ background: `conic-gradient(${donutStops.join(', ')})` }} />
              <ul className="dash-donut__legend">
                {data.expenseBreakdown.map((entry, i) => (
                  <li key={entry.category}>
                    <span className="dash-donut__legend-label">
                      <i className="dash-donut__swatch" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {entry.category}
                    </span>
                    <span>{formatPeso(entry.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="dash-chart-panel">
          <h2>Low Stock Items</h2>
          {data.lowStock.items.length === 0 ? (
            <p className="dash-empty-state">Everything is well stocked.</p>
          ) : (
            <div className="dash-table-wrap" style={{ border: 'none' }}>
              <table className="dash-table">
                <thead>
                  <tr><th>Product</th><th>Stock</th><th>Reorder Level</th></tr>
                </thead>
                <tbody>
                  {data.lowStock.items.map((item) => (
                    <tr key={item.id} className="dash-row-warn">
                      <td>{item.name}</td>
                      <td>{item.stock_quantity}</td>
                      <td>{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
