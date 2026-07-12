import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/dashboard/customers')({
  component: () => <ComingSoon title="Customers" description="A customer database is coming in a future update." />,
})
