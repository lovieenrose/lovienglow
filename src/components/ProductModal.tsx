import { ChevronDown, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Truck, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice, type Product } from '@/data/products'
import { ProductVisual } from './ProductVisual'
import { useStore } from './Store'

export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, toggleWishlist, wishlist, setCartOpen } = useStore()
  const [variant, setVariant] = useState(product.strength[0])
  const [quantity, setQuantity] = useState(1)
  const [image, setImage] = useState(0)
  const saved = wishlist.includes(product.id)

  return (
    <div className="modal-layer product-modal-layer">
      <button className="modal-backdrop" onClick={onClose} aria-label="Close product details" />
      <div className="product-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="product-modal__scroll">
          <div className="gallery">
            <div className="gallery-thumbs">
              {[0, 1, 2].map((item) => (
                <button key={item} className={image === item ? 'active' : ''} onClick={() => setImage(item)}>
                  <ProductVisual product={product} compact />
                </button>
              ))}
            </div>
            <div className={`gallery-main gallery-main--${image}`}><ProductVisual product={product} /></div>
          </div>

          <div className="purchase-panel">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="rating"><span className="stars">★★★★★</span><b>{product.rating}</b><span>{product.reviews} reviews</span></div>
            <div className="detail-price"><b>{formatPrice(product.price)}</b>{product.compareAt && <del>{formatPrice(product.compareAt)}</del>}</div>
            <p className="detail-description">{product.description}</p>
            <div className="stock"><i /> {product.stock < 15 ? `Only ${product.stock} left — nearly gone` : 'In stock and ready to ship'}</div>

            <div className="variant-picker">
              <div><b>Choose your {product.form === 'jar' || product.form === 'bottle' ? 'size' : 'strength'}</b><span>{variant}</span></div>
              <div>{product.strength.map((option) => <button className={variant === option ? 'active' : ''} onClick={() => setVariant(option)} key={option}>{option}</button>)}</div>
            </div>

            {product.benefits.length > 0 && (
              <ul className="modal-benefits">{product.benefits.map((benefit) => <li key={benefit}><Sparkles size={13} />{benefit}</li>)}</ul>
            )}

            {product.included && (
              <div className="modal-included">
                <b>What's included</b>
                <div>{product.included.map((item) => <span key={item}>{item}</span>)}</div>
              </div>
            )}

            <details className="modal-usage">
              <summary>Suggested use <ChevronDown size={14} /></summary>
              <p>Use only as directed by your qualified healthcare professional. Review all included preparation and storage guidance before use.</p>
            </details>

            <div className="purchase-actions">
              <div className="quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={13} /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button>
              </div>
              <button className="button button--dark" onClick={() => addToCart(product.id, quantity)}><ShoppingBag size={15} /> Add to bag</button>
              <button className={`save-detail ${saved ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Save to wishlist"><Heart fill={saved ? 'currentColor' : 'none'} /></button>
            </div>
            <button className="button button--pink button--wide" onClick={() => { addToCart(product.id, quantity); setCartOpen(true); onClose() }}>Buy it now</button>

            <div className="purchase-assurances">
              <span><Truck size={14} /> Discreet cold-pack delivery</span>
              <span><ShieldCheck size={14} /> Quality-first sourcing</span>
              <span><Sparkles size={14} /> Support from real humans</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
