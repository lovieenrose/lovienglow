import { createFileRoute } from '@tanstack/react-router'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import products, { categories } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { useStore } from '@/components/Store'

export const Route = createFileRoute('/')({ component: ShopPage })

function ShopPage() {
  const { query, setQuery } = useStore()
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [visible, setVisible] = useState(8)

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase()
    return [...products]
      .filter((product) => category === 'All' || product.category === category)
      .filter((product) => `${product.name} ${product.shortDescription} ${product.category}`.toLowerCase().includes(normalized))
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
      <div className="catalog-hero">
        <span className="eyebrow"><Sparkles size={12} /> LovieNGlow</span>
        <h1>Peptide beauty, <em>all in one shop.</em></h1>
        <p>A clean, premium edit of GLP products, skinboosters, topicals, liquid blends, peptide supplies, waters, and other research essentials.</p>
      </div>

      <div className="catalog-toolbar">
        <div className="search-field">
          <Search />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(8) }} placeholder="Search the collection" />
          {query && <button onClick={() => setQuery('')}>×</button>}
        </div>
        <label>
          <SlidersHorizontal /> Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="best">Best selling</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="category-tabs">
        {categories.map((item) => (
          <button className={category === item ? 'active' : ''} onClick={() => { setCategory(item); setVisible(8) }} key={item}>{item}</button>
        ))}
      </div>

      <div className="catalog-count"><b>{filtered.length}</b> products <span>·</span> {category === 'All' ? 'The complete collection' : category}</div>

      {filtered.length ? (
        <>
          <div className="product-grid catalog-grid">{filtered.slice(0, visible).map((product) => <ProductCard product={product} key={product.id} />)}</div>
          {visible < filtered.length && <button className="button button--outline load-more" onClick={() => setVisible((current) => current + 4)}>Load more</button>}
        </>
      ) : (
        <div className="empty-results">
          <Search />
          <h2>No rituals found</h2>
          <p>Try another search or clear your filters.</p>
          <button className="button button--dark" onClick={() => { setQuery(''); setCategory('All') }}>View all products</button>
        </div>
      )}
    </div>
  )
}
