import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { searchEvents, getCurrentFTCSeason } from '@/services/ftcscout'
import { useEventContext } from '@/contexts/EventContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { getTeamMatches } from '@/services/ftcscout'
import type { FTCEvent } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
}

export default function EventSelectorModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { overrideEvent } = useEventContext()
  const { workspace } = useWorkspace()
  const [query, setQuery] = useState('')
  const [events, setEvents] = useState<FTCEvent[]>([])
  const [loading, setLoading] = useState(false)

  const season = getCurrentFTCSeason()

  useEffect(() => {
    if (!open) return
    const doSearch = async () => {
      setLoading(true)
      try {
        const results = await searchEvents(season, query || undefined, 30)
        setEvents(results)
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(doSearch, 300)
    return () => clearTimeout(timeout)
  }, [open, query, season])

  const handleSelect = async (event: FTCEvent) => {
    if (workspace?.teamNumber) {
      const teamM = await getTeamMatches(workspace.teamNumber, event.season, event.code).catch(() => [])
      void teamM
    }
    overrideEvent(event)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('recon.selectEvent')} size="md">
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          className="input-field pl-8"
          placeholder={t('recon.searchEvents')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && events.length === 0 && (
        <p className="text-center text-sm text-ink-muted py-8">{t('common.noResults')}</p>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {events.map((ev) => (
            <button
              key={ev.code}
              onClick={() => handleSelect(ev)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors border border-transparent hover:border-surface-border group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors truncate">
                    {ev.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {ev.city}, {ev.country} · {formatDate(ev.start)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="muted">{ev.type}</Badge>
                  <span className="font-mono text-2xs text-ink-disabled">{ev.code}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
