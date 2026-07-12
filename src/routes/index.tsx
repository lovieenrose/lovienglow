import { createFileRoute } from '@tanstack/react-router'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import products, { categories } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { useStore } from '@/components/Store'

export const Route = createFileRoute('/')({ component: ShopPage })

function ShopPage() {
  const { query, setQuery } = useStore()
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [visible, setVisible] = useState(12)

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase()
    return [...products]
      .filter((product) => category === 'All' || product.category === category)
      .filter((product) =>
        `${product.name} ${product.shortDescription} ${product.category}`.toLowerCase().includes(normalized)
      )
      .sort((first, second) => {
        if (sort === 'newest') return Number(second.isNew) - Number(first.isNew)
        if (sort === 'best') return second.reviews - first.reviews
        if (sort === 'price-low') return first.price - second.price
        if (sort === 'price-high') return second.price - first.price
        if (sort === 'name') return first.name.localeCompare(second.name)
        return Number(second.isBestSeller) - Number(first.isBestSeller)
      })
  }, [category, query, sort])

  return (
    <div className="catalog-page" id="top">
      <div className="catalog-toolbar">
        <div className="toolbar-left">
          <div className="search-field" role="search">
            <Search size={15} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setVisible(12) }}
              placeholder="Search products…"
              aria-label="Search products"
              id="product-search"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="toolbar-right">
          <label className="sort-label" htmlFor="sort-select">
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Sort</span>
            <select
              id="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="best">Best Selling</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="category-tabs" role="tablist" aria-label="Product categories">
        {categories.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={category === item}
            className={category === item ? 'active' : ''}
            onClick={() => { setCategory(item); setVisible(12) }}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="catalog-meta">
        <span className="catalog-count">
          <b>{filtered.length}</b> {filtered.length === 1 ? 'product' : 'products'}
          {category !== 'All' && <> in <em>{category}</em></>}
        </span>
      </div>

      {filtered.length ? (
        <>
          <div className="product-grid catalog-grid">
            {filtered.slice(0, visible).map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="load-more-wrap">
              <button
                className="button button--outline load-more"
                onClick={() => setVisible((current) => current + 8)}
              >
                Load More Products
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-results">
          <Search size={32} aria-hidden="true" />
          <h2>No products found</h2>
          <p>Try a different search term or clear your filters to browse all products.</p>
          <button
            className="button button--dark"
            onClick={() => { setQuery(''); setCategory('All') }}
          >
            View All Products
          </button>
        </div>
      )}
    </div>
  )
}
