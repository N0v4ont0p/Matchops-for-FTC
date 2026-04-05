# Matchops for FTC

Matchops is a bilingual competition operations platform for FIRST Tech Challenge teams.
It is designed for fast, reliable match-day workflows: live scouting, strategy notes, pit triage, battery readiness, and team communication in one app.

## Credit

This project is credited to FTC Team 19589 for team-level use and operations support.

## What Matchops Does

- Realtime recon entry collaboration across multiple devices
- Event and match context resolution from FTCScout REST data
- Shared strategy workspace for each match
- Pit issue lifecycle tracking (open, in-progress, resolved)
- Battery readiness and voltage tracking
- Structured team notes with tags and pinning
- English and Simplified Chinese UI

## Core Modes

| Mode | Purpose |
| --- | --- |
| Recon | Main match workflow with current match context, alliance view, and collaborative scout entries |
| Team Intel | Aggregated historical scouting insights by team |
| Pit | Mechanical/electrical issue tracking with priority + status |
| Batteries | Battery state management (`ready`, `charging`, `low`, `damaged`) |
| Notes | Team knowledge base with tags, pinning, and quick access |
| Settings | Workspace identity, language preference, account/session controls |

## Architecture

### Frontend

- React 18 + TypeScript + Vite 5
- Tailwind CSS with a custom tactical dark theme
- React Router v6 for route segmentation by mode
- Context-based state layers for auth, workspace, and event context

### Data and Auth

- Firebase Authentication (Google + Email/Password)
- Firestore for all private team data
- Team-scoped multi-tenant data model
- Security rules in [firestore.rules](firestore.rules)

### External Data

- FTCScout REST API: `https://api.ftcscout.org/rest/v1`
- Read-only match/event/team structure and schedule data
- No API key required

## Identity and Workspace Rules

- One workspace maps to one FTC team identity
- Team number and team name are immutable after creation
- Owner is the creator of the workspace
- Access to team data is restricted to authenticated team members

## Recon Field Coverage

Recon entries include:

- Auto: scored, dropped, left-start-line, start position, pattern count
- Teleop: near scored, far scored, dropped, pattern count
- Endgame/other: park points, penalties, penalty notes, free-text notes
- Metadata: match, team, alliance, scouter, timestamps

## Internationalization

- Supported languages: English (`en`), Simplified Chinese (`zh`)
- Language preference persists in local storage key `matchops_lang`
- Workspace language is synced to Firestore for team consistency

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Run

```bash
npm install
npm run dev
```

App default URL: `http://localhost:5173`

### Validate Types

```bash
npx tsc --noEmit
```

### Build for Production

```bash
npm run build
```

Build output: `dist/`

## Deployment (Render)

Create a Render Static Site with:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Firebase config is intentionally hardcoded in [src/config/firebase.ts](src/config/firebase.ts) per project requirements.

## Recommended Firestore Composite Indexes

| Collection path | Fields |
| --- | --- |
| `teams/{teamId}/events/{eventId}/matches/{matchId}/reconEntries` | `teamNumber ASC, createdAt DESC` |
| `teams/{teamId}/pitIssues` | `status ASC, createdAt DESC` |
| `teams/{teamId}/notes` | `pinned DESC, updatedAt DESC` |

## Project Layout

```text
src/
    App.tsx
    main.tsx
    config/
        firebase.ts
    contexts/
        AuthContext.tsx
        WorkspaceContext.tsx
        EventContext.tsx
    services/
        firestore.ts
        ftcscout.ts
    pages/
        LandingPage.tsx
        SignInPage.tsx
        OnboardingPage.tsx
        app/
            ReconLayout.tsx
            ReconDashboard.tsx
            CurrentMatchWorkspace.tsx
            MatchHistoryPage.tsx
            TeamIntelPage.tsx
            PitPage.tsx
            BatteriesPage.tsx
            NotesPage.tsx
            SettingsPage.tsx
    components/
        layout/
        recon/
        ui/
    i18n/
    router/
    types/
    utils/
firestore.rules
```

## License

MIT
