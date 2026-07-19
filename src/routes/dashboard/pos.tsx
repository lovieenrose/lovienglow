import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  completeSaleFn,
  createExpenseFn,
  deleteSalesOrderFn,
  getBusinessProfileFn,
  listCategoriesFn,
  listPromosFn,
  listProductSetsFn,
  listProductsFn,
  listSalesOrdersFn,
  reverseSaleFn,
} from '@/lib/serverFunctions'
import type { BusinessProfile, Category, Product, ProductSet, Promo, SalesOrder } from '@/lib/inventory/types'
import { InvoiceModal } from '@/components/pos/InvoiceModal'
import { ManageProductSetsModal } from '@/components/pos/ManageProductSetsModal'
import { OfficialReceiptModal } from '@/components/pos/OfficialReceiptModal'
import { PromoManagerModal } from '@/components/pos/PromoManagerModal'
import { SaleDetailsModal } from '@/components/pos/SaleDetailsModal'

export const Route = createFileRoute('/dashboard/pos')({
  loader: async () => {
    const [products, categories, productSets, promos, salesOrders, businessProfile] = await Promise.all([
      listProductsFn(),
      listCategoriesFn(),
      listProductSetsFn(),
      listPromosFn(),
      listSalesOrdersFn({ data: {} }),
      getBusinessProfileFn(),
    ])
    return { products, categories, productSets, promos, salesOrders, businessProfile }
  },
  component: PosPage,
})

export function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

const PAYMENT_METHODS = ['Maribank', 'GoTyme', 'GCash']
const COURIERS = ['Lalamove', 'J&T']

interface CartLine {
  productId: string
  name: string
  sku: string | null
  unitPrice: number
  costPrice: number
  quantity: number
  maxStock: number
  isFreeReward?: boolean
}

type PageTab = 'new_sale' | 'history'

function PosPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [tab, setTab] = useState<PageTab>('new_sale')

  return (
    <div className="dash-page">
      <div className="dash-inv-header">
        <div>
          <h1 className="dash-page__title" style={{ marginBottom: 4 }}>Sales / POS</h1>
          <p>Check out orders and review your sales history</p>
        </div>
        <div className="dash-toolbar__actions">
          <button className={`button ${tab === 'new_sale' ? 'button--dark' : 'button--outline'}`} onClick={() => setTab('new_sale')}>New Sale</button>
          <button className={`button ${tab === 'history' ? 'button--dark' : 'button--outline'}`} onClick={() => setTab('history')}>History</button>
        </div>
      </div>

      {tab === 'new_sale' ? (
        <NewSaleView
          products={data.products}
          categories={data.categories}
          productSets={data.productSets}
          promos={data.promos}
          businessProfile={data.businessProfile}
          onSaleCreated={async () => {
            await router.invalidate()
          }}
        />
      ) : (
        <HistoryView salesOrders={data.salesOrders} businessProfile={data.businessProfile} onChanged={async () => router.invalidate()} />
      )}
    </div>
  )
}

// ── New Sale ──────────────────────────────────────────────────────────────

