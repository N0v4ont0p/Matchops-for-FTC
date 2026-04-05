import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Settings, Lock, Globe, LogOut } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { getWorkspaceMembers } from '@/services/firestore'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { WorkspaceMember, SupportedLanguage } from '@/types'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">{title}</h2>
      <div className="card divide-y divide-surface-border">{children}</div>
    </div>
  )
}

function Row({ label, value, action }: { label: string; value?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-4 first:rounded-t-xl last:rounded-b-xl">
      <span className="text-sm text-ink-secondary">{label}</span>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm font-medium text-ink">{value}</span>}
        {action}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { workspace, updateLanguage } = useWorkspace()
  const { user, signOut } = useAuth()
  const [members, setMembers] = useState<WorkspaceMember[]>([])

  useEffect(() => {
    if (!workspace) return
    getWorkspaceMembers(workspace.teamId).then(setMembers).catch(() => {})
  }, [workspace])

  if (!workspace || !user) return null

  async function handleLangChange(lang: string) {
    await updateLanguage(lang as SupportedLanguage)
    await i18n.changeLanguage(lang)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={20} className="text-accent" />
        <h1 className="text-xl font-bold text-ink">{t('settings.title')}</h1>
      </div>

      {/* Workspace Identity */}
      <Section title={t('settings.workspace')}>
        <Row
          label={t('settings.teamNumber')}
          value={
            <span className="flex items-center gap-2">
              <span className="font-mono">#{workspace.teamNumber}</span>
              <Lock size={12} className="text-ink-muted" />
            </span>
          }
        />
        <Row
          label={t('settings.teamName')}
          value={
            <span className="flex items-center gap-2">
              {workspace.teamName}
              <Lock size={12} className="text-ink-muted" />
            </span>
          }
        />
        <Row
          label={t('settings.workspaceId')}
          value={<span className="font-mono text-xs text-ink-muted">{workspace.teamId}</span>}
        />
      </Section>

      {/* Language */}
      <Section title={t('settings.language')}>
        <div className="py-3.5 px-4">
          <div className="flex items-center gap-3 mb-3">
            <Globe size={15} className="text-ink-secondary" />
            <span className="text-sm text-ink-secondary">{t('settings.displayLanguage')}</span>
          </div>
          <div className="flex gap-2">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleLangChange(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  i18n.language === opt.value
                    ? 'bg-accent text-white border-accent'
                    : 'border-surface-border text-ink-secondary hover:border-accent hover:text-accent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title={t('settings.account')}>
        <Row
          label={t('settings.displayName')}
          value={user.displayName || '—'}
        />
        <Row
          label={t('settings.email')}
          value={<span className="text-xs">{user.email}</span>}
        />
        {user.photoURL && (
          <Row
            label={t('settings.avatar')}
            value={
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-surface-border"
              />
            }
          />
        )}
      </Section>

      {/* Members */}
      {members && members.length > 0 && (
        <Section title={t('settings.members')}>
          {members.map((m: WorkspaceMember) => (
            <Row
              key={m.uid}
              label={m.displayName}
              value={
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">{m.email}</span>
                  {m.role === 'owner' && <Badge variant="blue">{m.role}</Badge>}
                </span>
              }
            />
          ))}
        </Section>
      )}

      {/* Danger */}
      <Section title={t('settings.session')}>
        <div className="py-3.5 px-4">
          <Button
            variant="ghost"
            onClick={signOut}
            icon={<LogOut size={15} />}
            className="text-status-error hover:bg-status-error hover:bg-opacity-10 hover:text-status-error border-status-error border-opacity-30"
          >
            {t('settings.signOut')}
          </Button>
        </div>
      </Section>

      <p className="text-center text-xs text-ink-muted mt-8">
        {t('settings.workspaceImmutableNotice')}
      </p>
    </div>
  )
}
