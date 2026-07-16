import { Check, ChevronDown, Minus, Plus, ShieldCheck, ShoppingCart, Truck, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/currency'
import type { PublicProduct } from '@/data/catalog'
import { ProductVisual } from './ProductVisual'
import { useStore } from './Store'

const BADGE_LABEL: Record<NonNullable<PublicProduct['badge']>, string> = {
  out_of_stock: 'Out of Stock',
  coming_soon: 'Coming Soon',
  discontinued: 'Discontinued',
}

export function ProductModal({ product, onClose }: { product: PublicProduct; onClose: () => void }) {
  const { addToCart, setCartOpen } = useStore()
  const [variant, setVariant] = useState(product.strength[0])
  const [quantity, setQuantity] = useState(1)
  const [image, setImage] = useState(0)
  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : undefined

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
    onClose()
    setCartOpen(true)
  }

  const handleBuyNow = () => {
    addToCart(product.id, quantity)
    setCartOpen(true)
    onClose()
  }

  return (
    <div className="modal-layer product-modal-layer">
      <button className="modal-backdrop" onClick={onClose} aria-label="Close product details" />
      <div className="product-modal" role="dialog" aria-label={`${product.name} — Product Details`}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div className="product-modal__scroll">
          <div className="gallery">
            <div className="gallery-thumbs">
              {(gallery ?? [0, 1, 2]).map((item, i) => (
                <button
                  key={gallery ? item : i}
                  className={image === i ? 'active' : ''}
                  onClick={() => setImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  {gallery ? <img src={gallery[i]} alt={`${product.name} ${i + 1}`} /> : <ProductVisual product={product} compact />}
                </button>
              ))}
            </div>
            <div className={`gallery-main gallery-main--${image}`}>
              {gallery ? <img src={gallery[image] ?? gallery[0]} alt={product.name} className="gallery-main__photo" /> : <ProductVisual product={product} />}
            </div>
          </div>

          <div className="purchase-panel">
            <span className="product-category-label">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="rating">
              <span className="stars">★★★★★</span>
              <b>{product.rating}</b>
              <span>{product.reviews} reviews</span>
            </div>
            <div className="detail-price">
              {product.badge === 'coming_soon' ? (
                <b>Price available soon</b>
              ) : (
                <>
                  <b>{formatPrice(product.price)}</b>
                  {product.compareAt && <del>{formatPrice(product.compareAt)}</del>}
                </>
              )}
            </div>
            <p className="detail-description">{product.description}</p>
            <div className="stock">
              <i />
              {product.badge
                ? BADGE_LABEL[product.badge]
                : product.stock < 15
                  ? `Only ${product.stock} left — order soon`
                  : 'In stock and ready to ship'}
            </div>

            <div className="variant-picker">
              <div>
                <b>
                  {product.form === 'jar' || product.form === 'bottle' ? 'Size' : 'Strength'}
                </b>
                <span>{variant}</span>
              </div>
              <div>
                {product.strength.map((option) => (
                  <button
                    key={option}
                    className={variant === option ? 'active' : ''}
                    onClick={() => setVariant(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {product.included && (
              <div className="modal-included">
                <b>What's included</b>
                <div>{product.included.map((item) => <span key={item}>{item}</span>)}</div>
              </div>
            )}

            <details className="modal-usage">
              <summary>
                Suggested Use <ChevronDown size={14} />
              </summary>
              <p>
                Use only as directed by your qualified healthcare professional. Review all
                included preparation and storage guidance before use.
              </p>
            </details>

            <div className="purchase-actions">
              <div className="quantity">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={13} />
                </button>
              </div>
              <button
                className="button button--dark"
                onClick={handleAddToCart}
                id={`modal-add-to-cart-${product.id}`}
                disabled={!product.purchasable}
              >
                <ShoppingCart size={15} /> {product.badge ? BADGE_LABEL[product.badge] : 'Add to Cart'}
              </button>
            </div>
            <button
              className="button button--pink button--wide"
              onClick={handleBuyNow}
              id={`modal-buy-now-${product.id}`}
              disabled={!product.purchasable}
            >
              Buy Now
            </button>

            <div className="purchase-assurances">
              <span><Truck size={13} /> Discreet delivery</span>
              <span><ShieldCheck size={13} /> Quality sourced</span>
              <span><Check size={13} /> Human support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
