# Veloura

Veloura is a premium, mobile-responsive ecommerce storefront for a peptide and wellness brand. The experience pairs a soft editorial identity with a complete shopping flow: curated homepage storytelling, category discovery, real-time product search, sorting, quick views, product details, wishlist behavior, a responsive cart, and Stripe-ready checkout.

## Technology

- TanStack Start and TanStack Router
- React 19 and TypeScript
- Tailwind CSS 4 with a custom global design system
- Lucide icons
- Stripe Checkout through a server function
- Netlify deployment via the TanStack Start Vite plugin

## Local Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The Vite server runs on port `3000`. For Netlify's local runtime, use:

```bash
netlify dev --port 8889
```

## Checkout Configuration

Set `STRIPE_SECRET_KEY` to enable Stripe Checkout and `SITE_URL` to the deployed site origin so success and cancellation redirects use the correct host. Without Stripe configuration, the catalog, cart, wishlist, and all browsing experiences remain available.

## Project Structure

- `src/routes/index.tsx`: Editorial homepage
- `src/routes/products/index.tsx`: Searchable and filterable catalog
- `src/routes/products/$productId.tsx`: Product detail experience
- `src/components/Store.tsx`: Persistent cart and wishlist state
- `src/components/ProductVisual.tsx`: Reusable product artwork
- `src/data/products.ts`: Typed product catalog
- `src/styles.css`: Full visual and responsive system
