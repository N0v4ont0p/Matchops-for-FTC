import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart2 } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { getReconHistoryForEvent } from '@/services/firestore'
import type { ReconEntry } from '@/types'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface TeamSummary {
  teamNumber: number
  entries: ReconEntry[]
  matchesObserved: number
  avgAutoScored: number
  avgTeleopTotal: number
  avgParkPoints: number
}

function buildSummaries(entries: ReconEntry[]): TeamSummary[] {
  const byTeam = new Map<number, ReconEntry[]>()
  for (const e of entries) {
    if (!byTeam.has(e.teamNumber)) byTeam.set(e.teamNumber, [])
    byTeam.get(e.teamNumber)!.push(e)
  }

  const avg = (vals: number[]) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0

  return Array.from(byTeam.entries()).map(([teamNumber, ents]) => ({
    teamNumber,
    entries: ents,
    matchesObserved: ents.length,
    avgAutoScored: avg(ents.map((e) => e.autoScored ?? 0)),
    avgTeleopTotal: avg(ents.map((e) => (e.teleopNearScored ?? 0) + (e.teleopFarScored ?? 0))),
    avgParkPoints: avg(ents.map((e) => e.parkPoints ?? 0)),
  })).sort((a, b) => b.matchesObserved - a.matchesObserved)
}

export default function TeamIntelPage() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const { event, season } = useEventContext()
  const [allEntries, setAllEntries] = useState<ReconEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)

  useEffect(() => {
    if (!workspace || !event) return
    setLoading(true)
    getReconHistoryForEvent(workspace.teamId, season, event.code)
      .then(setAllEntries)
      .finally(() => setLoading(false))
  }, [workspace, event, season])

  const summaries = buildSummaries(allEntries)

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
        <BarChart2 size={20} className="text-accent" />
        <h1 className="text-xl font-bold text-ink">{t('teamIntel.title')}</h1>
        {event && <span className="text-sm text-ink-secondary">{event.name}</span>}
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 size={32} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">{t('teamIntel.noData')}</p>
        </div>
      ) : (
        <>
          {/* Summary table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-3">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {t('teamIntel.teamNumber')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {t('teamIntel.matchesObserved')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {t('teamIntel.avgAutoScore')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {t('teamIntel.avgTeleopScore')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {t('teamIntel.avgParkPoints')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {summaries.map((s) => (
                    <>
                      <tr
                        key={s.teamNumber}
                        className="hover:bg-surface-3 cursor-pointer transition-colors"
                        onClick={() => setExpandedTeam(expandedTeam === s.teamNumber ? null : s.teamNumber)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-ink">#{s.teamNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-ink-secondary">{s.matchesObserved}</td>
                        <td className="px-4 py-3 text-center font-mono text-ink">{s.avgAutoScored.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono text-ink">{s.avgTeleopTotal.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono text-ink">{s.avgParkPoints.toFixed(1)}</td>
                      </tr>
                      {expandedTeam === s.teamNumber && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-surface-1 border-t border-surface-border">
                            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                              {t('teamIntel.observations')}
                            </p>
                            <div className="space-y-2">
                              {s.entries.map((e) => (
                                <div key={e.id} className="flex items-start gap-3 text-xs">
                                  <Badge variant={e.allianceColor === 'Red' ? 'red' : 'blue'}>
                                    {e.matchLabel}
                                  </Badge>
                                  <span className="text-ink-secondary flex-1">
                                    {e.notes || '(no notes)'}
                                  </span>
                                  <span className="text-ink-muted shrink-0">{e.scouterName}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
