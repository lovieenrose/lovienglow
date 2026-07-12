import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { CartDrawer, Footer, Header, Toast } from '@/components/SiteShell'
import { CheckoutModal } from '@/components/CheckoutModal'
import { StoreProvider } from '@/components/Store'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'LovieNGlow | Peptide Beauty & Research Essentials',
      },
      { name: 'description', content: 'LovieNGlow is a premium peptide beauty platform for GLP products, skinboosters, topicals, liquid blends, peptide supplies, waters, and research essentials.' },
      { property: 'og:title', content: 'LovieNGlow | Peptide Beauty & Research Essentials' },
      { property: 'og:description', content: 'Shop curated GLP products, skinboosters, topicals, liquid blends, peptide supplies, waters, and other research essentials in one clean, feminine storefront.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'LovieNGlow' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'LovieNGlow | Peptide Beauty & Research Essentials' },
      { name: 'twitter:description', content: 'A premium one-stop shop for peptide beauty products and research essentials.' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <StoreProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <CheckoutModal />
          <Toast />
        </StoreProvider>
        <Scripts />
      </body>
    </html>
  )
}
