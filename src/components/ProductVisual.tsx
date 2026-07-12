import type { Product } from '@/data/products'
import type { CSSProperties } from 'react'

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div
      className={`product-visual product-visual--${product.form} ${compact ? 'product-visual--compact' : ''}`}
      style={{ '--tone': product.palette[0], '--ink': product.palette[1], '--wash': product.palette[2] } as CSSProperties}
      aria-label={`${product.name} product presentation`}
      role="img"
    >
      <span className="visual-orb visual-orb--one" />
      <span className="visual-orb visual-orb--two" />
      <div className="product-object">
        <span className="product-cap" />
        <span className="product-label">
          <i>LG</i>
          <b>{product.name.split(' ')[0]}</b>
          <small>{product.shortCategory}</small>
        </span>
      </div>
      {product.form === 'set' && <div className="product-object product-object--secondary"><span className="product-cap" /><span className="product-label"><i>LG</i><b>Pure</b><small>bac water</small></span></div>}
      {product.form === 'supply' && <div className="supply-card">ritual<br />essentials</div>}
      <span className="visual-shadow" />
    </div>
  )
}
