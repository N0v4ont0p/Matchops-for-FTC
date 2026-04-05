import { useTranslation } from 'react-i18next'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { buildMatchLabel } from '@/services/ftcscout'
import type { FTCMatch } from '@/types'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'

interface Props {
  open: boolean
  onClose: () => void
}

export default function MatchSelectorModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { matches, teamMatches, overrideMatch } = useEventContext()
  const { workspace } = useWorkspace()

  const teamMatchIds = new Set(teamMatches.map((p) => p.matchId))
  const participationMap = new Map(teamMatches.map((p) => [p.matchId, p]))

  const teamOnly = matches.filter((m) => teamMatchIds.has(m.id))
  const otherMatches = matches.filter((m) => !teamMatchIds.has(m.id))

  const handleSelect = (match: FTCMatch) => {
    overrideMatch(match)
    onClose()
  }

  const MatchRow = ({ match }: { match: FTCMatch }) => {
    const isTeamMatch = teamMatchIds.has(match.id)
    const participation = participationMap.get(match.id)
    const label = buildMatchLabel(match)

    return (
      <button
        onClick={() => handleSelect(match)}
        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors border border-transparent hover:border-surface-border group flex items-center gap-3"
      >
        <span className="font-mono text-sm font-semibold text-ink-secondary group-hover:text-accent w-16 shrink-0">
          {label}
        </span>
        <div className="flex items-center gap-2 flex-wrap flex-1">
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
        <div className="flex items-center gap-1.5 shrink-0">
          {match.hasBeenPlayed ? (
            <Badge variant="muted">Played</Badge>
          ) : (
            <Badge variant="success">Upcoming</Badge>
          )}
          {isTeamMatch && participation && (
            <Badge variant={participation.alliance === 'Red' ? 'red' : 'blue'}>
              #{workspace?.teamNumber}
            </Badge>
          )}
        </div>
      </button>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={t('recon.selectMatch')} size="lg">
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {teamOnly.length > 0 && (
          <div>
            <p className="section-header mb-2">Your Team's Matches</p>
            <div className="space-y-1">
              {teamOnly.map((m) => <MatchRow key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {otherMatches.length > 0 && (
          <div>
            <p className="section-header mb-2">All Matches</p>
            <div className="space-y-1">
              {otherMatches.slice(0, 40).map((m) => <MatchRow key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <p className="text-center text-sm text-ink-muted py-8">{t('common.noResults')}</p>
        )}
      </div>
    </Modal>
  )
}
