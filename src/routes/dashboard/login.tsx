import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { ownerEstablishSessionFn } from '@/lib/serverFunctions'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

export const Route = createFileRoute('/dashboard/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [fullName, setFullName] = useState('')
  const [currency, setCurrency] = useState('PHP')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      if (mode === 'sign_up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { business_name: businessName, full_name: fullName } },
        })
        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }
        if (!data.session) {
          setNotice('Account created. Check your email to confirm, then sign in.')
          setMode('sign_in')
          setLoading(false)
          return
        }
        await ownerEstablishSessionFn({
          data: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            fallbackName: businessName || fullName,
            businessType,
            currency,
          },
        })
        navigate({ to: '/dashboard' })
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.session) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }
      await ownerEstablishSessionFn({
        data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token },
      })
      navigate({ to: '/dashboard' })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="dash-login">
      <form className="dash-login__card" onSubmit={handleSubmit}>
        <div className="dash-login__icon">
          <Lock size={20} />
        </div>
        <h1>Invory</h1>
        <p>{mode === 'sign_in' ? 'Sign in to manage your business.' : 'Create your business account.'}</p>

        {mode === 'sign_up' && (
          <>
            <label>
              <span>Business Name</span>
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Business Type</span>
              <input
                type="text"
                placeholder="e.g. Retail, Wholesale, Skincare Clinic"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
              />
            </label>
            <label>
              <span>Your Full Name</span>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
            <label>
              <span>Currency</span>
              <input
                type="text"
                placeholder="PHP"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                required
              />
            </label>
          </>
        )}

        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="dash-login__error">{error}</p>}
        {notice && <p className="dash-login__notice">{notice}</p>}

        <button className="button button--dark button--wide" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="spin" size={14} /> {mode === 'sign_in' ? 'Signing in…' : 'Creating account…'}
            </>
          ) : mode === 'sign_in' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>

        <button
          type="button"
          className="dash-login__switch"
          onClick={() => {
            setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')
            setError('')
            setNotice('')
          }}
        >
          {mode === 'sign_in' ? "Don't have a business account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
