import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { subscribeToStrategy, upsertStrategy } from '@/services/firestore'
import type { MatchStrategy } from '@/types'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'

interface Props {
  seasonYear: number
  eventCode: string
  matchId: number
  matchLabel: string
}

const FIELDS: { key: keyof MatchStrategy; labelKey: string; placeholderKey: string }[] = [
  { key: 'alliancePlan', labelKey: 'strategy.alliancePlan', placeholderKey: 'strategy.placeholder.alliancePlan' },
  { key: 'opponentThreats', labelKey: 'strategy.opponentThreats', placeholderKey: 'strategy.placeholder.opponentThreats' },
  { key: 'keyWinCondition', labelKey: 'strategy.keyWinCondition', placeholderKey: 'strategy.placeholder.keyWinCondition' },
  { key: 'backupPlan', labelKey: 'strategy.backupPlan', placeholderKey: 'strategy.placeholder.backupPlan' },
  { key: 'roleAssignment', labelKey: 'strategy.roleAssignment', placeholderKey: 'strategy.placeholder.roleAssignment' },
  { key: 'sharedReminders', labelKey: 'strategy.sharedReminders', placeholderKey: 'strategy.placeholder.sharedReminders' },
]

export default function StrategyPanel({ seasonYear, eventCode, matchId, matchLabel }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const [strategy, setStrategy] = useState<MatchStrategy | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!workspace) return
    const unsub = subscribeToStrategy(
      workspace.teamId,
      seasonYear,
      eventCode,
      matchId,
      (s) => {
        setStrategy(s)
        if (s) {
          setDraft({
            alliancePlan: s.alliancePlan ?? '',
            opponentThreats: s.opponentThreats ?? '',
            keyWinCondition: s.keyWinCondition ?? '',
            backupPlan: s.backupPlan ?? '',
            roleAssignment: s.roleAssignment ?? '',
            sharedReminders: s.sharedReminders ?? '',
          })
        }
      },
    )
    return unsub
  }, [workspace, seasonYear, eventCode, matchId])

  const autosave = useCallback(
    (newDraft: Record<string, string>) => {
      if (!workspace || !user) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaved(false)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        try {
          await upsertStrategy(workspace.teamId, {
            ...newDraft,
            matchLabel,
            matchId,
            eventCode,
            season: seasonYear,
            lastUpdatedBy: user.uid,
            lastUpdatedByName: user.displayName ?? user.email ?? 'Scout',
          } as Parameters<typeof upsertStrategy>[1])
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [workspace, user, matchLabel, matchId, eventCode, seasonYear],
  )

  const handleChange = (key: string, value: string) => {
    const newDraft = { ...draft, [key]: value }
    setDraft(newDraft)
    autosave(newDraft)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t('strategy.title')}</h3>
        <div className="flex items-center gap-1.5 text-xs">
          {saving && (
            <>
              <Spinner size="sm" className="text-ink-muted" />
              <span className="text-ink-muted">{t('strategy.savingDraft')}</span>
            </>
          )}
          {saved && !saving && (
            <>
              <CheckCircle2 size={12} className="text-status-success" />
              <span className="text-status-success">{t('strategy.saved')}</span>
            </>
          )}
          {strategy?.lastUpdatedByName && !saving && !saved && (
            <span className="text-ink-disabled">
              {t('strategy.lastUpdatedBy')} {strategy.lastUpdatedByName}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, labelKey, placeholderKey }) => (
          <Textarea
            key={key}
            label={t(labelKey)}
            value={draft[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={t(placeholderKey)}
            rows={3}
          />
        ))}
      </div>
    </div>
  )
}
