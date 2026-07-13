import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/products')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/inventory' })
  },
})
