import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { auth } from "./firebase";
import { t } from "./i18n";
import type {
  AppTab,
  Battery,
  Language,
  PitIssue,
  ReconEntry,
  TeamNote,
  UserProfile,
  Workspace
} from "./types";
import {
  addBattery,
  addNote,
  addPitIssue,
  addReconEntry,
  createWorkspace,
  getUserProfile,
  joinWorkspace,
  subscribeBatteries,
  subscribeNotes,
  subscribePitIssues,
  subscribeReconEntries,
  subscribeWorkspace,
  upsertUserProfile
} from "./services/firestore";
import { fetchUpcomingMatches, type UpcomingMatch } from "./services/ftcscout";

type AuthMode = "signin" | "signup";

export function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tab, setTab] = useState<AppTab>("recon");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const [reconEntries, setReconEntries] = useState<ReconEntry[]>([]);
  const [pitIssues, setPitIssues] = useState<PitIssue[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [notes, setNotes] = useState<TeamNote[]>([]);

  const [eventCode, setEventCode] = useState("");
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const tx = useMemo(() => (key: Parameters<typeof t>[1]) => t(language, key), [language]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (sessionUser) => {
      setUser(sessionUser);
      if (!sessionUser) {
        setProfile(null);
        setWorkspace(null);
        return;
      }

      const existing = await getUserProfile(sessionUser.uid);
      if (existing) {
        setLanguage(existing.language);
        setProfile(existing);
      } else {
        const newProfile: UserProfile = {
          uid: sessionUser.uid,
          email: sessionUser.email ?? "",
          displayName: sessionUser.displayName ?? "Team Member",
          workspaceId: null,
          language: "en",
          updatedAt: Date.now()
        };
        await upsertUserProfile(newProfile);
        setProfile(newProfile);
      }
    });
  }, []);

  useEffect(() => {
    if (!profile?.workspaceId) {
      setWorkspace(null);
      return;
    }

    const off = subscribeWorkspace(profile.workspaceId, setWorkspace);
    return () => off();
  }, [profile?.workspaceId]);

  useEffect(() => {
    if (!workspace?.id) {
      setReconEntries([]);
      setPitIssues([]);
      setBatteries([]);
      setNotes([]);
      return;
    }

    const offRecon = subscribeReconEntries(workspace.id, setReconEntries);
    const offPit = subscribePitIssues(workspace.id, setPitIssues);
    const offBatteries = subscribeBatteries(workspace.id, setBatteries);
    const offNotes = subscribeNotes(workspace.id, setNotes);

    return () => {
      offRecon();
      offPit();
      offBatteries();
      offNotes();
    };
  }, [workspace?.id]);

  async function handleAuthSubmit() {
    try {
      setAuthError(null);
      if (authMode === "signup") {
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        const newProfile: UserProfile = {
          uid: creds.user.uid,
          email,
          displayName: displayName || "Team Member",
          workspaceId: null,
          language,
          updatedAt: Date.now()
        };
        await upsertUserProfile(newProfile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      setAuthError(tx("authError"));
    }
  }

  async function handleCreateWorkspace() {
    if (!user || !teamName.trim() || !teamCode.trim()) {
      return;
    }
    const created = await createWorkspace(teamName.trim(), teamCode.trim(), user.uid);
    const nextProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? "",
      displayName: profile?.displayName || displayName || "Team Member",
      workspaceId: created.id,
      language,
      updatedAt: Date.now()
    };
    await upsertUserProfile(nextProfile);
    setProfile(nextProfile);
  }

  async function handleJoinWorkspace() {
    if (!user || !teamCode.trim()) {
      return;
    }
    const found = await joinWorkspace(teamCode.trim(), user.uid);
    if (!found) {
      return;
    }
    const nextProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? "",
      displayName: profile?.displayName || displayName || "Team Member",
      workspaceId: found.id,
      language,
      updatedAt: Date.now()
    };
    await upsertUserProfile(nextProfile);
    setProfile(nextProfile);
  }

  async function handleLanguageChange(next: Language) {
    setLanguage(next);
    if (!profile) {
      return;
    }
    const nextProfile = { ...profile, language: next, updatedAt: Date.now() };
    await upsertUserProfile(nextProfile);
    setProfile(nextProfile);
  }

  async function handleLoadEvent() {
    if (!eventCode.trim()) {
      return;
    }
    setLoadingMatches(true);
    try {
      const matches = await fetchUpcomingMatches(eventCode.trim());
      setUpcomingMatches(matches);
    } catch {
      setUpcomingMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }

  if (!user) {
    return (
      <main className="page auth-page">
        <section className="panel hero">
          <h1>{tx("appName")}</h1>
          <p>{tx("appTagline")}</p>
          <label>
            {tx("language")}
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value as Language)}>
              <option value="en">English</option>
              <option value="zh">简体中文</option>
            </select>
          </label>
        </section>

        <section className="panel auth-panel">
          <h2>{authMode === "signin" ? tx("signIn") : tx("signUp")}</h2>
          <input
            placeholder={tx("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <input
            placeholder={tx("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          {authMode === "signup" && (
            <input
              placeholder={tx("displayName")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <button onClick={handleAuthSubmit}>{authMode === "signin" ? tx("signIn") : tx("signUp")}</button>
          {authError && <p className="error">{authError}</p>}
          <button className="secondary" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>{
            authMode === "signin" ? tx("signUp") : tx("signIn")
          }</button>
        </section>
      </main>
    );
  }

  if (!profile?.workspaceId || !workspace) {
    return (
      <main className="page onboard-page">
        <section className="panel">
          <h1>{tx("onboarding")}</h1>
          <p>{tx("workspaceRequired")}</p>
          <p className="muted">{tx("dataIsolated")}</p>

          <div className="grid-2">
            <div>
              <h3>{tx("createWorkspace")}</h3>
              <input placeholder={tx("teamName")} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <input placeholder={tx("teamCode")} value={teamCode} onChange={(e) => setTeamCode(e.target.value)} />
              <button onClick={handleCreateWorkspace}>{tx("createWorkspace")}</button>
            </div>

            <div>
              <h3>{tx("joinWorkspace")}</h3>
              <input placeholder={tx("teamCode")} value={teamCode} onChange={(e) => setTeamCode(e.target.value)} />
              <button onClick={handleJoinWorkspace}>{tx("joinWorkspace")}</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page app-page">
      <header className="topbar">
        <div>
          <h1>{workspace.teamName}</h1>
          <p>{workspace.teamCode} · {tx("workspaceMembers")}: {workspace.members.length}</p>
        </div>

        <div className="topbar-actions">
          <label>
            {tx("language")}
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value as Language)}>
              <option value="en">English</option>
              <option value="zh">简体中文</option>
            </select>
          </label>
          <button className="secondary" onClick={() => signOut(auth)}>{tx("signOut")}</button>
        </div>
      </header>

      <nav className="tabs">
        {(["recon", "pit", "batteries", "notes"] as AppTab[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {tx(item)}
          </button>
        ))}
      </nav>

      {tab === "recon" && (
        <section className="content-grid">
          <article className="panel">
            <h2>{tx("recon")}</h2>
            <ReconForm workspaceId={workspace.id} language={language} currentUser={profile.displayName} />
            <div className="feed">
              {reconEntries.length === 0 && <p className="muted">{tx("noData")}</p>}
              {reconEntries.map((item) => (
                <div key={item.id} className="feed-item">
                  <strong>{item.phase === "auto" ? tx("auto") : tx("teleop")}</strong>
                  <p>{item.observation}</p>
                  <p>{tx("penalty")}: {item.penalty || "-"}</p>
                  <p>{tx("strategyUpdate")}: {item.strategyUpdate || "-"}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>{tx("upcomingMatches")}</h2>
            <div className="inline-form">
              <input placeholder={tx("eventCode")} value={eventCode} onChange={(e) => setEventCode(e.target.value)} />
              <button onClick={handleLoadEvent}>{tx("loadEvent")}</button>
            </div>
            {loadingMatches && <p>{tx("loading")}</p>}
            {!loadingMatches && upcomingMatches.length === 0 && <p className="muted">{tx("noData")}</p>}
            {upcomingMatches.map((match) => (
              <div key={match.id} className="feed-item">
                <strong>Q{match.number}</strong>
                <p>Red: {match.red.join(", ") || "-"}</p>
                <p>Blue: {match.blue.join(", ") || "-"}</p>
                {match.startTime && <p>{new Date(match.startTime).toLocaleString()}</p>}
              </div>
            ))}
          </article>
        </section>
      )}

      {tab === "pit" && (
        <section className="panel">
          <h2>{tx("pit")}</h2>
          <PitForm workspaceId={workspace.id} language={language} />
          <div className="feed">
            {pitIssues.length === 0 && <p className="muted">{tx("noData")}</p>}
            {pitIssues.map((issue) => (
              <div key={issue.id} className="feed-item">
                <strong>{issue.title}</strong>
                <p>{issue.description}</p>
                <p>{tx("issueStatus")}: {tx(issue.status === "in_progress" ? "inProgress" : issue.status)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "batteries" && (
        <section className="panel">
          <h2>{tx("batteries")}</h2>
          <BatteryForm workspaceId={workspace.id} language={language} />
          <div className="feed">
            {batteries.length === 0 && <p className="muted">{tx("noData")}</p>}
            {batteries.map((battery) => (
              <div key={battery.id} className="feed-item">
                <strong>{battery.label}</strong>
                <p>{tx("batteryStatus")}: {tx(battery.status)}</p>
                <p>{battery.notes || "-"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "notes" && (
        <section className="panel">
          <h2>{tx("notes")}</h2>
          <NotesForm workspaceId={workspace.id} language={language} />
          <div className="feed">
            {notes.length === 0 && <p className="muted">{tx("noData")}</p>}
            {notes
              .slice()
              .sort((a, b) => Number(b.pinned) - Number(a.pinned))
              .map((note) => (
                <div key={note.id} className="feed-item">
                  <strong>{note.pinned ? "[PINNED] " : ""}{note.title}</strong>
                  <p>{note.content}</p>
                  <p>{note.tags.map((tag) => `#${tag}`).join(" ")}</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ReconForm({ workspaceId, language, currentUser }: { workspaceId: string; language: Language; currentUser: string }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [phase, setPhase] = useState<"auto" | "teleop">("auto");
  const [observation, setObservation] = useState("");
  const [penalty, setPenalty] = useState("");
  const [strategyUpdate, setStrategyUpdate] = useState("");

  async function submit() {
    if (!observation.trim()) {
      return;
    }
    await addReconEntry(workspaceId, {
      phase,
      observation: observation.trim(),
      penalty: penalty.trim(),
      strategyUpdate: strategyUpdate.trim(),
      createdBy: currentUser,
      createdAt: Date.now()
    });
    setObservation("");
    setPenalty("");
    setStrategyUpdate("");
  }

  return (
    <div className="form-stack">
      <select value={phase} onChange={(e) => setPhase(e.target.value as "auto" | "teleop")}>
        <option value="auto">{tx("auto")}</option>
        <option value="teleop">{tx("teleop")}</option>
      </select>
      <textarea placeholder={tx("observation")} value={observation} onChange={(e) => setObservation(e.target.value)} />
      <input placeholder={tx("penalty")} value={penalty} onChange={(e) => setPenalty(e.target.value)} />
      <input
        placeholder={tx("strategyUpdate")}
        value={strategyUpdate}
        onChange={(e) => setStrategyUpdate(e.target.value)}
      />
      <button onClick={submit}>{tx("addEntry")}</button>
    </div>
  );
}

function PitForm({ workspaceId, language }: { workspaceId: string; language: Language }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PitIssue["status"]>("open");

  async function submit() {
    if (!title.trim()) {
      return;
    }
    const now = Date.now();
    await addPitIssue(workspaceId, {
      title: title.trim(),
      description: description.trim(),
      status,
      createdAt: now,
      updatedAt: now
    });
    setTitle("");
    setDescription("");
    setStatus("open");
  }

  return (
    <div className="form-stack">
      <input placeholder={tx("issueTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder={tx("issueDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
      <select value={status} onChange={(e) => setStatus(e.target.value as PitIssue["status"])}>
        <option value="open">{tx("open")}</option>
        <option value="in_progress">{tx("inProgress")}</option>
        <option value="resolved">{tx("resolved")}</option>
      </select>
      <button onClick={submit}>{tx("addIssue")}</button>
    </div>
  );
}

function BatteryForm({ workspaceId, language }: { workspaceId: string; language: Language }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<Battery["status"]>("ready");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!label.trim()) {
      return;
    }
    await addBattery(workspaceId, {
      label: label.trim(),
      status,
      notes: notes.trim(),
      updatedAt: Date.now()
    });
    setLabel("");
    setStatus("ready");
    setNotes("");
  }

  return (
    <div className="form-stack">
      <input placeholder={tx("batteryLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
      <select value={status} onChange={(e) => setStatus(e.target.value as Battery["status"])}>
        <option value="ready">{tx("ready")}</option>
        <option value="charging">{tx("charging")}</option>
        <option value="retired">{tx("retired")}</option>
      </select>
      <textarea placeholder={tx("noteContent")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button onClick={submit}>{tx("addBattery")}</button>
    </div>
  );
}

function NotesForm({ workspaceId, language }: { workspaceId: string; language: Language }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [pinned, setPinned] = useState(false);

  async function submit() {
    if (!title.trim()) {
      return;
    }
    await addNote(workspaceId, {
      title: title.trim(),
      content: content.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      pinned,
      updatedAt: Date.now()
    });
    setTitle("");
    setContent("");
    setTags("");
    setPinned(false);
  }

  return (
    <div className="form-stack">
      <input placeholder={tx("noteTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder={tx("noteContent")} value={content} onChange={(e) => setContent(e.target.value)} />
      <input placeholder={tx("noteTags")} value={tags} onChange={(e) => setTags(e.target.value)} />
      <label className="checkbox-row">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        {tx("pinned")}
      </label>
      <button onClick={submit}>{tx("addNote")}</button>
    </div>
  );
}
