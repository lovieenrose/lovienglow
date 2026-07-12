import { Eye, Heart, Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { formatPrice, type Product } from '@/data/products'
import { ProductVisual } from './ProductVisual'
import { ProductModal } from './ProductModal'
import { useStore } from './Store'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore()
  const [open, setOpen] = useState(false)
  const saved = wishlist.includes(product.id)

  return (
    <>
      <article className="product-card">
        <div className="product-card__visual">
          <button className="visual-open" onClick={() => setOpen(true)} aria-label={`View ${product.name}`}><ProductVisual product={product} /></button>
          <div className="card-badges">{product.isBestSeller && <span>Best seller</span>}{product.isNew && <span>New</span>}</div>
          <button className={`heart-button ${saved ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Save to wishlist"><Heart fill={saved ? 'currentColor' : 'none'} /></button>
          <button className="quick-button" onClick={() => setOpen(true)}><Eye /> Quick view</button>
        </div>
        <div className="product-card__body">
          <div className="product-meta"><span>{product.shortCategory}</span><span><Star fill="currentColor" /> {product.rating}</span></div>
          <button className="product-card__title" onClick={() => setOpen(true)}><h3>{product.name}</h3></button>
          <p>{product.shortDescription}</p>
          <div className="product-card__footer"><div><b>{formatPrice(product.price)}</b>{product.compareAt && <del>{formatPrice(product.compareAt)}</del>}</div><button onClick={() => addToCart(product.id)} aria-label={`Add ${product.name} to bag`}><Plus /> Add</button></div>
        </div>
      </article>
      {open && <ProductModal product={product} onClose={() => setOpen(false)} />}
    </>
  )
}
