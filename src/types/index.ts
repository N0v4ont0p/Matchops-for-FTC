// ──────────────────────────────────────────────────
// FTCScout API types (derived from official REST API)
// Base URL: https://api.ftcscout.org/rest/v1
// ──────────────────────────────────────────────────

export interface FTCTeam {
  number: number
  name: string
  schoolName: string
  sponsors: string[]
  country: string
  state: string
  city: string
  rookieYear: number
  website: string | null
  createdAt: string
  updatedAt: string
}

export type TournamentLevel = 'Quals' | 'DoubleElim' | 'Finals' | 'SemiFinals' | 'Playoffs'
export type AllianceColor = 'Red' | 'Blue'
export type AllianceRole = 'Captain' | 'FirstPick' | 'SecondPick' | 'Surrogate'
export type AllianceStation = 'One' | 'Two' | 'Three'
export type EventType = 'Qualifier' | 'Championship' | 'League' | 'Scrimmage' | 'LeagueMeet' | 'OffSeason'

export interface FTCEvent {
  season: number
  code: string
  divisionCode: string | null
  name: string
  remote: boolean
  hybrid: boolean
  fieldCount: number
  published: boolean
  type: EventType
  regionCode: string
  leagueCode: string | null
  districtCode: string | null
  venue: string
  address: string
  country: string
  state: string
  city: string
  website: string | null
  liveStreamURL: string | null
  webcasts: string[]
  timezone: string
  start: string // ISO date e.g. "2025-12-13"
  end: string
  modifiedRules: boolean
  createdAt: string
  updatedAt: string
  started: boolean
  ongoing: boolean
  finished: boolean
  hasMatches?: boolean
}

export interface FTCTeamEventParticipation {
  season: number
  eventCode: string
  teamNumber: number
  isRemote: boolean
  stats: Record<string, unknown> | null
}

export interface FTCTeamMatchParticipation {
  season: number
  eventCode: string
  matchId: number
  alliance: AllianceColor
  station: AllianceStation
  teamNumber: number
  allianceRole: AllianceRole
  surrogate: boolean
  noShow: boolean
  dq: boolean
  onField: boolean
  createdAt: string
  updatedAt: string
}

export interface FTCMatchTeamEntry {
  season: number
  eventCode: string
  matchId: number
  alliance: AllianceColor
  station: AllianceStation
  teamNumber: number
  allianceRole: AllianceRole
  surrogate: boolean
  noShow: boolean
  dq: boolean
  onField: boolean
}

export interface FTCMatch {
  eventSeason: number
  eventCode: string
  id: number
  hasBeenPlayed: boolean
  scheduledStartTime: string | null
  actualStartTime: string | null
  postResultTime: string | null
  tournamentLevel: TournamentLevel
  series: number
  createdAt: string
  updatedAt: string
  scores?: Record<string, unknown>
  teams?: FTCMatchTeamEntry[]
}

// ──────────────────────────────────────────────────
// Matchops internal types
// ──────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'zh'
export type AppMode = 'recon' | 'pit' | 'batteries' | 'notes' | 'settings'

export interface WorkspaceTeam {
  teamId: string       // Firestore document ID
  teamNumber: number
  teamName: string
  language: SupportedLanguage
  ownerUid: string
  createdAt: string
}

export interface WorkspaceMember {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  role: 'owner' | 'admin' | 'member' | 'scout'
  joinedAt: string
}

// ── Recon Entry ──────────────────────────────────

export interface ReconEntry {
  id?: string
  // Base
  matchLabel: string        // e.g. "Q-13", "DE-R2M1"
  matchId: number           // FTCScout match ID
  eventCode: string
  season: number
  scouterName: string
  scouterUid: string
  teamNumber: number        // the team being scouted
  allianceColor: AllianceColor

  // Auto
  autoLeftStartLine: boolean
  autoStartPosition: 'near' | 'far' | null
  autoScored: number
  autoDropped: number
  autoPatternCount: number

  // Teleop
  teleopNearScored: number
  teleopFarScored: number
  teleopDropped: number
  teleopPatternCount: number

  // Other
  parkPoints: 0 | 5 | 10
  penaltyCount: number
  penaltyNotes: string
  notes: string

  // Metadata
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

// ── Strategy ────────────────────────────────────

export interface MatchStrategy {
  matchLabel: string
  matchId: number
  eventCode: string
  season: number
  alliancePlan: string
  opponentThreats: string
  keyWinCondition: string
  backupPlan: string
  roleAssignment: string
  sharedReminders: string
  lastUpdatedBy: string
  lastUpdatedByName: string
  updatedAt: string
}

// ── Pit Issues ───────────────────────────────────

export type IssueStatus = 'open' | 'in-progress' | 'resolved'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

export interface PitIssue {
  id?: string
  title: string
  description: string
  priority: IssuePriority
  status: IssueStatus
  assignedTo: string
  createdBy: string
  createdByUid: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// ── Batteries ───────────────────────────────────

export type BatteryStatus = 'ready' | 'charging' | 'low' | 'damaged'

export interface Battery {
  id?: string
  label: string            // e.g. "Bat-01"
  status: BatteryStatus
  voltage?: number
  lastUsedMatchLabel?: string
  lastChargedAt?: string
  notes: string
  createdAt: string
  updatedAt: string
}

// ── Notes ────────────────────────────────────────

export type NoteCategory = 'general' | 'strategy' | 'team' | 'event'

export interface TeamNote {
  id?: string
  title: string
  content: string
  category: NoteCategory
  tags: string[]
  authorName: string
  authorUid: string
  createdAt: string
  updatedAt: string
  pinned: boolean
}

// ── Event context (resolved by FTCScout + date logic) ──

export interface EventContext {
  event: FTCEvent | null
  matches: FTCMatch[]
  teamMatches: FTCTeamMatchParticipation[]
  upcomingMatch: FTCMatch | null
  upcomingMatchAlliance: AllianceColor | null
  loading: boolean
  error: string | null
  season: number
  manualOverride: boolean
}
