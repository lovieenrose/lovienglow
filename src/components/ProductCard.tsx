import { Eye, Plus, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { formatPrice, type Product } from '@/data/products'
import { ProductVisual } from './ProductVisual'
import { ProductModal } from './ProductModal'
import { useStore } from './Store'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <>
      <article className="product-card">
        <div className="product-card__visual">
          <button className="visual-open" onClick={() => setOpen(true)} aria-label={`View ${product.name}`}>
            <ProductVisual product={product} />
          </button>
          <div className="card-badges">
            {product.isBestSeller && <span className="badge badge--bestseller">Best Seller</span>}
            {product.isNew && <span className="badge badge--new">New</span>}
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
              <b>{formatPrice(product.price)}</b>
              {product.compareAt && <del>{formatPrice(product.compareAt)}</del>}
            </div>
            <button
              className="btn-add-cart"
              onClick={() => addToCart(product.id)}
              aria-label={`Add ${product.name} to cart`}
              id={`add-to-cart-${product.id}`}
            >
              <Plus size={13} />
              Add to Cart
            </button>
          </div>
        </div>
      </article>
      {open && <ProductModal product={product} onClose={() => setOpen(false)} />}
    </>
  )
}
