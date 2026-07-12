import { Heart, Search, ShoppingBag, Sparkles, X } from 'lucide-react'
import products, { formatPrice } from '@/data/products'
import { ProductVisual } from './ProductVisual'
import { useStore } from './Store'

export function Header() {
  const { cart, wishlist, setCartOpen, query, setQuery } = useStore()
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)

  return (
    <>
      <div className="announcement"><Sparkles size={13} /> One shop for peptides, beauty boosters, and research essentials <Sparkles size={13} /></div>
      <header className="site-header">
        <a href="#top" className="wordmark"><span>LovieNGlow</span><small>peptide beauty, curated.</small></a>
        <div className="header-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" aria-label="Search products" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <div className="header-actions">
          <button className="icon-button badge-button" aria-label="Wishlist"><Heart /><span>{wishlist.length}</span></button>
          <button className="icon-button badge-button" onClick={() => setCartOpen(true)} aria-label="Shopping bag"><ShoppingBag /><span>{itemCount}</span></button>
        </div>
      </header>
    </>
  )
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, openCheckout } = useStore()
  const lines = Object.entries(cart).map(([id, quantity]) => ({ product: products.find((item) => item.id === Number(id))!, quantity }))
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  return (
    <div className={`drawer-layer ${cartOpen ? 'drawer-layer--open' : ''}`} aria-hidden={!cartOpen}>
      <button className="drawer-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" />
      <aside className="cart-drawer">
        <div className="drawer-header"><div><span className="eyebrow">Your selections</span><h2>Ritual bag</h2></div><button className="icon-button" onClick={() => setCartOpen(false)}><X /></button></div>
        {lines.length === 0 ? (
          <div className="empty-cart"><ShoppingBag /><h3>Your bag is beautifully empty.</h3><p>Explore thoughtful additions for your wellness ritual.</p><button className="button button--dark" onClick={() => setCartOpen(false)}>Discover the collection</button></div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <ProductVisual product={product} compact />
                  <div><h3>{product.name}</h3><p>{product.strength[0]}</p><div className="quantity"><button onClick={() => updateQuantity(product.id, quantity - 1)}>−</button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)}>+</button></div></div>
                  <div className="cart-price"><b>{formatPrice(product.price * quantity)}</b><button onClick={() => removeFromCart(product.id)}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div><span>Subtotal</span><b>{formatPrice(subtotal)}</b></div>
              <p>Shipping is calculated in the next step.</p>
              <button className="button button--dark button--wide" onClick={openCheckout}>Checkout</button>
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
      <div><span className="wordmark wordmark--footer"><span>LovieNGlow</span></span><p>Peptide beauty essentials, curated in one polished shop.</p></div>
      <div><b>Care</b><a href="mailto:hello@example.com">Contact</a><a href="#top">Shipping & returns</a></div>
      <div><b>Follow</b><a href="#top">Instagram</a><a href="#top">TikTok</a></div>
      <div className="newsletter"><b>Glow notes</b><p>Product drops, restocks, and soft reminders from LovieNGlow.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Your email address" aria-label="Email address" /><button>Join us</button></form></div>
      <small>© 2026 LovieNGlow. For research and wellness education only. Always consult a qualified professional.</small>
    </footer>
  )
}

export function Toast() {
  const { toast } = useStore()
  return <div className={`toast ${toast ? 'toast--visible' : ''}`}><Sparkles size={16} />{toast}</div>
}
