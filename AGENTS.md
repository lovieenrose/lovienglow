# Veloura Storefront Guide

## Architecture

Veloura is a TanStack Start and React 19 ecommerce experience deployed on Netlify. File-based routes live in `src/routes`, reusable shopping UI lives in `src/components`, the static catalog is defined in `src/data/products.ts`, and Stripe server functions live in `src/lib`.

## Key Directories

- `src/routes/`: Home, catalog, product detail, and checkout status routes.
- `src/components/`: Shared shell, product cards, product artwork, cart, wishlist, and toast state.
- `src/data/`: Typed product catalog and category definitions.
- `src/lib/`: Server-side integrations such as Stripe Checkout.
- `public/`: Static assets served without processing.

## Conventions

- Use TypeScript strict mode and type-only imports where applicable.
- Use the `@/` alias for imports from `src`.
- Keep catalog content in `src/data/products.ts`; do not duplicate product records in routes.
- Use `StoreProvider` for client-side cart and wishlist behavior.
- Add visual tokens and responsive rules to `src/styles.css` instead of scattering inline styles.
- Keep headings editorial and concise; body copy should remain calm, clear, and trustworthy.

## Design Decisions

Product visuals are generated with reusable CSS composition rather than remote image dependencies. This keeps the art direction consistent, fast, and easy to recolor through each product's palette. Cart and wishlist selections are session UI state; use a Netlify platform data primitive before adding cross-session or account-based persistence. Stripe Checkout activates when `STRIPE_SECRET_KEY` is configured.

## Commands

- `npm run dev`: Start the local Vite development server.
- `npm run build`: Create the production build.

Do not commit generated build output. Netlify publishes the client bundle from `dist/client`.
