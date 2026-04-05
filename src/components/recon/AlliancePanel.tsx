import { clsx } from 'clsx'
import type { FTCMatch, FTCTeamMatchParticipation } from '@/types'
import { buildMatchLabel } from '@/services/ftcscout'

interface Props {
  match: FTCMatch
  yourTeamNumber: number
  teamMatches?: FTCTeamMatchParticipation[]
  highlighted?: boolean
  onClick?: () => void
}

export default function AlliancePanel({ match, yourTeamNumber, highlighted = false, onClick }: Props) {
  const redTeams = match.teams?.filter((t) => t.alliance === 'Red') ?? []
  const blueTeams = match.teams?.filter((t) => t.alliance === 'Blue') ?? []

  const yourAlliance = match.teams?.find((t) => t.teamNumber === yourTeamNumber)?.alliance

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden transition-all duration-150',
        highlighted ? 'border-accent/40 shadow-glow-accent' : 'border-surface-border',
        onClick && 'cursor-pointer hover:border-accent/30',
      )}
      onClick={onClick}
    >
      {/* Match label */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-3 border-b border-surface-border">
        <span className="font-mono text-sm font-bold text-ink">{buildMatchLabel(match)}</span>
        <span className="text-xs text-ink-muted capitalize">{match.tournamentLevel}</span>
      </div>

      <div className="grid grid-cols-2">
        {/* Red alliance */}
        <div className={clsx(
          'p-3 border-r border-surface-border',
          yourAlliance === 'Red' && 'bg-alliance-red-dim',
        )}>
          <p className="text-2xs font-semibold uppercase tracking-wide text-alliance-red mb-2">Red</p>
          {redTeams.map((tm) => (
            <div key={tm.teamNumber} className="flex items-center gap-2 mb-1">
              <span className={clsx(
                'font-mono text-sm font-medium',
                tm.teamNumber === yourTeamNumber ? 'text-alliance-red font-bold' : 'text-ink-secondary',
              )}>
                #{tm.teamNumber}
              </span>
              {tm.teamNumber === yourTeamNumber && (
                <span className="text-2xs bg-alliance-red-dim text-alliance-red px-1.5 py-0.5 rounded border border-alliance-red-border">
                  You
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Blue alliance */}
        <div className={clsx(
          'p-3',
          yourAlliance === 'Blue' && 'bg-alliance-blue-dim',
        )}>
          <p className="text-2xs font-semibold uppercase tracking-wide text-alliance-blue mb-2">Blue</p>
          {blueTeams.map((tm) => (
            <div key={tm.teamNumber} className="flex items-center gap-2 mb-1">
              <span className={clsx(
                'font-mono text-sm font-medium',
                tm.teamNumber === yourTeamNumber ? 'text-alliance-blue font-bold' : 'text-ink-secondary',
              )}>
                #{tm.teamNumber}
              </span>
              {tm.teamNumber === yourTeamNumber && (
                <span className="text-2xs bg-alliance-blue-dim text-alliance-blue px-1.5 py-0.5 rounded border border-alliance-blue-border">
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
