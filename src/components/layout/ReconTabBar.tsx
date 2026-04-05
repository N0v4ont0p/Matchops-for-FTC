import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

// Tab bar used inside Recon Mode for sub-navigation
const tabs = [
  { key: 'dashboard', label: 'recon.dashboard', path: '/app/recon' },
  { key: 'current', label: 'recon.currentMatch', path: '/app/recon/match' },
  { key: 'history', label: 'recon.matchHistory', path: '/app/recon/history' },
  { key: 'intel', label: 'recon.teamIntel', path: '/app/recon/intel' },
] as const

export default function ReconTabBar() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-1 px-4 border-b border-surface-border bg-surface-1 shrink-0">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.path}
          end={tab.key === 'dashboard'}
          className={({ isActive }) =>
            clsx(
              'px-3 py-3 text-sm font-medium border-b-2 transition-all duration-150 -mb-px',
              isActive
                ? 'border-accent text-accent-bright'
                : 'border-transparent text-ink-secondary hover:text-ink',
            )
          }
        >
          {t(tab.label)}
        </NavLink>
      ))}
    </div>
  )
}
