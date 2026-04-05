import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Crosshair,
  Wrench,
  Battery,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface NavItem {
  key: string
  label: string
  path: string
  icon: React.ReactNode
  accent?: boolean
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { workspace } = useWorkspace()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      key: 'recon',
      label: t('nav.recon'),
      path: '/app/recon',
      icon: <Crosshair size={17} />,
      accent: true,
    },
    { key: 'pit', label: t('nav.pit'), path: '/app/pit', icon: <Wrench size={17} /> },
    { key: 'batteries', label: t('nav.batteries'), path: '/app/batteries', icon: <Battery size={17} /> },
    { key: 'notes', label: t('nav.notes'), path: '/app/notes', icon: <FileText size={17} /> },
    { key: 'settings', label: t('nav.settings'), path: '/app/settings', icon: <Settings size={17} /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const NavItems = () => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.key}
          to={item.path}
          end={item.key === 'recon'}
          className={({ isActive }) =>
            clsx(
              isActive ? 'nav-item-active' : 'nav-item-inactive',
                item.accent && 'relative',
            )
          }
          onClick={() => setMobileOpen(false)}
        >
          {({ isActive }) => (
            <>
              <span className={clsx(isActive && item.accent && 'text-accent-bright')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.accent && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-bright" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-surface-border bg-surface-1">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-surface-border">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-muted border border-accent/20">
            <Crosshair size={14} className="text-accent-bright" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-ink tracking-tight">Matchops</span>
        </div>

        {/* Team badge */}
        {workspace && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-surface-3 border border-surface-border">
            <p className="text-2xs text-ink-muted uppercase tracking-wider font-semibold mb-0.5">
              {t('nav.team')}
            </p>
            <p className="text-sm font-semibold text-ink leading-tight truncate">
              #{workspace.teamNumber}
            </p>
            <p className="text-xs text-ink-secondary truncate">{workspace.teamName}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 p-3 mt-2">
          <NavItems />
        </nav>

        {/* User area */}
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-7 h-7 rounded-full ring-1 ring-surface-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center text-xs font-bold text-accent-bright">
                {(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink truncate">
                {user?.displayName ?? user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
              title={t('nav.signOut')}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-surface-1 border-b border-surface-border flex items-center px-4 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-muted border border-accent/20">
            <Crosshair size={14} className="text-accent-bright" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-ink">Matchops</span>
          {workspace && (
            <span className="text-xs text-ink-muted font-mono">#{workspace.teamNumber}</span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-3 transition-colors"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-14 bottom-0 w-64 bg-surface-1 border-r border-surface-border p-3 flex flex-col gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <NavItems />
            <div className="mt-auto pt-3 border-t border-surface-border">
              <button
                onClick={handleSignOut}
                className="nav-item-inactive w-full"
              >
                <LogOut size={16} />
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
