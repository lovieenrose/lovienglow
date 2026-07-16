import { Eye, Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/currency'
import type { PublicProduct } from '@/data/catalog'
import { ProductVisual } from './ProductVisual'
import { ProductModal } from './ProductModal'
import { useStore } from './Store'

const BADGE_LABEL: Record<NonNullable<PublicProduct['badge']>, string> = {
  out_of_stock: 'Out of Stock',
  coming_soon: 'Coming Soon',
  discontinued: 'Discontinued',
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addToCart } = useStore()
  const [open, setOpen] = useState(false)
  const displayImage = product.gallery?.[0] ?? product.image

  return (
    <>
      <article className="product-card">
        <div className={`product-card__visual ${displayImage ? 'product-card__visual--photo' : ''}`}>
          <button className="visual-open" onClick={() => setOpen(true)} aria-label={`View ${product.name}`}>
            {displayImage ? <img src={displayImage} alt={product.name} className="product-card__photo" /> : <ProductVisual product={product} />}
          </button>
          <div className="card-badges">
            {product.badge && <span className={`badge badge--${product.badge.replace(/_/g, '-')}`}>{BADGE_LABEL[product.badge]}</span>}
            {!product.badge && product.isBestSeller && <span className="badge badge--bestseller">Best Seller</span>}
            {!product.badge && product.isNew && <span className="badge badge--new">New</span>}
          </div>
          <button className="quick-button" onClick={() => setOpen(true)}>
            <Eye size={13} /> Quick View
          </button>
        </div>
        <div className="product-card__body">
          <div className="product-meta">
            <span className="product-category">{product.shortCategory}</span>
            <span className="product-rating">
              <Star size={10} fill="currentColor" /> {product.rating}
            </span>
          </div>
          <button className="product-card__title" onClick={() => setOpen(true)}>
            <h3>{product.name}</h3>
          </button>
          <p className="product-card__desc">{product.shortDescription}</p>
          <div className="product-card__footer">
            <div className="product-card__price">
              {product.badge === 'coming_soon' ? (
                <b>Price available soon</b>
              ) : (
                <>
                  <b>{formatPrice(product.price)}</b>
                  {product.compareAt && <del>{formatPrice(product.compareAt)}</del>}
                </>
              )}
            </div>
            <button
              className="btn-add-cart"
              onClick={() => addToCart(product.id)}
              aria-label={`Add ${product.name} to cart`}
              id={`add-to-cart-${product.id}`}
              disabled={!product.purchasable}
            >
              <Plus size={13} />
              {product.badge ? BADGE_LABEL[product.badge] : 'Add to Cart'}
            </button>
          </div>
        </div>
      </article>
      {open && <ProductModal product={product} onClose={() => setOpen(false)} />}
    </>
  )
}