function NewSaleView({
  products,
  categories,
  productSets,
  promos,
  businessProfile,
  onSaleCreated,
}: {
  products: Product[]
  categories: Category[]
  productSets: ProductSet[]
  promos: Promo[]
  businessProfile: BusinessProfile | null
  onSaleCreated: () => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [setQuery, setSetQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [shippingFee, setShippingFee] = useState(0)
  const [courier, setCourier] = useState('')
  const [shippingPaidBy, setShippingPaidBy] = useState<'customer' | 'business'>('customer')
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const [invoiceOrder, setInvoiceOrder] = useState<SalesOrder | null>(null)
  const [showManageSets, setShowManageSets] = useState(false)
  const [showPromoManager, setShowPromoManager] = useState(false)
  const [productPage, setProductPage] = useState(1)
  const PRODUCTS_PER_PAGE = 20

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false
      if (search) {
        const term = search.toLowerCase()
        if (!p.name.toLowerCase().includes(term) && !(p.sku ?? '').toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [products, search, categoryId])

  useEffect(() => {
    setProductPage(1)
  }, [search, categoryId])

  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const pagedProducts = useMemo(
    () => filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE),
    [filteredProducts, productPage],
  )

  const filteredSets = useMemo(
    () => productSets.filter((s) => s.name.toLowerCase().includes(setQuery.toLowerCase())),
    [productSets, setQuery],
  )

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id && !l.isFreeReward)
      if (existing) {
        const nextQty = Math.min(product.stock_quantity, existing.quantity + quantity)
        return prev.map((l) => (l === existing ? { ...l, quantity: nextQty } : l))
      }
      if (product.stock_quantity <= 0) return prev
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.selling_price,
          costPrice: product.cost_price,
          quantity: Math.min(product.stock_quantity, quantity),
          maxStock: product.stock_quantity,
        },
      ]
    })
  }

  const addSet = (set: ProductSet) => {
    for (const item of set.items) {
      const product = products.find((p) => p.id === item.product_id)
      if (product) addToCart(product, item.quantity)
    }
  }

  const updateQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l, i) => (i === index ? { ...l, quantity: Math.max(0, Math.min(l.maxStock, l.quantity + delta)) } : l))
        .filter((l) => l.quantity > 0),
    )
  }

  const updatePrice = (index: number, price: number) => {
    setCart((prev) => prev.map((l, i) => (i === index ? { ...l, unitPrice: Math.max(0, price) } : l)))
  }

  const removeLine = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index))

  const applyPromo = () => {
    setError('')
    const match = promos.find((p) => p.active && p.code.toLowerCase() === promoCode.trim().toLowerCase())
    if (!match) {
      setAppliedPromo(null)
      if (promoCode.trim()) setError('Promo code not found.')
      return
    }
    setAppliedPromo(match)

    if (match.reward_type === 'free_item') {
      const eligible = match.reward_product_ids
        .map((id) => products.find((p) => p.id === id))
        .find((p) => p && p.stock_quantity > 0)
      if (eligible && !cart.some((l) => l.isFreeReward && l.productId === eligible.id)) {
        setCart((prev) => [
          ...prev,
          {
            productId: eligible.id,
            name: `${eligible.name} (Free — ${match.code})`,
            sku: eligible.sku,
            unitPrice: 0,
            costPrice: eligible.cost_price,
            quantity: 1,
            maxStock: eligible.stock_quantity,
            isFreeReward: true,
          },
        ])
      }
    }
  }

  const cartHasTrigger = appliedPromo
    ? appliedPromo.trigger_product_ids.length === 0 || cart.some((l) => appliedPromo.trigger_product_ids.includes(l.productId))
    : false

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const cogs = cart.reduce((s, l) => s + l.costPrice * l.quantity, 0)

  const discount = useMemo(() => {
    if (!appliedPromo || !cartHasTrigger) return 0
    if (appliedPromo.reward_type === 'fixed_discount') return Math.min(subtotal, appliedPromo.reward_value)
    if (appliedPromo.reward_type === 'percent_discount') return subtotal * (appliedPromo.reward_value / 100)
    return 0
  }, [appliedPromo, cartHasTrigger, subtotal])

  // Shipping is never part of what this business collects through the POS:
  // the customer pays the courier directly (COD), or the business shoulders
  // it as free shipping (logged as an Expense instead — see checkout below).
  // Either way it stays off Revenue/COGS/Margin.
  const total = Math.max(0, subtotal - discount)
  const grossProfit = total - cogs
  const marginPct = total > 0 ? (grossProfit / total) * 100 : 0

  const checkout = async () => {
    if (cart.length === 0) return
    setCheckingOut(true)
    setError('')
    try {
      const order = await completeSaleFn({
        data: {
          customerName: customerName || undefined,
          paymentMethod,
          discount,
          shippingFee,
          courier: courier || undefined,
          shippingPaidBy,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
        },
      })
      if (shippingPaidBy === 'business' && shippingFee > 0) {
        try {
          await createExpenseFn({
            data: {
              category: 'Shipping',
              description: `Shipping shouldered for order ${order.order_number}${courier ? ` (${courier})` : ''}`,
              amount: shippingFee,
              expense_date: new Date().toISOString().slice(0, 10),
            },
          })
        } catch {
          // Sale already succeeded — a failed expense log shouldn't block checkout.
        }
      }
      setInvoiceOrder(order)
      setCart([])
      setShippingFee(0)
      setCourier('')
      setShippingPaidBy('customer')
      setPromoCode('')
      setAppliedPromo(null)
      setCustomerName('')
      await onSaleCreated()
    } catch {
      setError('Checkout failed — check stock availability and try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="pos-layout">
      <div className="pos-catalog">
        <div className="pos-sets-panel">
          <div className="pos-sets-panel__header">
            <div className="dash-search-field" style={{ flex: 1 }}>
              <Search size={14} />
              <input placeholder="Search product sets…" value={setQuery} onChange={(e) => setSetQuery(e.target.value)} />
            </div>
            <button className="button button--outline" onClick={() => setShowManageSets(true)}>Manage sets</button>
          </div>
          {filteredSets.length > 0 && (
            <div className="pos-set-cards">
              {filteredSets.map((set) => (
                <div className="pos-set-card" key={set.id} style={{ borderColor: set.color ?? undefined }}>
                  <div className="pos-set-card__head">
                    <span className="pos-set-card__icon" style={{ background: set.color ?? undefined }}>📦</span>
                    <div className="pos-set-card__title">
                      <b>{set.name}</b>
                      <span className="dash-muted">{set.items.length} items</span>
                    </div>
                  </div>
                  <ul className="pos-set-card__items">
                    {set.items.slice(0, 2).map((item) => (
                      <li key={item.id}>{item.quantity}× {item.product?.name ?? 'Product'}</li>
                    ))}
                    {set.items.length > 2 && (
                      <li className="pos-set-card__items-more-wrap">
                        <span className="pos-set-card__items-more">+{set.items.length - 2} more</span>
                        <ul className="pos-set-card__items-popover">
                          {set.items.slice(2).map((item) => (
                            <li key={item.id}>{item.quantity}× {item.product?.name ?? 'Product'}</li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                  <button className="button button--outline button--wide pos-set-card__add" onClick={() => addSet(set)}>
                    <Plus size={13} /> Quick add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pos-search">
          <div className="dash-search-field" style={{ flex: 1 }}>
            <Search size={14} />
            <input placeholder="Search products to add…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="pos-grid">
          {pagedProducts.map((product) => (
            <button
              key={product.id}
              className="pos-product"
              disabled={product.stock_quantity <= 0}
              onClick={() => addToCart(product)}
            >
              {product.image_url ? <img src={product.image_url} alt="" className="pos-product__img" /> : <div className="pos-product__img pos-product__img--placeholder" />}
              <span className="pos-product__name">{product.name}</span>
              <span className="pos-product__price">{formatPeso(product.selling_price)}</span>
              <span className={`pos-product__stock ${product.stock_quantity <= product.reorder_level ? 'pos-product__stock--low' : ''}`}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
              </span>
            </button>
          ))}
          {filteredProducts.length === 0 && <p className="dash-empty-state">No products match.</p>}
        </div>
        {filteredProducts.length > PRODUCTS_PER_PAGE && (
          <div className="pos-pagination">
            <button
              type="button"
              className="button button--outline"
              disabled={productPage <= 1}
              onClick={() => setProductPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pos-pagination__label">Page {productPage} of {productPageCount}</span>
            <button
              type="button"
              className="button button--outline"
              disabled={productPage >= productPageCount}
              onClick={() => setProductPage((p) => Math.min(productPageCount, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="pos-cart">
        <div className="pos-cart__header">
          <h2><ShoppingCart size={16} style={{ verticalAlign: -3 }} /> Current Order</h2>
          {cart.length > 0 && <button className="dash-link-btn" onClick={() => setCart([])}><Trash2 size={13} /> Clear all</button>}
        </div>

        {cart.length === 0 ? (
          <p className="pos-cart__empty">Cart is empty<br /><span className="dash-muted">Select products from the left to start a sale.</span></p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map((line, i) => (
              <div className="pos-cart__item" key={`${line.productId}-${i}`}>
                <div>
                  <div className="pos-cart__item-name">{line.name}</div>
                  <div className="pos-cart__item-price">Cost {formatPeso(line.costPrice)} each</div>
                </div>
                <input
                  type="number"
                  className="dash-inline-input"
                  min={0}
                  max={line.maxStock}
                  value={line.quantity}
                  onChange={(e) => updateQty(i, Number(e.target.value) - line.quantity)}
                  disabled={line.isFreeReward}
                />
                <input
                  type="number"
                  className="dash-inline-input"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) => updatePrice(i, Number(e.target.value))}
                  disabled={line.isFreeReward}
                />
                <button className="pos-cart__remove" onClick={() => removeLine(i)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <label className="dash-field">
          <span>Customer name (optional)</span>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <div className="dash-form-grid">
          <label className="dash-field">
            <span>Courier</span>
            <select
              value={courier}
              onChange={(e) => {
                const next = e.target.value
                setCourier(next)
                if (next === 'Lalamove') {
                  // Lalamove's fee is set in-app by the rider/courier at pickup, not
                  // known at checkout — nothing to record or shoulder here.
                  setShippingFee(0)
                  setShippingPaidBy('customer')
                }
              }}
            >
              <option value="">— None —</option>
              {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {courier !== 'Lalamove' && (
            <label className="dash-field">
              <span>Shipping Fee</span>
              <input type="number" min={0} step="0.01" value={shippingFee || ''} placeholder="0" onChange={(e) => setShippingFee(Number(e.target.value))} />
            </label>
          )}
        </div>
        {courier === 'Lalamove' ? (
          <p className="dash-field__hint">Shipping Fee (Lalamove) — pay courier directly.</p>
        ) : (
          <>
            <div className="dash-segmented">
              <button
                type="button"
                className={`dash-segmented__btn ${shippingPaidBy === 'customer' ? 'is-active' : ''}`}
                onClick={() => setShippingPaidBy('customer')}
              >
                Customer pays
              </button>
              <button
                type="button"
                className={`dash-segmented__btn ${shippingPaidBy === 'business' ? 'is-active' : ''}`}
                onClick={() => setShippingPaidBy('business')}
              >
                I'll shoulder it (free shipping)
              </button>
            </div>
            <p className="dash-field__hint">
              {shippingPaidBy === 'customer'
                ? "Shipping fee is for your records only — it's never added to the customer's total, since they pay the courier directly."
                : "Free shipping for the customer — this amount will be logged as a Shipping expense when you check out."}
            </p>
          </>
        )}

        <label className="dash-field">
          <span>Promo / Discount Code</span>
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="e.g. FIRSTDAY" />
        </label>
        <button type="button" className="button button--outline button--wide" onClick={applyPromo}>
          <Plus size={13} /> Add Promo / Discount
        </button>
        <p className="dash-muted" style={{ fontSize: 12 }}>
          {promos.length} promo{promos.length === 1 ? '' : 's'} saved • {promos.filter((p) => p.active).length} active
          {' · '}
          <button type="button" className="dash-link-btn" onClick={() => setShowPromoManager(true)}>Manage</button>
        </p>

        <label className="dash-field">
          <span>Payment Method</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <div className="pos-cart__totals">
          <div><span>Subtotal</span><span>{formatPeso(subtotal)}</span></div>
          <div>
            <span>Shipping Fee{courier ? ` (${courier})` : ''}</span>
            <span>
              {courier === 'Lalamove'
                ? 'Pay courier directly'
                : shippingFee > 0
                  ? `${formatPeso(shippingFee)} — ${shippingPaidBy === 'customer' ? 'customer pays' : 'you shoulder'}`
                  : 'None'}
            </span>
          </div>
          <div><span>Promo / Discount Code</span><span>{appliedPromo ? appliedPromo.code : 'None'}</span></div>
          <div><span>Discount</span><span>-{formatPeso(discount)}</span></div>
          <div><span>Total Revenue</span><span>{formatPeso(total)}</span></div>
          <div><span>Total Cost (COGS)</span><span>{formatPeso(cogs)}</span></div>
          <div><span>Gross Profit</span><span>{formatPeso(grossProfit)}</span></div>
          <div className="pos-cart__grand"><span>Margin</span><span>{marginPct.toFixed(2)}%</span></div>
        </div>

        {error && <p className="dash-login__error">{error}</p>}

        <button className="button button--dark button--wide" onClick={checkout} disabled={cart.length === 0 || checkingOut}>
          {checkingOut ? 'Processing…' : 'Make Order Form'}
        </button>
      </div>

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} businessProfile={businessProfile} onClose={() => setInvoiceOrder(null)} onChanged={setInvoiceOrder} />
      )}
      {showManageSets && (
        <ManageProductSetsModal
          productSets={productSets}
          onClose={() => setShowManageSets(false)}
          onChanged={onSaleCreated}
        />
      )}
      {showPromoManager && (
        <PromoManagerModal promos={promos} products={products} onClose={() => setShowPromoManager(false)} onChanged={onSaleCreated} />
      )}
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────────────

function HistoryView({
  salesOrders,
  businessProfile,
  onChanged,
}: {
  salesOrders: SalesOrder[]
  businessProfile: BusinessProfile | null
  onChanged: () => Promise<void>
}) {
  const [detailsOrder, setDetailsOrder] = useState<SalesOrder | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<SalesOrder | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<SalesOrder | null>(null)

  const reverse = async (order: SalesOrder) => {
    if (!confirm(`Reverse order ${order.order_number}? This restores stock and cannot be undone.`)) return
    await reverseSaleFn({ data: { id: order.id } })
    await onChanged()
  }

  const remove = async (order: SalesOrder) => {
    if (!confirm(`Permanently delete order ${order.order_number}? This cannot be undone.`)) return
    await deleteSalesOrderFn({ data: { id: order.id } })
    await onChanged()
  }

  if (salesOrders.length === 0) {
    return (
      <div className="dash-empty-card">
        <div className="dash-empty-card__icon"><ShoppingCart size={22} /></div>
        <h2>No sales yet</h2>
        <p>Completed sales will appear here with full profit breakdowns.</p>
      </div>
    )
  }

  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Order #</th><th>Status</th><th>Customer</th><th>Date</th><th>Items</th>
            <th>Revenue</th><th>COGS</th><th>Profit</th><th>Margin</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {salesOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td><span className={`dash-badge dash-badge--sale-${order.status}`}>{order.status.replace('_', ' ')}</span></td>
              <td>{order.customer_name || 'Walk-in'}</td>
              <td>{new Date(order.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
              <td>{order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0}</td>
              <td>{formatPeso(order.total)}</td>
              <td>{formatPeso(order.total_cost)}</td>
              <td>{formatPeso(order.gross_profit)}</td>
              <td>{order.margin_pct.toFixed(2)}%</td>
              <td>
                <div className="dash-row-actions">
                  <button className="dash-link-btn" onClick={() => setDetailsOrder(order)}>Details</button>
                  <button className="dash-link-btn" onClick={() => setInvoiceOrder(order)}>Invoice</button>
                  {order.status === 'paid' && (
                    <button className="dash-link-btn" onClick={() => setReceiptOrder(order)}>Official Receipt</button>
                  )}
                  {order.status !== 'reversed' ? (
                    <button className="dash-link-btn dash-link-btn--danger" onClick={() => reverse(order)}>Reverse</button>
                  ) : (
                    <button className="dash-link-btn dash-link-btn--danger" onClick={() => remove(order)}>Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detailsOrder && <SaleDetailsModal order={detailsOrder} onClose={() => setDetailsOrder(null)} />}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} businessProfile={businessProfile} onClose={() => setInvoiceOrder(null)} onChanged={setInvoiceOrder} />
      )}
      {receiptOrder && (
        <OfficialReceiptModal order={receiptOrder} businessProfile={businessProfile} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  )
}
