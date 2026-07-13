import { Link, Outlet, createFileRoute, useMatches, useNavigate } from '@tanstack/react-router'
import { Copy, Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatPrice } from '@/data/products'
import { couriers } from '@/data/shipping'
import { exportOrdersCsvFn, getOrdersFn } from '@/lib/serverFunctions'
import { orderStatusBadgeClass, orderStatusLabels } from '@/lib/statusLabels'
import type { OrderStatus } from '@/lib/orders'

interface OrdersSearch {
  search?: string
  orderStatus?: string
  courier?: string
  page?: number
}

export const Route = createFileRoute('/dashboard/orders')({
  validateSearch: (search: Record<string, unknown>): OrdersSearch => ({
    search: typeof search.search === 'string' ? search.search : '',
    orderStatus: typeof search.orderStatus === 'string' ? search.orderStatus : '',
    courier: typeof search.courier === 'string' ? search.courier : '',
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getOrdersFn({
      data: {
        search: deps.search || undefined,
        orderStatus: deps.orderStatus || undefined,
        courier: deps.courier || undefined,
        page: deps.page,
        pageSize: 25,
      },
    }),
  component: OrdersPage,
})

type SortKey = 'created_at' | 'total' | 'reference'

const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled']

function OrdersPage() {
  const matches = useMatches()
  const hasChildRoute = matches.some((m) => m.routeId === '/dashboard/orders/$ref')
  if (hasChildRoute) return <Outlet />
  return <OrdersListView />
}

function OrdersListView() {
  const search = Route.useSearch()
  const page = search.page ?? 1
  const navigate = useNavigate({ from: Route.fullPath })
  const data = Route.useLoaderData()
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  const sortedOrders = useMemo(() => {
    const rows = [...data.orders]
    rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'total') return (a.total - b.total) * dir
      if (sortKey === 'reference') return a.reference.localeCompare(b.reference) * dir
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
    })
    return rows
  }, [data.orders, sortKey, sortDir])

  const updateSearch = (patch: Partial<OrdersSearch>) => {
    navigate({ search: (prev: OrdersSearch) => ({ ...prev, ...patch, page: patch.page ?? 1 }) })
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const copyTrackingCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedRef(code)
    setTimeout(() => setCopiedRef(null), 1500)
  }

  const handleExport = async () => {
    const csv = await exportOrdersCsvFn({
      data: {
        search: search.search || undefined,
        orderStatus: search.orderStatus || undefined,
        courier: search.courier || undefined,
      },
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lovienglow-orders-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div className="dash-page">
      <div className="dash-page__header">
        <h1 className="dash-page__title">Orders</h1>
        <button className="button button--outline dash-export-btn" onClick={handleExport}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="dash-filters">
        <div className="dash-search-field">
          <Search size={14} />
          <input
            placeholder="Search reference, tracking code, name, phone, email…"
            defaultValue={search.search ?? ''}
            onChange={(event) => updateSearch({ search: event.target.value })}
          />
        </div>
        <select value={search.orderStatus ?? ''} onChange={(event) => updateSearch({ orderStatus: event.target.value })}>
          <option value="">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{orderStatusLabels[status]}</option>
          ))}
        </select>
        <select value={search.courier ?? ''} onChange={(event) => updateSearch({ courier: event.target.value })}>
          <option value="">All Couriers</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>{courier.label}</option>
          ))}
        </select>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th className="is-sortable" onClick={() => toggleSort('reference')}>Reference</th>
              <th>Tracking Code</th>
              <th>Customer</th>
              <th className="is-sortable" onClick={() => toggleSort('total')}>Total</th>
              <th>Status</th>
              <th>Courier</th>
              <th className="is-sortable" onClick={() => toggleSort('created_at')}>Placed</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length === 0 && (
              <tr><td colSpan={7} className="dash-table__empty">No orders match your filters.</td></tr>
            )}
            {sortedOrders.map((order) => (
              <tr key={order.id}>
                <td><Link to="/dashboard/orders/$ref" params={{ ref: order.reference }}>{order.reference}</Link></td>
                <td>
                  <span className="dash-tracking-code-cell">
                    {order.tracking_code}
                    <button className="dash-icon-btn" title="Copy tracking code" onClick={() => copyTrackingCode(order.tracking_code)}>
                      <Copy size={12} />
                    </button>
                    {copiedRef === order.tracking_code && <span className="dash-copied-hint">Copied</span>}
                  </span>
                </td>
                <td>{order.full_name}</td>
                <td>{formatPrice(order.total)}</td>
                <td><span className={`dash-badge ${orderStatusBadgeClass[order.order_status]}`}>{orderStatusLabels[order.order_status]}</span></td>
                <td>{order.courier === 'lalamove' ? 'Lalamove' : 'J&T Express'}</td>
                <td>{new Date(order.placed_at).toLocaleDateString('en-PH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-pagination">
        <button
          className="button button--outline"
          disabled={page <= 1}
          onClick={() => updateSearch({ page: page - 1 })}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          className="button button--outline"
          disabled={page >= totalPages}
          onClick={() => updateSearch({ page: page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  )
}
