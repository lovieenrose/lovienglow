import { createFileRoute, redirect } from '@tanstack/react-router'

// This is a private B2B tool with no public storefront — every visitor to
// `/` goes to the dashboard, whose own beforeLoad guard (see dashboard.tsx)
// bounces unauthenticated visitors to /dashboard/login.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
