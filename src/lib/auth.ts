import { getSession, useSession } from '@tanstack/react-start/server'

export interface AdminSessionData {
  email: string
}

export function adminSessionConfig() {
  const password = process.env.ADMIN_SECRET
  if (!password || password.length < 32) {
    throw new Error('ADMIN_SECRET must be set to a random string of at least 32 characters')
  }
  return {
    password,
    name: 'lng_admin_session',
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    },
  }
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  return Boolean(adminEmail && adminPassword && email === adminEmail && password === adminPassword)
}

// SessionManager: supports update()/clear() — use for login/logout.
export async function getAdminSessionManager() {
  return useSession<AdminSessionData>(adminSessionConfig())
}

// Read-only session snapshot — use for auth checks.
export async function getAdminSession() {
  return getSession<AdminSessionData>(adminSessionConfig())
}

export async function requireAdmin(): Promise<string> {
  const session = await getAdminSession()
  const email = session.data.email
  if (!email) throw new Error('Not authenticated')
  return email
}
