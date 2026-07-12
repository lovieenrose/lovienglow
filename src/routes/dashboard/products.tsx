import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/dashboard/products')({
  component: () => <ComingSoon title="Products" description="Full product CRUD is coming in a future update." />,
})
