/**
 * FTCScout REST API Service
 * Base URL: https://api.ftcscout.org/rest/v1
 *
 * Documentation: https://ftcscout.org/api/rest
 *
 * This service is the ONLY place in Matchops that talks to FTCScout.
 * It is used exclusively for PUBLIC event/team/match structure.
 * Private scouting data is stored in Firestore, NOT here.
 */

import type {
  FTCTeam,
  FTCEvent,
  FTCMatch,
  FTCTeamEventParticipation,
  FTCTeamMatchParticipation,
} from '@/types'

const BASE_URL = 'https://api.ftcscout.org/rest/v1'
const DEFAULT_TIMEOUT_MS = 10_000

// ── Helpers ─────────────────────────────────────────────────────────────────

async function ftcFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const resp = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)

    if (resp.status === 404) {
      return null as unknown as T
    }
    if (!resp.ok) {
      throw new Error(`FTCScout API error: ${resp.status} ${resp.statusText}`)
    }
    return resp.json() as Promise<T>
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('FTCScout request timed out.')
    }
    throw err
  }
}

/**
 * Determine the FTC season year from a given date.
 * FTC seasons run ~August to April.
 * Season year = the year the season *starts*.
 * e.g. the 2025-2026 season is season "2025"
 */
export function getCurrentFTCSeason(date: Date = new Date()): number {
  const month = date.getMonth() + 1 // 1-indexed
  const year = date.getFullYear()
  return month >= 8 ? year : year - 1
}

/**
 * Build a human-readable match label from FTCScout match data.
 * Examples: "Q-13", "DE-R1M2", "Finals"
 */
export function buildMatchLabel(match: FTCMatch): string {
  const level = match.tournamentLevel
  const id = match.id
  const series = match.series

  switch (level) {
    case 'Quals':
      return `Q-${id}`
    case 'DoubleElim':
      return `DE-R${series}M${id}`
    case 'SemiFinals':
      return `SF-${series}M${id}`
    case 'Finals':
      return `F-${id}`
    case 'Playoffs':
      return `PO-${id}`
    default:
      return `M-${id}`
  }
}

// ── Team endpoints ──────────────────────────────────────────────────────────

/** GET /teams/:number */
export async function getTeamByNumber(number: number): Promise<FTCTeam | null> {
  return ftcFetch<FTCTeam>(`/teams/${number}`)
}

/** GET /teams/search */
export async function searchTeams(searchText: string, limit = 20): Promise<FTCTeam[]> {
  const result = await ftcFetch<FTCTeam[]>('/teams/search', {
    searchText,
    limit: String(limit),
  })
  return result ?? []
}

/** GET /teams/:number/events/:season */
export async function getTeamEventsBySeason(
  teamNumber: number,
  season: number,
): Promise<FTCTeamEventParticipation[]> {
  const result = await ftcFetch<FTCTeamEventParticipation[]>(
    `/teams/${teamNumber}/events/${season}`,
  )
  return result ?? []
}

/** GET /teams/:number/matches?season=&eventCode= */
export async function getTeamMatches(
  teamNumber: number,
  season?: number,
  eventCode?: string,
): Promise<FTCTeamMatchParticipation[]> {
  const params: Record<string, string> = {}
  if (season !== undefined) params.season = String(season)
  if (eventCode) params.eventCode = eventCode

  const result = await ftcFetch<FTCTeamMatchParticipation[]>(
    `/teams/${teamNumber}/matches`,
    params,
  )
  return result ?? []
}

// ── Event endpoints ─────────────────────────────────────────────────────────

/** GET /events/:season/:code */
export async function getEventBySeasonAndCode(
  season: number,
  code: string,
): Promise<FTCEvent | null> {
  return ftcFetch<FTCEvent>(`/events/${season}/${code}`)
}

/** GET /events/:season/:code/matches */
export async function getEventMatches(season: number, code: string): Promise<FTCMatch[]> {
  const result = await ftcFetch<FTCMatch[]>(`/events/${season}/${code}/matches`)
  return result ?? []
}

