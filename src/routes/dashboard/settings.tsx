import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/dashboard/settings')({
  component: () => <ComingSoon title="Settings" description="Admin settings are coming in a future update." />,
})
