import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, RefreshCw, AlertCircle, ChevronDown, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { buildMatchLabel } from '@/services/ftcscout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EventSelectorModal from './EventSelectorModal'
import MatchSelectorModal from './MatchSelectorModal'
import { formatDate } from '@/utils/format'

export default function MatchContextBar() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const {
    event,
    upcomingMatch,
    upcomingMatchAlliance,
    loading,
    error,
    manualOverride,
    loadEventContext,
  } = useEventContext()

  const [showEventModal, setShowEventModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)

  const handleRefresh = () => {
    if (workspace?.teamNumber) {
      loadEventContext(workspace.teamNumber)
    }
  }

  const matchLabel = upcomingMatch ? buildMatchLabel(upcomingMatch) : null

  return (
    <>
      <div className="bg-surface-1 border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-ink-secondary text-sm">
              <Spinner size="sm" />
              <span>{t('recon.autoDetecting')}</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center gap-2 text-status-danger text-sm">
              <AlertCircle size={14} />
              <span>{t('errors.ftcscoutUnavailable')}</span>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw size={13} />
                {t('common.retry')}
              </Button>
            </div>
          )}

          {/* Event context */}
          {!loading && !error && (
            <>
              {/* Event */}
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={13} className="text-ink-muted shrink-0" />
                {event ? (
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center gap-1 text-sm font-medium text-ink hover:text-accent transition-colors min-w-0 group"
                  >
                    <span className="truncate max-w-[220px]">{event.name}</span>
                    <ChevronDown size={12} className="shrink-0 text-ink-muted group-hover:text-accent" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    {t('recon.noActiveEvent')}
                  </button>
                )}
              </div>

              {event && (
                <>
                  <div className="w-px h-4 bg-surface-border shrink-0" />

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Calendar size={12} />
                    <span>{formatDate(event.start)}</span>
                    {event.start !== event.end && (
                      <>
                        <span>–</span>
                        <span>{formatDate(event.end)}</span>
                      </>
                    )}
                  </div>

                  <div className="w-px h-4 bg-surface-border shrink-0" />

                  {/* Match */}
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-accent-bright shrink-0" />
                    {matchLabel ? (
                      <button
                        onClick={() => setShowMatchModal(true)}
                        className="flex items-center gap-1 group"
                      >
                        <span className="font-mono text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {matchLabel}
                        </span>
                        <ChevronDown size={12} className="text-ink-muted group-hover:text-accent" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowMatchModal(true)}
                        className="text-sm text-ink-muted hover:text-ink transition-colors"
                      >
                        {t('recon.noUpcomingMatch')}
                      </button>
                    )}
                  </div>

                  {/* Alliance badge */}
                  {upcomingMatchAlliance && (
                    <Badge variant={upcomingMatchAlliance === 'Red' ? 'red' : 'blue'}>
                      {upcomingMatchAlliance}
                    </Badge>
                  )}

                  {/* Manual override indicator */}
                  {manualOverride && (
                    <Badge variant="warning">{t('common.manual')}</Badge>
                  )}
                </>
              )}

              {/* FTCScout credit */}
              <div className="ml-auto flex items-center gap-1.5 text-2xs text-ink-disabled shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse-soft" />
                <span>{t('recon.connectFTCScout')}</span>
              </div>

              <button
                onClick={handleRefresh}
                className="p-1 rounded text-ink-muted hover:text-ink transition-colors"
                title={t('common.retry')}
              >
                <RefreshCw size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <EventSelectorModal open={showEventModal} onClose={() => setShowEventModal(false)} />
      <MatchSelectorModal open={showMatchModal} onClose={() => setShowMatchModal(false)} />
    </>
  )
}
