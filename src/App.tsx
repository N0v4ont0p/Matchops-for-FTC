import React, { useEffect, useMemo, useState } from "react";
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
import {
  fetchEventContextGraphql,
  lookupTeamByNumberRest,
  type EventContext,
  type TeamLookupResult,
  type UpcomingMatch
} from "./services/ftcscoutService";

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
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [joiningWorkspace, setJoiningWorkspace] = useState(false);

  const [reconEntries, setReconEntries] = useState<ReconEntry[]>([]);
  const [pitIssues, setPitIssues] = useState<PitIssue[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [notes, setNotes] = useState<TeamNote[]>([]);

  const [season, setSeason] = useState(`${new Date().getFullYear() - 1}`);
  const [eventCode, setEventCode] = useState("");
  const [eventContext, setEventContext] = useState<EventContext | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [teamLookupNumber, setTeamLookupNumber] = useState("");
  const [teamLookupResult, setTeamLookupResult] = useState<TeamLookupResult | null>(null);
  const [teamLookupError, setTeamLookupError] = useState<string | null>(null);

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
    setWorkspaceError(null);
    setCreatingWorkspace(true);
    try {
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
    } catch (error) {
      const message = error instanceof Error && error.message === "TEAM_CODE_TAKEN"
        ? tx("teamCodeTaken")
        : tx("workspaceError");
      setWorkspaceError(message);
    } finally {
      setCreatingWorkspace(false);
    }
  }

  async function handleJoinWorkspace() {
    if (!user || !teamCode.trim()) {
      return;
    }
    setWorkspaceError(null);
    setJoiningWorkspace(true);
    try {
      const found = await joinWorkspace(teamCode.trim(), user.uid);
      if (!found) {
        setWorkspaceError(tx("joinNotFound"));
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
    } catch {
      setWorkspaceError(tx("workspaceError"));
    } finally {
      setJoiningWorkspace(false);
    }
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
    const parsedSeason = Number.parseInt(season, 10);
    if (!Number.isFinite(parsedSeason)) {
      setApiError(tx("apiError"));
      return;
    }

    setLoadingMatches(true);
    setApiError(null);
    try {
      const context = await fetchEventContextGraphql(parsedSeason, eventCode.trim().toUpperCase());
      setEventContext(context);
      setUpcomingMatches(context.upcomingMatches);
    } catch {
      setEventContext(null);
      setUpcomingMatches([]);
      setApiError(tx("apiError"));
    } finally {
      setLoadingMatches(false);
    }
  }

  async function handleLookupTeam() {
    const value = Number.parseInt(teamLookupNumber, 10);
    if (!Number.isFinite(value)) {
      setTeamLookupError(tx("teamNotFound"));
      setTeamLookupResult(null);
      return;
    }

    setTeamLookupError(null);
    try {
      const result = await lookupTeamByNumberRest(value);
      if (!result) {
        setTeamLookupResult(null);
        setTeamLookupError(tx("teamNotFound"));
        return;
      }
      setTeamLookupResult(result);
    } catch {
      setTeamLookupResult(null);
      setTeamLookupError(tx("apiError"));
    }
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-mesh" aria-hidden />
        <main className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">M</div>
            <h1 className="auth-app-name">Matchops</h1>
            <p className="auth-tagline">FTC Operations Suite · {language === "zh" ? "双语协作平台" : "Bilingual ops platform"}</p>
          </div>

          <div className="mode-toggle">
            <button
              className={`mode-btn${authMode === "signin" ? " mode-btn--active" : ""}`}
              onClick={() => { setAuthMode("signin"); setAuthError(null); }}
            >{tx("signIn")}</button>
            <button
              className={`mode-btn${authMode === "signup" ? " mode-btn--active" : ""}`}
              onClick={() => { setAuthMode("signup"); setAuthError(null); }}
            >{tx("signUp")}</button>
          </div>

          <div className="form-stack">
            <input
              className="input"
              placeholder={tx("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
            <input
              className="input"
              placeholder={tx("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
            />
            {authMode === "signup" && (
              <input
                className="input"
                placeholder={tx("displayName")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="username"
              />
            )}
            {authError && <div className="alert alert--error">{authError}</div>}
            <button
              className="btn btn--primary btn--full btn--lg"
              onClick={handleAuthSubmit}
            >
              {authMode === "signin" ? tx("signIn") : tx("signUp")}
            </button>
          </div>

          <div className="auth-footer">
            <span className="auth-footer-label">{tx("language")}:</span>
            <select
              className="lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              style={{ maxWidth: "130px" }}
            >
              <option value="en">English</option>
              <option value="zh">简体中文</option>
            </select>
          </div>
        </main>
      </div>
    );
  }

  if (!profile?.workspaceId || !workspace) {
    return (
      <div className="onboard-shell">
        <div className="onboard-card">
          <div className="onboard-top">
            <div className="brand-mark" style={{ width: 40, height: 40, fontSize: "1.1rem" }}>M</div>
            <div className="onboard-text">
              <h2>{tx("onboarding")}</h2>
              <p>{tx("workspaceRequired")}</p>
            </div>
          </div>

          {workspaceError && (
            <div className="alert alert--error onboard-error">{workspaceError}</div>
          )}

          <div className="onboard-body">
            <div className="onboard-pane">
              <div className="pane-title">{tx("createWorkspace")}</div>
              <div className="form-stack">
                <input
                  className="input"
                  placeholder={tx("teamName")}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <input
                  className="input"
                  placeholder={tx("teamCode")}
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                />
                <button
                  className="btn btn--primary btn--full"
                  onClick={handleCreateWorkspace}
                  disabled={creatingWorkspace || joiningWorkspace}
                >
                  {creatingWorkspace ? tx("createWorkspaceLoading") : tx("createWorkspace")}
                </button>
              </div>
            </div>

            <div className="onboard-divider">
              <span>or</span>
            </div>

            <div className="onboard-pane">
              <div className="pane-title">{tx("joinWorkspace")}</div>
              <div className="form-stack">
                <input
                  className="input"
                  placeholder={tx("teamCode")}
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                />
                <button
                  className="btn btn--ghost btn--full"
                  onClick={handleJoinWorkspace}
                  disabled={creatingWorkspace || joiningWorkspace}
                >
                  {joiningWorkspace ? tx("joinWorkspaceLoading") : tx("joinWorkspace")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: AppTab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: "recon",
      label: tx("recon"),
      count: reconEntries.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
    },
    {
      id: "pit",
      label: tx("pit"),
      count: pitIssues.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
    },
    {
      id: "batteries",
      label: tx("batteries"),
      count: batteries.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="12" x2="10" y2="12"/>
        </svg>
      ),
    },
    {
      id: "notes",
      label: tx("notes"),
      count: notes.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">M</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-app-name">Matchops</span>
            <span className="sidebar-team-code">{workspace.teamCode}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${tab === item.id ? " nav-item--active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-count">{item.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="team-info-pill">
            <div className="team-info-name">{workspace.teamName}</div>
            <div className="team-info-meta">{workspace.members.length} {tx("workspaceMembers").toLowerCase()}</div>
          </div>

          <div className="user-row">
            <div className="user-avatar">{(profile.displayName || "U")[0]}</div>
            <div className="user-details">
              <div className="user-name">{profile.displayName}</div>
              <div className="user-email">{profile.email}</div>
            </div>
          </div>

          <div className="sidebar-controls">
            <select
              className="lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="zh">简体中文</option>
            </select>
            <button className="btn-signout" onClick={() => signOut(auth)}>
              {tx("signOut")}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Body ── */}
      <div className="app-body">
        <header className="app-header">
          <div className="header-left">
            <h1>{navItems.find((n) => n.id === tab)?.label ?? tab}</h1>
          </div>
          <div className="ws-badge">
            <span className="ws-badge-dot" />
            {workspace.teamName}
          </div>
        </header>

        <main className="app-content">
          {/* ── Recon Tab ── */}
          {tab === "recon" && (
            <div className="content-split content-split--wide-left">
              <div>
                <div className="ccard">
                  <div className="ccard-header">
                    <span className="ccard-title">
                      <span className="ccard-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </span>
                      {tx("recon")}
                    </span>
                  </div>
                  <div className="ccard-body">
                    <ReconForm workspaceId={workspace.id} language={language} currentUser={profile.displayName} />
                  </div>
                </div>

                <div className="ccard" style={{ marginTop: "1rem" }}>
                  <div className="ccard-header">
                    <span className="ccard-title">Observations</span>
                    <span className="badge badge--muted">{reconEntries.length}</span>
                  </div>
                  <div className="feed">
                    {reconEntries.length === 0
                      ? <div className="feed-empty">{tx("noData")}</div>
                      : reconEntries.map((item) => (
                        <div key={item.id} className="recon-item">
                          <div className="recon-item-meta">
                            <span className={`badge ${item.phase === "auto" ? "badge--brand" : "badge--muted"}`}>
                              {item.phase === "auto" ? tx("auto") : tx("teleop")}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--tx-2)" }}>{item.createdBy}</span>
                          </div>
                          <div className="recon-item-obs">{item.observation}</div>
                          <div className="recon-item-details">
                            {item.penalty && (
                              <span className="recon-detail"><strong>{tx("penalty")}:</strong> {item.penalty}</span>
                            )}
                            {item.strategyUpdate && (
                              <span className="recon-detail"><strong>{tx("strategyUpdate")}:</strong> {item.strategyUpdate}</span>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>

              <div>
                <div className="ccard">
                  <div className="ccard-header">
                    <span className="ccard-title">
                      <span className="ccard-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </span>
                      {tx("upcomingMatches")}
                    </span>
                  </div>
                  <div className="ccard-body">
                    <div className="search-row" style={{ marginBottom: "0.75rem" }}>
                      <input
                        className="input input--sm"
                        placeholder={tx("season")}
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        style={{ maxWidth: "80px" }}
                      />
                      <input
                        className="input"
                        placeholder={tx("eventCode")}
                        value={eventCode}
                        onChange={(e) => setEventCode(e.target.value)}
                      />
                      <button className="btn btn--primary btn--sm" onClick={handleLoadEvent} disabled={loadingMatches}>
                        {tx("loadEvent")}
                      </button>
                    </div>
                    {apiError && <div className="alert alert--error" style={{ marginBottom: "0.75rem" }}>{apiError}</div>}
                    {eventContext && (
                      <div className="event-info">
                        <div className="event-info-name">{eventContext.name}</div>
                        <div className="event-info-sub">{eventContext.code} · {eventContext.timezone}</div>
                      </div>
                    )}
                    {loadingMatches && <div className="state-loading">{tx("loading")}…</div>}
                    {!loadingMatches && upcomingMatches.length === 0 && !eventContext && (
                      <div className="feed-empty">{tx("noData")}</div>
                    )}
                    <div className="feed" style={{ padding: 0 }}>
                      {upcomingMatches.map((match) => (
                        <div key={match.id} className="match-card">
                          <div className="match-header">
                            <span className="match-name">{match.description}</span>
                            {match.scheduledStartTime && (
                              <span className="match-time">
                                {new Date(match.scheduledStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div className="match-alliances">
                            <div className="alliance-block alliance-block--red">
                              <div className="alliance-lbl">Red</div>
                              <div className="alliance-teams">
                                {match.red.length
                                  ? match.red.map((teamNumber: string) => <span key={teamNumber} className="team-chip">{teamNumber}</span>)
                                  : <span className="team-chip">—</span>}
                              </div>
                            </div>
                            <div className="alliance-block alliance-block--blue">
                              <div className="alliance-lbl">Blue</div>
                              <div className="alliance-teams">
                                {match.blue.length
                                  ? match.blue.map((teamNumber: string) => <span key={teamNumber} className="team-chip">{teamNumber}</span>)
                                  : <span className="team-chip">—</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ccard" style={{ marginTop: "1rem" }}>
                  <div className="ccard-header">
                    <span className="ccard-title">
                      <span className="ccard-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      </span>
                      {tx("teamLookup")}
                    </span>
                  </div>
                  <div className="ccard-body">
                    <div className="search-row" style={{ marginBottom: "0.75rem" }}>
                      <input
                        className="input"
                        placeholder={tx("teamNumber")}
                        value={teamLookupNumber}
                        onChange={(e) => setTeamLookupNumber(e.target.value)}
                      />
                      <button className="btn btn--ghost btn--sm" onClick={handleLookupTeam}>
                        {tx("lookupTeam")}
                      </button>
                    </div>
                    {teamLookupError && <div className="alert alert--error">{teamLookupError}</div>}
                    {teamLookupResult && (
                      <div className="team-result">
                        <div className="team-result-name">#{teamLookupResult.number} · {teamLookupResult.name}</div>
                        <div className="team-result-meta">
                          {teamLookupResult.schoolName && <span>{teamLookupResult.schoolName}</span>}
                          <span>
                            {[teamLookupResult.city, teamLookupResult.state, teamLookupResult.country]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                          {teamLookupResult.website && (
                            <a href={teamLookupResult.website} target="_blank" rel="noreferrer">
                              {teamLookupResult.website}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Pit Tab ── */}
          {tab === "pit" && (
            <div className="content-split">
              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">
                    <span className="ccard-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34L9 9m5.01 5.99 2.34 5.32a10 10 0 0 0 2.87-11.68M9 9l-3.06-.82A10 10 0 0 0 8.5 21.5L9 9m5.01 5.99L9 9"/></svg>
                    </span>
                    {tx("addIssue")}
                  </span>
                </div>
                <div className="ccard-body">
                  <PitForm workspaceId={workspace.id} language={language} />
                </div>
              </div>

              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">Issues</span>
                  <span className="badge badge--muted">{pitIssues.length}</span>
                </div>
                <div className="feed">
                  {pitIssues.length === 0
                    ? <div className="feed-empty">{tx("noData")}</div>
                    : pitIssues.map((issue) => (
                      <div key={issue.id} className="pit-item">
                        <div className="pit-item-header">
                          <span className="pit-item-title">{issue.title}</span>
                          <span className={`badge ${
                            issue.status === "resolved" ? "badge--green"
                            : issue.status === "in_progress" ? "badge--amber"
                            : "badge--red"
                          }`}>
                            {tx(issue.status === "in_progress" ? "inProgress" : issue.status)}
                          </span>
                        </div>
                        {issue.description && (
                          <div className="pit-item-desc">{issue.description}</div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── Batteries Tab ── */}
          {tab === "batteries" && (
            <div className="content-split">
              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">
                    <span className="ccard-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>
                    </span>
                    {tx("addBattery")}
                  </span>
                </div>
                <div className="ccard-body">
                  <BatteryForm workspaceId={workspace.id} language={language} />
                </div>
              </div>

              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">{tx("batteries")}</span>
                  <span className="badge badge--muted">{batteries.length}</span>
                </div>
                <div className="feed">
                  {batteries.length === 0
                    ? <div className="feed-empty">{tx("noData")}</div>
                    : batteries.map((battery) => (
                      <div key={battery.id} className="battery-item">
                        <div className={`battery-icon-wrap battery-icon-wrap--${
                          battery.status === "ready" ? "green"
                          : battery.status === "charging" ? "amber"
                          : "red"
                        }`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/>
                          </svg>
                        </div>
                        <div className="battery-info">
                          <div className="battery-label">{battery.label}</div>
                          <div className="battery-meta">
                            <span className={`badge badge--${
                              battery.status === "ready" ? "green"
                              : battery.status === "charging" ? "amber"
                              : "red"
                            }`} style={{ fontSize: "0.68rem" }}>
                              {tx(battery.status)}
                            </span>
                            {battery.notes && (
                              <span style={{ marginLeft: "0.5rem", color: "var(--tx-2)", fontSize: "0.75rem" }}>
                                {battery.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── Notes Tab ── */}
          {tab === "notes" && (
            <div className="content-split">
              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">
                    <span className="ccard-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </span>
                    {tx("addNote")}
                  </span>
                </div>
                <div className="ccard-body">
                  <NotesForm workspaceId={workspace.id} language={language} />
                </div>
              </div>

              <div className="ccard">
                <div className="ccard-header">
                  <span className="ccard-title">{tx("notes")}</span>
                  <span className="badge badge--muted">{notes.length}</span>
                </div>
                <div className="feed">
                  {notes.length === 0
                    ? <div className="feed-empty">{tx("noData")}</div>
                    : notes
                        .slice()
                        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                        .map((note) => (
                          <div key={note.id} className={`note-item${note.pinned ? " note-item--pinned" : ""}`}>
                            <div className="note-item-header">
                              <span className="note-title">{note.title}</span>
                              {note.pinned && (
                                <span className="badge badge--amber" style={{ fontSize: "0.65rem" }}>
                                  📌 Pinned
                                </span>
                              )}
                            </div>
                            {note.content && <div className="note-content">{note.content}</div>}
                            {note.tags.length > 0 && (
                              <div className="note-tags">
                                {note.tags.map((tag) => (
                                  <span key={tag} className="tag-chip">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                  }
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ReconForm({ workspaceId, language, currentUser }: { workspaceId: string; language: Language; currentUser: string }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [phase, setPhase] = useState<"auto" | "teleop">("auto");
  const [observation, setObservation] = useState("");
  const [penalty, setPenalty] = useState("");
  const [strategyUpdate, setStrategyUpdate] = useState("");

  async function submit() {
    if (!observation.trim()) return;
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
      <div className="phase-toggle">
        <button
          className={`phase-pill${phase === "auto" ? " phase-pill--active" : ""}`}
          onClick={() => setPhase("auto")}
        >{tx("auto")}</button>
        <button
          className={`phase-pill${phase === "teleop" ? " phase-pill--active" : ""}`}
          onClick={() => setPhase("teleop")}
        >{tx("teleop")}</button>
      </div>
      <textarea className="input" placeholder={tx("observation")} value={observation} onChange={(e) => setObservation(e.target.value)} />
      <input className="input" placeholder={tx("penalty")} value={penalty} onChange={(e) => setPenalty(e.target.value)} />
      <input className="input" placeholder={tx("strategyUpdate")} value={strategyUpdate} onChange={(e) => setStrategyUpdate(e.target.value)} />
      <button className="btn btn--primary" onClick={submit}>{tx("addEntry")}</button>
    </div>
  );
}

function PitForm({ workspaceId, language }: { workspaceId: string; language: Language }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PitIssue["status"]>("open");

  async function submit() {
    if (!title.trim()) return;
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
      <input className="input" placeholder={tx("issueTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder={tx("issueDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value as PitIssue["status"])}>
        <option value="open">{tx("open")}</option>
        <option value="in_progress">{tx("inProgress")}</option>
        <option value="resolved">{tx("resolved")}</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>{tx("addIssue")}</button>
    </div>
  );
}

function BatteryForm({ workspaceId, language }: { workspaceId: string; language: Language }) {
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<Battery["status"]>("ready");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!label.trim()) return;
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
      <input className="input" placeholder={tx("batteryLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Battery["status"])}>
        <option value="ready">{tx("ready")}</option>
        <option value="charging">{tx("charging")}</option>
        <option value="retired">{tx("retired")}</option>
      </select>
      <textarea className="input" placeholder={tx("noteContent")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className="btn btn--primary" onClick={submit}>{tx("addBattery")}</button>
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
    if (!title.trim()) return;
    await addNote(workspaceId, {
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
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
      <input className="input" placeholder={tx("noteTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder={tx("noteContent")} value={content} onChange={(e) => setContent(e.target.value)} />
      <input className="input" placeholder={tx("noteTags")} value={tags} onChange={(e) => setTags(e.target.value)} />
      <label className="check-row">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        {tx("pinned")}
      </label>
      <button className="btn btn--primary" onClick={submit}>{tx("addNote")}</button>
    </div>
  );
}
