import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { getBusinessProfileFn, updateBusinessProfileFn, uploadBusinessLogoFn } from '@/lib/serverFunctions'
import { ImageUploaderSingle } from '@/components/ImageUploader'

export const Route = createFileRoute('/dashboard/settings')({
  loader: () => getBusinessProfileFn(),
  component: SettingsPage,
})

function SettingsPage() {
  const profile = Route.useLoaderData()
  const router = useRouter()
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [businessType, setBusinessType] = useState(profile?.business_type ?? '')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'PHP')
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await updateBusinessProfileFn({ data: { businessName, businessType, fullName, currency } })
    await router.invalidate()
    setSaving(false)
    setSaved(true)
  }

  const uploadLogo = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const result = reader.result as string
          const base64 = result.slice(result.indexOf(',') + 1)
          const updated = await uploadBusinessLogoFn({ data: { filename: file.name, contentType: file.type, base64 } })
          resolve(updated.logo_url ?? '')
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleLogoChange = async (url: string) => {
    setLogoUrl(url)
    if (!url) {
      // A non-empty url just came from uploadLogo(), which already persisted
      // it server-side — only an explicit removal needs its own save.
      await updateBusinessProfileFn({ data: { businessName, businessType, fullName, currency, logoUrl: null } })
    }
    await router.invalidate()
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Settings</h1>
      <div className="dash-panel" style={{ maxWidth: 480 }}>
        <h2>Business Profile</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <label>
            <span>Company Logo</span>
            <ImageUploaderSingle value={logoUrl} onChange={handleLogoChange} upload={uploadLogo} alt="Company logo" />
          </label>
          <p className="dash-field__hint">Shown in the sidebar and on printed invoices. JPEG, PNG, or WebP, up to 5MB.</p>

          <label>
            <span>Business Name</span>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </label>
          <label>
            <span>Business Type</span>
            <input
              placeholder="e.g. Retail, Wholesale, Skincare Clinic"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
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
