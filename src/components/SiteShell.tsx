import { Link } from '@tanstack/react-router'
import { Check, Search, ShoppingCart, X } from 'lucide-react'
import products, { formatPrice } from '@/data/products'
import { ProductVisual } from './ProductVisual'
import { useStore } from './Store'

export function Header() {
  const { cart, setCartOpen, query, setQuery } = useStore()
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)

  return (
    <>
      <div className="announcement">
        Premium peptides, skinboosters &amp; research supplies — all in one shop.
      </div>
      <header className="site-header">
        <a href="#top" className="logo-link" aria-label="Go to shop home">
          <img src="/lovieNglow-logo-banner.png" alt="LovieNGlow" className="site-logo" />
        </a>
        <div className="header-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="header-actions">
          <button
            className="icon-button badge-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping cart — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            id="cart-button"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && <span>{itemCount}</span>}
          </button>
        </div>
      </header>
    </>
  )
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, openCheckout } = useStore()
  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((item) => item.id === Number(id))!,
    quantity,
  }))
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  return (
    <div className={`drawer-layer ${cartOpen ? 'drawer-layer--open' : ''}`} aria-hidden={!cartOpen}>
      <button className="drawer-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" />
      <aside className="cart-drawer" role="dialog" aria-label="Shopping cart">
        <div className="drawer-header">
          <div>
            <h2>Your Cart</h2>
            {lines.length > 0 && (
              <span className="cart-count">{lines.length} item{lines.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={36} strokeWidth={1.3} />
            <h3>Your cart is empty</h3>
            <p>Add products to your cart to get started.</p>
            <button className="button button--dark" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <ProductVisual product={product} compact />
                  <div className="cart-line__info">
                    <h3>{product.name}</h3>
                    <p className="cart-line__variant">{product.strength[0]}</p>
                    <p className="cart-line__unit-price">{formatPrice(product.price)} each</p>
                    <div className="quantity">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-price">
                    <b>{formatPrice(product.price * quantity)}</b>
                    <button onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <b>{formatPrice(subtotal)}</b>
              </div>
              <p className="cart-shipping-note">Shipping calculated at checkout.</p>
              <button className="button button--dark button--wide" onClick={openCheckout} id="checkout-button">
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/lovieNglow-logo-banner.png" alt="LovieNGlow" className="site-logo site-logo--footer" />
        <p className="footer-tagline">Premium peptides, skinboosters &amp; research supplies.</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link to="/track">Track Your Order</Link>
        <a href="mailto:lovin.glow.ph@gmail.com">Contact</a>
        <a href="#top">Shipping &amp; Returns</a>
        <a href="#top">Privacy Policy</a>
        <a href="#top">Terms &amp; Conditions</a>
      </nav>
      <div className="footer-right">
        <div className="footer-social">
          <a href="#top" aria-label="Instagram" className="social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="#top" aria-label="TikTok" className="social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
            </svg>
          </a>
        </div>
        <small className="footer-copy">© 2026 LovieNGlow. For research and wellness education only. Always consult a qualified professional.</small>
      </div>
    </footer>
  )
}

export function Toast() {
  const { toast } = useStore()
  return (
    <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite">
      <Check size={14} />
      {toast}
    </div>
  )
}
