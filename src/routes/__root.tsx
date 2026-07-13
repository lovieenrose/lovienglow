import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { CartDrawer, Footer, Header, Toast } from '@/components/SiteShell'
import { CheckoutModal } from '@/components/CheckoutModal'
import { StoreProvider } from '@/components/Store'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LovieNGlow — Peptide Beauty & Research Supplies' },
      {
        name: 'description',
        content:
          'Shop premium GLP peptides, skinboosters, topicals, liquid blends, research waters, and essential supplies. Fast, discreet delivery.',
      },
      { property: 'og:title', content: 'LovieNGlow — Peptide Beauty & Research Supplies' },
      {
        property: 'og:description',
        content:
          'A premium one-stop shop for peptide beauty products and research essentials. Browse the full catalog and order online.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'LovieNGlow — Peptide Beauty & Research Supplies' },
      {
        name: 'twitter:description',
        content:
          'Premium peptides, skinboosters, topicals, and research supplies. Order online with secure payment.',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDashboard = pathname.startsWith('/dashboard')

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <StoreProvider>
          {isDashboard ? (
            <main>{children}</main>
          ) : (
            <>
              <Header />
              <main>{children}</main>
              <Footer />
              <CartDrawer />
              <CheckoutModal />
              <Toast />
            </>
          )}
        </StoreProvider>
        <Scripts />
      </body>
    </html>
  )
}
