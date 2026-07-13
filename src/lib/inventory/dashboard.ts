import type { OwnerContext } from '@/lib/auth'
import type { DashboardMetrics, DateRangeKey } from './types'

function rangeStart(range: DateRangeKey): Date {
  const now = new Date()
  const start = new Date(now)
  switch (range) {
    case '7d':
      start.setDate(now.getDate() - 6)
      break
    case '30d':
      start.setDate(now.getDate() - 29)
      break
    case '90d':
      start.setDate(now.getDate() - 89)
      break
    case '12m':
      start.setMonth(now.getMonth() - 11)
      break
  }
  start.setHours(0, 0, 0, 0)
  return start
}

export async function getDashboardMetrics(ctx: OwnerContext, range: DateRangeKey): Promise<DashboardMetrics> {
  const from = rangeStart(range).toISOString()

  const [salesRes, expensesRes, productsRes, poRes] = await Promise.all([
    ctx.supabase
      .from('sales_orders')
      .select('id, total, total_cost, gross_profit, created_at')
      .eq('owner_id', ctx.ownerId)
      .eq('status', 'paid')
      .gte('created_at', from),
    ctx.supabase
      .from('expenses')
      .select('amount, category, expense_date')
      .eq('owner_id', ctx.ownerId)
      .gte('expense_date', from),
    ctx.supabase
      .from('products')
      .select('id, name, stock_quantity, cost_price, reorder_level')
      .eq('owner_id', ctx.ownerId),
    ctx.supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ctx.ownerId)
      .in('status', ['pending', 'in_transit']),
  ])

  if (salesRes.error) throw salesRes.error
  if (expensesRes.error) throw expensesRes.error
  if (productsRes.error) throw productsRes.error
  if (poRes.error) throw poRes.error

  const sales = (salesRes.data as Array<{ id: string; total: number; total_cost: number; gross_profit: number; created_at: string }>) ?? []
  const expenses = (expensesRes.data as Array<{ amount: number; category: string; expense_date: string }>) ?? []
  const products = (productsRes.data as Array<{ id: string; name: string; stock_quantity: number; cost_price: number; reorder_level: number }>) ?? []

  let saleItems: Array<{ product_id: string | null; product_name: string; quantity: number; line_revenue: number; line_profit: number }> = []
  if (sales.length > 0) {
    const { data: itemRows, error: itemsError } = await ctx.supabase
      .from('sales_order_items')
      .select('product_id, product_name, quantity, line_revenue, line_profit')
      .eq('owner_id', ctx.ownerId)
      .in('sales_order_id', sales.map((s) => s.id))
    if (itemsError) throw itemsError
    saleItems = itemRows ?? []
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const totalCogs = sales.reduce((sum, s) => sum + Number(s.total_cost), 0)
  const grossProfit = sales.reduce((sum, s) => sum + Number(s.gross_profit), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netProfit = grossProfit - totalExpenses
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price), 0)

  const lowStockItems = products
    .filter((p) => p.stock_quantity <= p.reorder_level)
    .map((p) => ({ id: p.id, name: p.name, stock_quantity: p.stock_quantity, reorder_level: p.reorder_level }))

  const productAgg = new Map<string, { productId: string | null; name: string; unitsSold: number; revenue: number; profit: number }>()
  for (const item of saleItems) {
    const key = item.product_id ?? item.product_name
    const existing = productAgg.get(key) ?? { productId: item.product_id, name: item.product_name, unitsSold: 0, revenue: 0, profit: 0 }
    existing.unitsSold += Number(item.quantity)
    existing.revenue += Number(item.line_revenue)
    existing.profit += Number(item.line_profit)
    productAgg.set(key, existing)
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5)

  const trendMap = new Map<string, { revenue: number; profit: number; orders: number }>()
  for (const s of sales) {
    const day = s.created_at.slice(0, 10)
    const existing = trendMap.get(day) ?? { revenue: 0, profit: 0, orders: 0 }
    existing.revenue += Number(s.total)
    existing.profit += Number(s.gross_profit)
    existing.orders += 1
    trendMap.set(day, existing)
  }
  const salesTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  const expenseMap = new Map<string, number>()
  for (const e of expenses) {
    expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + Number(e.amount))
  }
  const expenseBreakdown = [...expenseMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit,
    inventoryValue,
    totalOrders: sales.length,
    pendingDeliveries: poRes.count ?? 0,
    lowStock: { count: lowStockItems.length, items: lowStockItems },
    topProducts,
    salesTrend,
    expenseBreakdown,
  }
}
