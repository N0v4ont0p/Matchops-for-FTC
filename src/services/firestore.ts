/**
 * Firestore Data Access Service
 *
 * All private team/scouting data lives in Firestore.
 * FTCScout is only for public event/match/team structure.
 *
 * Schema:
 *   teams/{teamId}
 *   teams/{teamId}/members/{uid}
 *   teams/{teamId}/events/{eventId}
 *   teams/{teamId}/events/{eventId}/matches/{matchId}
 *   teams/{teamId}/events/{eventId}/matches/{matchId}/reconEntries/{entryId}
 *   teams/{teamId}/events/{eventId}/matches/{matchId}/strategy/shared
 *   teams/{teamId}/pitIssues/{issueId}
 *   teams/{teamId}/batteries/{batteryId}
 *   teams/{teamId}/notes/{noteId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type {
  WorkspaceTeam,
  WorkspaceMember,
  ReconEntry,
  MatchStrategy,
  PitIssue,
  Battery,
  TeamNote,
  SupportedLanguage,
} from '@/types'

// ── Timestamp helper ────────────────────────────────────────────────────────

function toISOString(ts: unknown): string {
  if (!ts) return new Date().toISOString()
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toISOString()
  }
  return String(ts)
}

function cleanDoc<T extends DocumentData>(id: string, data: DocumentData): T {
  // Convert Firestore Timestamps to ISO strings recursively
  const cleaned: DocumentData = { id }
  for (const key of Object.keys(data)) {
    const v = data[key]
    if (v && typeof v === 'object' && 'toDate' in v) {
      cleaned[key] = v.toDate().toISOString()
    } else {
      cleaned[key] = v
    }
  }
  return cleaned as T
}

// ── Workspace / Teams ───────────────────────────────────────────────────────

export async function getWorkspaceByTeamNumber(
  teamNumber: number,
): Promise<WorkspaceTeam | null> {
  const q = query(collection(db, 'teams'), where('teamNumber', '==', teamNumber))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const data = d.data() as Omit<WorkspaceTeam, 'teamId'>
  return { ...data, teamId: d.id }
}

export async function getWorkspaceById(teamId: string): Promise<WorkspaceTeam | null> {
  const snap = await getDoc(doc(db, 'teams', teamId))
  if (!snap.exists()) return null
  const data = snap.data() as Omit<WorkspaceTeam, 'teamId'>
  return { ...data, teamId: snap.id }
}

export async function createWorkspace(params: {
  teamNumber: number
  teamName: string
  language: SupportedLanguage
  ownerUid: string
}): Promise<WorkspaceTeam> {
  const docRef = doc(collection(db, 'teams'))
  const teamNumberRef = doc(db, 'teamNumbers', String(params.teamNumber))
  const memberRef = doc(db, 'teams', docRef.id, 'members', params.ownerUid)
  const userRef = doc(db, 'users', params.ownerUid)
  const createdAt = new Date().toISOString()
  const data: Omit<WorkspaceTeam, 'teamId'> = {
    teamNumber: params.teamNumber,
    teamName: params.teamName,
    language: params.language,
    ownerUid: params.ownerUid,
    createdAt,
  }

  await runTransaction(db, async (tx) => {
    const reservation = await tx.get(teamNumberRef)
    if (reservation.exists()) {
      throw new Error('workspace/team-number-exists')
    }

    tx.set(docRef, data)
    tx.set(memberRef, {
      uid: params.ownerUid,
      role: 'owner',
      joinedAt: createdAt,
    })
    tx.set(userRef, { teamId: docRef.id }, { merge: true })
    tx.set(teamNumberRef, {
      teamId: docRef.id,
      ownerUid: params.ownerUid,
      createdAt,
    })
  })

  return { ...data, teamId: docRef.id }
}

export async function updateWorkspaceLanguage(
  teamId: string,
  language: SupportedLanguage,
): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId), { language })
}

// ── Members ─────────────────────────────────────────────────────────────────

export async function getWorkspaceForUser(uid: string): Promise<WorkspaceTeam | null> {
  // Find every team where this user is a member by checking subcollections
  // Efficient approach: query teams where ownerUid == uid OR check membership
  // For MVP, we store teamId on the user profile
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists() && userDoc.data()?.teamId) {
    return getWorkspaceById(userDoc.data()!.teamId)
  }
  return null
}

export async function upsertUserProfile(
  uid: string,
  profile: { displayName: string; email: string; photoURL: string | null; teamId?: string },
): Promise<void> {
  await setDoc(doc(db, 'users', uid), profile, { merge: true })
}

export async function linkUserToWorkspace(uid: string, teamId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { teamId }, { merge: true })
}

export async function getWorkspaceMembers(teamId: string): Promise<WorkspaceMember[]> {
  const snap = await getDocs(collection(db, 'teams', teamId, 'members'))
  // Enrich with user profile data
  const members: WorkspaceMember[] = []
  for (const d of snap.docs) {
    const memberData = d.data()
    const userSnap = await getDoc(doc(db, 'users', d.id))
    const userData = userSnap.exists() ? userSnap.data() : {}
    members.push({
      uid: d.id,
      displayName: userData?.displayName ?? '',
      email: userData?.email ?? '',
      photoURL: userData?.photoURL ?? null,
      role: memberData.role ?? 'member',
      joinedAt: toISOString(memberData.joinedAt),
    })
  }
  return members
}

// ── Recon Entries ────────────────────────────────────────────────────────────

function reconPath(teamId: string, season: number, eventCode: string, matchId: number) {
  const eventDocId = `${season}_${eventCode}`
  const matchDocId = String(matchId)
  return `teams/${teamId}/events/${eventDocId}/matches/${matchDocId}/reconEntries`
}

export async function addReconEntry(
  teamId: string,
  entry: Omit<ReconEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const path = reconPath(teamId, entry.season, entry.eventCode, entry.matchId)
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, path), {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  void now
  return ref.id
}

export async function updateReconEntry(
  teamId: string,
  season: number,
  eventCode: string,
  matchId: number,
  entryId: string,
  updates: Partial<ReconEntry>,
): Promise<void> {
  const path = reconPath(teamId, season, eventCode, matchId)
  await updateDoc(doc(db, path, entryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteReconEntry(
  teamId: string,
  season: number,
  eventCode: string,
  matchId: number,
  entryId: string,
): Promise<void> {
  const path = reconPath(teamId, season, eventCode, matchId)
  await deleteDoc(doc(db, path, entryId))
}

export function subscribeToReconEntries(
  teamId: string,
  season: number,
  eventCode: string,
  matchId: number,
  callback: (entries: ReconEntry[]) => void,
): Unsubscribe {
  const path = reconPath(teamId, season, eventCode, matchId)
  const q = query(collection(db, path), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const entries: ReconEntry[] = snap.docs.map((d) =>
      cleanDoc<ReconEntry>(d.id, d.data()),
    )
    callback(entries)
  })
}

// ── Strategy ─────────────────────────────────────────────────────────────────

function strategyPath(teamId: string, season: number, eventCode: string, matchId: number) {
  const eventDocId = `${season}_${eventCode}`
  const matchDocId = String(matchId)
  return `teams/${teamId}/events/${eventDocId}/matches/${matchDocId}/strategy/shared`
}

export function subscribeToStrategy(
  teamId: string,
  season: number,
  eventCode: string,
  matchId: number,
  callback: (strategy: MatchStrategy | null) => void,
): Unsubscribe {
  const path = strategyPath(teamId, season, eventCode, matchId)
  return onSnapshot(doc(db, path), (snap) => {
    if (!snap.exists()) {
      callback(null)
    } else {
      callback(cleanDoc<MatchStrategy>(snap.id, snap.data()))
    }
  })
}

export async function upsertStrategy(
  teamId: string,
  strategy: Partial<MatchStrategy> & {
    season: number
    eventCode: string
    matchId: number
    matchLabel: string
    lastUpdatedBy: string
    lastUpdatedByName: string
  },
): Promise<void> {
  const { season, eventCode, matchId } = strategy
  const path = strategyPath(teamId, season, eventCode, matchId)
  await setDoc(
    doc(db, path),
    { ...strategy, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

// ── Pit Issues ───────────────────────────────────────────────────────────────

export function subscribeToPitIssues(
  teamId: string,
  callback: (issues: PitIssue[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'teams', teamId, 'pitIssues'),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => cleanDoc<PitIssue>(d.id, d.data())))
  })
}

export async function addPitIssue(
  teamId: string,
  issue: Omit<PitIssue, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'teams', teamId, 'pitIssues'), {
    ...issue,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePitIssue(
  teamId: string,
  issueId: string,
  updates: Partial<PitIssue>,
): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId, 'pitIssues', issueId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePitIssue(teamId: string, issueId: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId, 'pitIssues', issueId))
}

// ── Batteries ────────────────────────────────────────────────────────────────

export function subscribeToBatteries(
  teamId: string,
  callback: (batteries: Battery[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'teams', teamId, 'batteries'),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => cleanDoc<Battery>(d.id, d.data())))
  })
}

export async function addBattery(
  teamId: string,
  battery: Omit<Battery, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'teams', teamId, 'batteries'), {
    ...battery,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBattery(
  teamId: string,
  batteryId: string,
  updates: Partial<Battery>,
): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId, 'batteries', batteryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteBattery(teamId: string, batteryId: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId, 'batteries', batteryId))
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function subscribeToNotes(
  teamId: string,
  callback: (notes: TeamNote[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'teams', teamId, 'notes'),
    orderBy('pinned', 'desc'),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => cleanDoc<TeamNote>(d.id, d.data())))
  })
}

export async function addNote(
  teamId: string,
  note: Omit<TeamNote, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'teams', teamId, 'notes'), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateNote(
  teamId: string,
  noteId: string,
  updates: Partial<TeamNote>,
): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId, 'notes', noteId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteNote(teamId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId, 'notes', noteId))
}

// ── Match history (recon across all matches) ─────────────────────────────────

export async function getReconHistoryForEvent(
  teamId: string,
  season: number,
  eventCode: string,
): Promise<ReconEntry[]> {
  const eventDocId = `${season}_${eventCode}`
  const matchesRef = collection(db, 'teams', teamId, 'events', eventDocId, 'matches')
  const matchSnap = await getDocs(matchesRef)

  const allEntries: ReconEntry[] = []
  for (const matchDoc of matchSnap.docs) {
    const entriesSnap = await getDocs(
      query(
        collection(db, 'teams', teamId, 'events', eventDocId, 'matches', matchDoc.id, 'reconEntries'),
        orderBy('createdAt', 'asc'),
      ),
    )
    entriesSnap.docs.forEach((d) => {
      allEntries.push(cleanDoc<ReconEntry>(d.id, d.data()))
    })
  }
  return allEntries
}
