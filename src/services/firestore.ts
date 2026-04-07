import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import type { Battery, PitIssue, ReconEntry, TeamNote, UserProfile, Workspace } from "../types";

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function createWorkspace(teamName: string, teamCode: string, uid: string): Promise<Workspace> {
  const createdAt = Date.now();
  const ref = await addDoc(collection(db, "workspaces"), {
    teamName,
    teamCode,
    createdBy: uid,
    members: [uid],
    createdAt
  });
  return { id: ref.id, teamName, teamCode, createdBy: uid, members: [uid], createdAt };
}

export async function joinWorkspace(teamCode: string, uid: string): Promise<Workspace | null> {
  const snapshots = await getDocs(collection(db, "workspaces"));
  const match = snapshots.docs.find((docSnap) => docSnap.data().teamCode === teamCode);
  if (!match) {
    return null;
  }
  await updateDoc(doc(db, "workspaces", match.id), {
    members: arrayUnion(uid)
  });
  const data = match.data() as Omit<Workspace, "id">;
  return { id: match.id, ...data, members: [...new Set([...(data.members ?? []), uid])] };
}

export function subscribeWorkspace(
  workspaceId: string,
  onData: (workspace: Workspace | null) => void
): () => void {
  return onSnapshot(doc(db, "workspaces", workspaceId), (snapshot) => {
    if (!snapshot.exists()) {
      onData(null);
      return;
    }
    onData({ id: snapshot.id, ...(snapshot.data() as Omit<Workspace, "id">) });
  });
}

function subscribeCollection<T extends { id: string }>(
  workspaceId: string,
  name: string,
  onData: (entries: T[]) => void
): () => void {
  const ref = collection(db, "workspaces", workspaceId, name);
  const q = query(ref, orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onData(
      snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<T, "id">) })) as T[]
    );
  });
}

export const subscribeReconEntries = (workspaceId: string, onData: (entries: ReconEntry[]) => void): (() => void) => {
  const ref = collection(db, "workspaces", workspaceId, "reconEntries");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<ReconEntry, "id">) })));
  });
};

export const subscribePitIssues = (workspaceId: string, onData: (entries: PitIssue[]) => void): (() => void) =>
  subscribeCollection<PitIssue>(workspaceId, "pitIssues", onData);

export const subscribeBatteries = (workspaceId: string, onData: (entries: Battery[]) => void): (() => void) =>
  subscribeCollection<Battery>(workspaceId, "batteries", onData);

export const subscribeNotes = (workspaceId: string, onData: (entries: TeamNote[]) => void): (() => void) =>
  subscribeCollection<TeamNote>(workspaceId, "notes", onData);

export async function addReconEntry(workspaceId: string, entry: Omit<ReconEntry, "id">): Promise<void> {
  await addDoc(collection(db, "workspaces", workspaceId, "reconEntries"), entry);
}

export async function addPitIssue(workspaceId: string, issue: Omit<PitIssue, "id">): Promise<void> {
  await addDoc(collection(db, "workspaces", workspaceId, "pitIssues"), issue);
}

export async function addBattery(workspaceId: string, battery: Omit<Battery, "id">): Promise<void> {
  await addDoc(collection(db, "workspaces", workspaceId, "batteries"), battery);
}

export async function addNote(workspaceId: string, note: Omit<TeamNote, "id">): Promise<void> {
  await addDoc(collection(db, "workspaces", workspaceId, "notes"), note);
}
