import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { getBusinessProfileFn, updateBusinessProfileFn } from '@/lib/serverFunctions'

export const Route = createFileRoute('/dashboard/settings')({
  loader: () => getBusinessProfileFn(),
  component: SettingsPage,
})

function SettingsPage() {
  const profile = Route.useLoaderData()
  const router = useRouter()
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'PHP')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await updateBusinessProfileFn({ data: { businessName, fullName, currency } })
    await router.invalidate()
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Settings</h1>
      <div className="dash-panel" style={{ maxWidth: 480 }}>
        <h2>Business Profile</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <label>
            <span>Business Name</span>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </label>
          <label>
            <span>Full Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            <span>Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} required />
          </label>
          <button className="button button--dark" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <p className="dash-login__notice">Saved.</p>}
        </form>
      </div>
    </div>
  )
}
