import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { getInventoryFn, updateInventoryFn } from '@/lib/serverFunctions'
import type { InventoryRow } from '@/lib/orders'

export const Route = createFileRoute('/dashboard/inventory')({
  loader: () => getInventoryFn(),
  component: InventoryPage,
})

function stockStatus(row: InventoryRow): { label: string; className: string } {
  if (row.stock === 0) return { label: 'Out of Stock', className: 'dash-badge--rejected' }
  if (row.stock <= row.low_stock_threshold) return { label: 'Low Stock', className: 'dash-badge--pending' }
  return { label: 'In Stock', className: 'dash-badge--confirmed' }
}

function InventoryRowItem({ row }: { row: InventoryRow }) {
  const router = useRouter()
  const [stock, setStock] = useState(row.stock)
  const [threshold, setThreshold] = useState(row.low_stock_threshold)
  const [saving, setSaving] = useState(false)
  const status = stockStatus({ ...row, stock, low_stock_threshold: threshold })
  const dirty = stock !== row.stock || threshold !== row.low_stock_threshold
  const percent = Math.min(100, Math.round((stock / Math.max(1, threshold * 4)) * 100))

  const save = async () => {
    setSaving(true)
    await updateInventoryFn({ data: { productId: row.product_id, stock, lowStockThreshold: threshold } })
    await router.invalidate()
    setSaving(false)
  }

  return (
    <tr>
      <td>{row.product_name}</td>
      <td>
        <input
          type="number"
          className="dash-inline-input"
          value={stock}
          min={0}
          onChange={(event) => setStock(Number(event.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          className="dash-inline-input"
          value={threshold}
          min={0}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />
      </td>
      <td><span className={`dash-badge ${status.className}`}>{status.label}</span></td>
      <td>
        <div className="dash-stock-bar">
          <div className="dash-stock-bar__fill" style={{ width: `${percent}%` }} />
        </div>
      </td>
      <td>
        <button className="button button--outline" onClick={save} disabled={!dirty || saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

function InventoryPage() {
  const rows = Route.useLoaderData()

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Inventory</h1>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
              <th>Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => <InventoryRowItem row={row} key={row.product_id} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
