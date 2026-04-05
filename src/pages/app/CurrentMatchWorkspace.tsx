import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Wifi, WifiOff } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { subscribeToReconEntries } from '@/services/firestore'
import { buildMatchLabel } from '@/services/ftcscout'
import type { ReconEntry } from '@/types'
import AlliancePanel from '@/components/recon/AlliancePanel'
import ReconEntryPanel from '@/components/recon/ReconEntryPanel'
import StrategyPanel from '@/components/recon/StrategyPanel'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

export default function CurrentMatchWorkspace() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const {
    event,
    upcomingMatch,
    upcomingMatchAlliance,
    teamMatches,
    loading: ctxLoading,
    season,
  } = useEventContext()

  const [entries, setEntries] = useState<ReconEntry[]>([])

  const matchId = upcomingMatch?.id
  const eventCode = event?.code
  const matchLabel = upcomingMatch ? buildMatchLabel(upcomingMatch) : ''

  // Realtime recon entries subscription
  useEffect(() => {
    if (!workspace || !matchId || !eventCode) return
    const unsub = subscribeToReconEntries(
      workspace.teamId,
      season,
      eventCode,
      matchId,
      setEntries,
    )
    return unsub
  }, [workspace, matchId, eventCode, season])

  if (ctxLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!event || !upcomingMatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-3 border border-surface-border flex items-center justify-center mb-4">
          <Users size={24} className="text-ink-muted" />
        </div>
        <h2 className="text-base font-semibold text-ink mb-2">{t('recon.noUpcomingMatch')}</h2>
        <p className="text-sm text-ink-secondary max-w-xs">
          {!event
            ? t('recon.noActiveEvent')
            : 'All matches have been played for this event.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Match header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-2xl font-extrabold text-ink">{matchLabel}</span>
            <Badge variant="accent">{upcomingMatch.tournamentLevel}</Badge>
            {upcomingMatchAlliance && (
              <Badge variant={upcomingMatchAlliance === 'Red' ? 'red' : 'blue'}>
                {upcomingMatchAlliance} Alliance
              </Badge>
            )}
          </div>
          <p className="text-sm text-ink-secondary truncate max-w-sm">{event.name}</p>
        </div>

        {/* Live sync indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-status-success-dim border border-status-success/20 text-status-success font-medium">
            <Wifi size={11} />
            {t('recon.syncLive')}
          </div>
          <span className="text-ink-muted font-mono text-xs">{entries.length} entries</span>
        </div>
      </div>

      {/* Alliance composition */}
      <div>
        <p className="section-header">Alliance Composition</p>
        <AlliancePanel
          match={upcomingMatch}
          yourTeamNumber={workspace?.teamNumber ?? 0}
          teamMatches={teamMatches}
          highlighted
        />
      </div>

      {/* Two-column layout for tablet+ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recon entries */}
        <div className="lg:col-span-3">
          <div className="card p-4">
            <ReconEntryPanel
              entries={entries}
              seasonYear={season}
              eventCode={eventCode!}
              matchId={matchId!}
              matchLabel={matchLabel}
            />
          </div>
        </div>

        {/* Strategy panel */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <StrategyPanel
              seasonYear={season}
              eventCode={eventCode!}
              matchId={matchId!}
              matchLabel={matchLabel}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
