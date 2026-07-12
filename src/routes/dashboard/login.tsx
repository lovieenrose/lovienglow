import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { adminLoginFn } from '@/lib/serverFunctions'

export const Route = createFileRoute('/dashboard/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await adminLoginFn({ data: { email, password } })
      if (!result.success) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }
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
        <h1>LovieNGlow Admin</h1>
        <p>Sign in to manage orders.</p>
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
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="dash-login__error">{error}</p>}
        <button className="button button--dark button--wide" type="submit" disabled={loading}>
          {loading ? <><Loader2 className="spin" size={14} /> Signing in…</> : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
