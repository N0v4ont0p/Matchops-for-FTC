import { useTranslation } from 'react-i18next'
import { ArrowRight, Crosshair, Clock, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useEventContext } from '@/contexts/EventContext'
import { buildMatchLabel } from '@/services/ftcscout'
import AlliancePanel from '@/components/recon/AlliancePanel'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/format'

export default function ReconDashboard() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const { event, upcomingMatch, upcomingMatchAlliance, matches, teamMatches, loading } = useEventContext()

  const teamMatchIds = new Set(teamMatches.map((p) => p.matchId))
  const teamOnlyMatches = matches.filter((m) => teamMatchIds.has(m.id))
  const playedMatches = teamOnlyMatches.filter((m) => m.hasBeenPlayed)
  const upcomingTeamMatches = teamOnlyMatches.filter((m) => !m.hasBeenPlayed)

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-muted border border-accent/20">
          <Crosshair size={18} className="text-accent-bright" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{t('recon.title')}</h1>
          {workspace && (
            <p className="text-sm text-ink-secondary">
              Team #{workspace.teamNumber} · {workspace.teamName}
            </p>
          )}
        </div>
      </div>

      {/* Event card */}
      {event && (
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <p className="section-header">{t('recon.activeEvent')}</p>
              <h2 className="text-base font-semibold text-ink leading-tight">{event.name}</h2>
              <p className="text-sm text-ink-secondary mt-0.5">{event.city}, {event.country}</p>
            </div>
            <Badge variant={event.ongoing ? 'success' : event.finished ? 'muted' : 'accent'}>
              {event.ongoing ? 'Ongoing' : event.finished ? 'Finished' : 'Upcoming'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(event.start)} – {formatDate(event.end)}
            </span>
            <span className="font-mono">{event.code}</span>
            <span>{event.type}</span>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Your Matches', value: teamOnlyMatches.length },
          { label: 'Played', value: playedMatches.length },
          { label: 'Remaining', value: upcomingTeamMatches.length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-ink font-mono">{value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming match */}
      {upcomingMatch && (
        <div>
          <p className="section-header">{t('recon.upcomingMatch')}</p>
          <div className="relative">
            <AlliancePanel
              match={upcomingMatch}
              yourTeamNumber={workspace?.teamNumber ?? 0}
              highlighted
            />
            <Link
              to="/app/recon/match"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-accent hover:bg-accent-bright transition-colors text-sm font-medium text-white"
            >
              Open Match Workspace
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Your schedule */}
      {teamOnlyMatches.length > 0 && (
        <div>
          <p className="section-header">Your Schedule</p>
          <div className="space-y-2">
            {teamOnlyMatches.slice(0, 6).map((match) => {
              const isUpcoming = !match.hasBeenPlayed
              const participation = teamMatches.find((p) => p.matchId === match.id)
              return (
                <div
                  key={match.id}
                  className="card px-4 py-3 flex items-center gap-3"
                >
                  <span className="font-mono text-sm font-bold text-ink w-16 shrink-0">
                    {buildMatchLabel(match)}
                  </span>
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {match.teams?.map((tm) => (
                      <span
                        key={`${tm.alliance}-${tm.teamNumber}`}
                        className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          tm.alliance === 'Red'
                            ? 'bg-alliance-red-dim text-alliance-red'
                            : 'bg-alliance-blue-dim text-alliance-blue'
                        } ${tm.teamNumber === workspace?.teamNumber ? 'font-bold ring-1 ring-current' : ''}`}
                      >
                        {tm.teamNumber}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {participation && (
                      <Badge variant={participation.alliance === 'Red' ? 'red' : 'blue'}>
                        {participation.alliance}
                      </Badge>
                    )}
                    <Badge variant={isUpcoming ? 'accent' : 'muted'}>
                      {isUpcoming ? 'Upcoming' : 'Played'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No event state */}
      {!event && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-3 border border-surface-border mb-4">
            <Clock size={24} className="text-ink-muted" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-2">{t('recon.noActiveEvent')}</h3>
          <p className="text-sm text-ink-secondary max-w-xs mx-auto">
            No event detected for your team. You can manually select one using the event picker above.
          </p>
        </div>
      )}
    </div>
  )
}
