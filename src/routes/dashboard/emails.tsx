import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/dashboard/emails')({
  component: () => <ComingSoon title="Emails" description="A full email history view is coming in a future update." />,
})
