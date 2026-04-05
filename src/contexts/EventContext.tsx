import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  findActiveEventForTeamByDate,
  getEventMatches,
  getTeamMatches,
  findUpcomingMatchForTeam,
  getCurrentFTCSeason,
} from '@/services/ftcscout'
import type { EventContext, FTCEvent, FTCMatch } from '@/types'

interface EventContextValue extends EventContext {
  loadEventContext: (teamNumber: number, date?: Date) => Promise<void>
  overrideEvent: (event: FTCEvent) => Promise<void>
  overrideMatch: (match: FTCMatch) => void
  clearOverride: () => void
}

const EventCtx = createContext<EventContextValue | null>(null)

const defaultContext: EventContext = {
  event: null,
  matches: [],
  teamMatches: [],
  upcomingMatch: null,
  upcomingMatchAlliance: null,
  loading: false,
  error: null,
  season: getCurrentFTCSeason(),
  manualOverride: false,
}

export function EventContextProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<EventContext>(defaultContext)

  const loadEventContext = useCallback(async (teamNumber: number, date: Date = new Date()) => {
    setCtx((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { event, season } = await findActiveEventForTeamByDate(teamNumber, date)
      if (!event) {
        setCtx((prev) => ({ ...prev, loading: false, event: null, season }))
        return
      }

      const [allMatches, teamMatchParticipations] = await Promise.all([
        getEventMatches(season, event.code),
        getTeamMatches(teamNumber, season, event.code),
      ])

      const { match: upcomingMatch, alliance } = findUpcomingMatchForTeam(
        allMatches,
        teamMatchParticipations,
      )

      setCtx({
        event,
        matches: allMatches,
        teamMatches: teamMatchParticipations,
        upcomingMatch,
        upcomingMatchAlliance: alliance,
        loading: false,
        error: null,
        season,
        manualOverride: false,
      })
    } catch (err) {
      setCtx((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load event context',
      }))
    }
  }, [])

  const overrideEvent = useCallback(async (event: FTCEvent) => {
    setCtx((prev) => ({ ...prev, loading: true, error: null, manualOverride: true }))
    try {
      const season = event.season
      const [allMatches, teamMatchParticipations] = await Promise.all([
        getEventMatches(season, event.code),
        // We need the team number but don't have it here; caller must call loadEventContext
        // For the override flow, we reload with no team filtering
        Promise.resolve([]),
      ])

      const { match: upcomingMatch, alliance } = findUpcomingMatchForTeam(
        allMatches,
        teamMatchParticipations,
      )

      setCtx({
        event,
        matches: allMatches,
        teamMatches: teamMatchParticipations,
        upcomingMatch,
        upcomingMatchAlliance: alliance,
        loading: false,
        error: null,
        season,
        manualOverride: true,
      })
    } catch (err) {
      setCtx((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load event',
      }))
    }
  }, [])

  const overrideMatch = useCallback((match: FTCMatch) => {
    setCtx((prev) => {
      const participation = prev.teamMatches.find((p) => p.matchId === match.id)
      return {
        ...prev,
        upcomingMatch: match,
        upcomingMatchAlliance: participation?.alliance ?? prev.upcomingMatchAlliance,
        manualOverride: true,
      }
    })
  }, [])

  const clearOverride = useCallback(() => {
    setCtx((prev) => ({ ...prev, manualOverride: false }))
  }, [])

  return (
    <EventCtx.Provider value={{ ...ctx, loadEventContext, overrideEvent, overrideMatch, clearOverride }}>
      {children}
    </EventCtx.Provider>
  )
}

export function useEventContext() {
  const ctx = useContext(EventCtx)
  if (!ctx) throw new Error('useEventContext must be used within EventContextProvider')
  return ctx
}
