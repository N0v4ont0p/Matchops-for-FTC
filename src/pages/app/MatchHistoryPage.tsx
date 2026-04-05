import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { getReconHistoryForEvent } from '@/services/firestore'
import { buildMatchLabel } from '@/services/ftcscout'
import type { ReconEntry } from '@/types'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function MatchHistoryPage() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const { event, matches, teamMatches, season } = useEventContext()
  const [allEntries, setAllEntries] = useState<ReconEntry[]>([])
  const [loading, setLoading] = useState(false)

  const teamMatchIds = new Set(teamMatches.map((p) => p.matchId))
  const playedTeamMatches = matches.filter((m) => teamMatchIds.has(m.id) && m.hasBeenPlayed)

  useEffect(() => {
    if (!workspace || !event) return
    setLoading(true)
    getReconHistoryForEvent(workspace.teamId, season, event.code)
      .then(setAllEntries)
      .finally(() => setLoading(false))
  }, [workspace, event, season])

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <History size={20} className="text-accent" />
        <h1 className="text-xl font-bold text-ink">{t('recon.matchHistory')}</h1>
        {event && <span className="text-sm text-ink-secondary">{event.name}</span>}
      </div>

      {playedTeamMatches.length === 0 ? (
        <div className="text-center py-16">
          <History size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">No match history yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {playedTeamMatches.map((match) => {
            const label = buildMatchLabel(match)
            const participation = teamMatches.find((p) => p.matchId === match.id)
            const matchEntries = allEntries.filter((e) => e.matchId === match.id)

            return (
              <div key={match.id} className="card p-4">
                {/* Match header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm font-bold text-ink">{label}</span>
                  {participation && (
                    <Badge variant={participation.alliance === 'Red' ? 'red' : 'blue'}>
                      {participation.alliance}
                    </Badge>
                  )}
                  <Badge variant="muted">{match.tournamentLevel}</Badge>
                  <span className="text-xs text-ink-muted ml-auto">{matchEntries.length} entries</span>
                </div>

                {/* Teams in match */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {match.teams?.map((tm) => (
                    <span
                      key={`${tm.alliance}-${tm.teamNumber}`}
                      className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        tm.alliance === 'Red'
                          ? 'bg-alliance-red-dim text-alliance-red'
                          : 'bg-alliance-blue-dim text-alliance-blue'
                      }`}
                    >
                      {tm.teamNumber}
                    </span>
                  ))}
                </div>

                {/* Scouting entries summary */}
                {matchEntries.length > 0 && (
                  <div className="border-t border-surface-border pt-3 mt-1 space-y-2">
                    {matchEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 text-xs">
                        <Badge variant={entry.allianceColor === 'Red' ? 'red' : 'blue'}>
                          #{entry.teamNumber}
                        </Badge>
                        <span className="text-ink-secondary">
                          Auto: <span className="text-ink">{entry.autoScored}</span> ·
                          Teleop: <span className="text-ink">{(entry.teleopNearScored ?? 0) + (entry.teleopFarScored ?? 0)}</span> ·
                          Park: <span className="text-ink">{entry.parkPoints}</span>
                        </span>
                        <span className="text-ink-muted ml-auto">{entry.scouterName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
