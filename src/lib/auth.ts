import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { getSession, useSession } from '@tanstack/react-start/server'

export interface OwnerSessionData {
  accessToken: string
  refreshToken: string
}

export function ownerSessionConfig() {
  const password = process.env.ADMIN_SECRET
  if (!password || password.length < 32) {
    throw new Error('ADMIN_SECRET must be set to a random string of at least 32 characters')
  }
  return {
    password,
    name: 'lng_owner_session',
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    },
  }
}

// SessionManager: supports update()/clear() — use for login/logout.
export async function getOwnerSessionManager() {
  return useSession<OwnerSessionData>(ownerSessionConfig())
}

// Read-only session snapshot — use for auth checks.
export async function getOwnerSession() {
  return getSession<OwnerSessionData>(ownerSessionConfig())
}

function anonClient(accessToken?: string): SupabaseClient<any, any, any> {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  })
}

// Called after client-side supabase.auth.signInWithPassword()/signUp() succeeds,
// to mirror the session into an httpOnly cookie so SSR route guards and server
// functions can build a request-scoped, RLS-respecting Supabase client.
export async function establishOwnerSession(accessToken: string, refreshToken: string): Promise<User> {
  const supabase = anonClient(accessToken)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Invalid session')
  const session = await getOwnerSessionManager()
  await session.update({ accessToken, refreshToken })
  return data.user
}

export async function clearOwnerSession() {
  const session = await getOwnerSessionManager()
  await session.clear()
}

export interface OwnerContext {
  ownerId: string
  supabase: SupabaseClient<any, any, any>
}

// Returns a Supabase client authenticated as the logged-in owner (their JWT is
// attached), so every query automatically respects Row-Level Security. Also
// returns their auth.uid() for use as owner_id on inserts.
export async function requireOwner(): Promise<OwnerContext> {
  const session = await getOwnerSession()
  const tokens = session.data
  if (!tokens?.accessToken) throw new Error('Not authenticated')

  let supabase = anonClient(tokens.accessToken)
  let { data, error } = await supabase.auth.getUser()

  if ((error || !data.user) && tokens.refreshToken) {
    const refreshClient = anonClient()
    const { data: refreshed, error: refreshError } = await refreshClient.auth.refreshSession({
      refresh_token: tokens.refreshToken,
    })
    if (refreshError || !refreshed.session) throw new Error('Not authenticated')

    const manager = await getOwnerSessionManager()
    await manager.update({
      accessToken: refreshed.session.access_token,
      refreshToken: refreshed.session.refresh_token,
    })

    supabase = anonClient(refreshed.session.access_token)
    const retry = await supabase.auth.getUser()
    data = retry.data
    error = retry.error
  }

  if (error || !data.user) throw new Error('Not authenticated')
  return { ownerId: data.user.id, supabase }
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  try {
    await requireOwner()
    return true
  } catch {
    return false
  }
}
