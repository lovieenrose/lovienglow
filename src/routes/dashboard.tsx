import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  Boxes,
  LogOut,
  Mail,
  PackagePlus,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { getBusinessProfileFn, ownerLogoutFn, verifyOwnerFn } from '@/lib/serverFunctions'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex,nofollow' }],
  }),
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/dashboard/login') return
    const { valid } = await verifyOwnerFn()
    if (!valid) throw redirect({ to: '/dashboard/login' })
  },
  loader: async ({ location }) => {
    if (location.pathname === '/dashboard/login') return null
    return getBusinessProfileFn()
  },
  component: DashboardLayout,
})

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, exact: true },
  { to: '/dashboard/pos', label: 'Sales (POS)', icon: ShoppingCart },
  { to: '/dashboard/incoming-stock', label: 'Incoming Stock', icon: PackagePlus },
  { to: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { to: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { to: '/dashboard/customers', label: 'Customers', icon: Users },
  { to: '/dashboard/emails', label: 'Emails', icon: Mail },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const profile = Route.useLoaderData()

  if (location.pathname === '/dashboard/login') {
    return <Outlet />
  }

  const handleLogout = async () => {
    await getSupabaseBrowserClient().auth.signOut()
    await ownerLogoutFn()
    navigate({ to: '/dashboard/login' })
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__brand">
          {profile?.logo_url ? <img src={profile.logo_url} alt={profile.business_name} /> : 'Invory'}
        </div>
        <nav className="dash-sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} className={`dash-nav-link ${active ? 'is-active' : ''}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <button className="dash-sidebar__logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </aside>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  )
}
