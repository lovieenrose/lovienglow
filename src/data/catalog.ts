export const PUBLIC_CATEGORIES = [
  'All',
  'GLP-1 Complete Set',
  'Single Peptides',
  'Skinboosters',
  'Liquid Blends',
  'Topicals',
  'Other Supplies',
  'Waters',
] as const

export type PublicCategory = (typeof PUBLIC_CATEGORIES)[number]

// A row from the real, owner-scoped `products`/`product_sets` tables,
// reshaped for public storefront display. `id` is the real UUID (a
// product_sets id for bundles). Bundles (`isSet: true`) expand into their
// real component products at checkout time via `setItems`.
export interface PublicProduct {
  id: string
  slug: string
  name: string
  category: Exclude<PublicCategory, 'All'>
  shortCategory: string
  description: string
  shortDescription: string
  price: number
  compareAt?: number
  stock: number
  rating: number
  reviews: number
  isNew?: boolean
  isBestSeller?: boolean
  strength: string[]
  benefits: string[]
  included?: string[]
  palette: [string, string, string]
  form: 'vial' | 'set' | 'jar' | 'bottle' | 'supply'
  isSet?: boolean
  // Full component details are included here (not just an id to cross-reference
  // against the public catalog) because bundle components like packaging
  // essentials aren't necessarily sold standalone, so they may not appear in
  // the public catalog at all — this is what checkout expands each bundle
  // line into, and it must always resolve to a real name and price.
  setItems?: Array<{ productId: string; name: string; price: number; quantity: number }>
  // Real uploaded photo(s), preferred over the generated `ProductVisual` art
  // when present. `image` is the single inventory photo; `gallery` is the
  // storefront-only photo set (gallery[0] is the primary thumbnail).
  image?: string
  gallery?: string[]
  // Computed from the admin's visibility/status-override settings — never
  // reflects a real database write, just how the item should render publicly.
  purchasable: boolean
  badge?: 'out_of_stock' | 'coming_soon' | 'discontinued'
}