/** GET /events/search/:season */
export async function searchEvents(
  season: number,
  searchText?: string,
  limit = 30,
): Promise<FTCEvent[]> {
  const params: Record<string, string> = { limit: String(limit) }
  if (searchText) params.searchText = searchText
  const result = await ftcFetch<FTCEvent[]>(`/events/search/${season}`, params)
  return result ?? []
}

// ── Smart event detection ───────────────────────────────────────────────────

/**
 * Given a team number and a reference date, find the most relevant event
 * for that team.
 *
 * Priority:
 * 1. An event that is currently ongoing (started && !finished, today falls in [start, end])
 * 2. An event starting within the next 2 days (future)
 * 3. The most recently finished event within the last 3 days
 * 4. The soonest upcoming event in the season
 */
export async function findActiveEventForTeamByDate(
  teamNumber: number,
  date: Date = new Date(),
): Promise<{ event: FTCEvent | null; season: number }> {
  const season = getCurrentFTCSeason(date)
  const today = date.toISOString().slice(0, 10) // "YYYY-MM-DD"

  const participations = await getTeamEventsBySeason(teamNumber, season)
  if (!participations.length) {
    return { event: null, season }
  }

  // Fetch full event data for each participation
  const eventPromises = participations.map((p) =>
    getEventBySeasonAndCode(p.season, p.eventCode),
  )
  const events = (await Promise.all(eventPromises)).filter(Boolean) as FTCEvent[]

  if (!events.length) return { event: null, season }

  // 1. Currently ongoing
  const ongoing = events.find((e) => e.start <= today && today <= e.end)
  if (ongoing) return { event: ongoing, season }

  // 2. Starting within 2 days
  const twoDaysOut = new Date(date)
  twoDaysOut.setDate(twoDaysOut.getDate() + 2)
  const twoDaysOutStr = twoDaysOut.toISOString().slice(0, 10)
  const imminent = events
    .filter((e) => e.start > today && e.start <= twoDaysOutStr)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  if (imminent) return { event: imminent, season }

  // 3. Most recently finished within 3 days ago
  const threeDaysAgo = new Date(date)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10)
  const recentlyFinished = events
    .filter((e) => e.end >= threeDaysAgoStr && e.end < today)
    .sort((a, b) => b.end.localeCompare(a.end))[0]
  if (recentlyFinished) return { event: recentlyFinished, season }

  // 4. Soonest upcoming
  const upcoming = events
    .filter((e) => e.start >= today)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  if (upcoming) return { event: upcoming, season }

  // Fallback: most recent past event
  const past = events.sort((a, b) => b.end.localeCompare(a.end))[0]
  return { event: past ?? null, season }
}

/**
 * Given all event matches and the team's match participations,
 * find the next unplayed match for the team.
 */
export function findUpcomingMatchForTeam(
  allMatches: FTCMatch[],
  teamMatchParticipations: FTCTeamMatchParticipation[],
): { match: FTCMatch | null; alliance: 'Red' | 'Blue' | null } {
  const teamMatchIds = new Set(teamMatchParticipations.map((p) => p.matchId))
  const participationByMatchId = new Map(teamMatchParticipations.map((p) => [p.matchId, p]))

  // Filter to team's matches that haven't been played
  const unplayed = allMatches
    .filter((m) => teamMatchIds.has(m.id) && !m.hasBeenPlayed)
    .sort((a, b) => {
      // Sort by scheduled time, then by id as fallback
      if (a.scheduledStartTime && b.scheduledStartTime) {
        return a.scheduledStartTime.localeCompare(b.scheduledStartTime)
      }
      return a.id - b.id
    })

  if (!unplayed.length) return { match: null, alliance: null }

  const nextMatch = unplayed[0]
  const participation = participationByMatchId.get(nextMatch.id)
  return {
    match: nextMatch,
    alliance: participation?.alliance ?? null,
  }
}
