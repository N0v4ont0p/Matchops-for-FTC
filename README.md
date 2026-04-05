# Matchops for FTC

**Matchops** is a bilingual (English / 中文) competition operations platform for FIRST Tech Challenge (FTC) teams. It provides realtime collaborative scouting, pit issue tracking, battery management, and team notes — all in one dark tactical interface.

---

## Features

| Mode | Description |
|------|-------------|
| **Recon** | Live match scouting with realtime multi-device sync. Auto-detects your event & upcoming match via FTCScout. |
| **Pit** | Track mechanical/electrical issues with priority levels and status lifecycle. |
| **Batteries** | Monitor battery status (ready / charging / low / damaged) and voltage across your fleet. |
| **Notes** | Team notes with tags, pinning, and fast search. |
| **Settings** | Workspace identity, language switching, member overview, sign-out. |

---

## Tech Stack

- **Frontend:** Vite 5 + React 18 + TypeScript 5
- **Styling:** Tailwind CSS 3 with a fully custom dark design system
- **Auth & Database:** Firebase 10 (Authentication + Firestore)
- **API:** [FTCScout REST API](https://ftcscout.org/api/rest) — live event and match data
- **i18n:** react-i18next (English + Simplified Chinese)
- **Icons:** lucide-react
- **Routing:** react-router-dom v6

---

## Identity Model

- Every **workspace** is tied to a single FTC team number (immutable after creation).
- The first user to create a workspace becomes the **owner**.
- Any signed-in user who knows the workspace is automatically added as a member when they sign in (see `AuthContext`).
- Team number and team name **cannot be changed** after workspace creation — this is enforced in both the UI and Firestore security rules.

---

## FTCScout Integration

Matchops uses the FTCScout REST API (`https://api.ftcscout.org/rest/v1`) to:

1. **Auto-detect your active event** — finds ongoing/imminent/recently finished events for your team.
2. **Identify the upcoming match** — scans unplayed matches to surface the next one.
3. **Display alliance partners** — shows red/blue alliance composition for any match.
4. **Browse events and matches** — manual overrides via the Event Selector and Match Selector modals.

No API key is required. All requests are read-only.

**Season logic:** FTC seasons span two calendar years (e.g., season **2025** runs from August 2025 to April 2026). Matchops automatically computes the current season based on the current date.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/matchops-for-ftc.git
cd "matchops-for-ftc"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### TypeScript type checking

```bash
npm run typecheck
```

### Production build

```bash
npm run build
```

Build output is placed in `dist/`.

---

## Firebase Setup

The Firebase project config is **hardcoded** in [`src/config/firebase.ts`](src/config/firebase.ts). No environment variables are needed.

### Firestore Indexes

You may need to create the following composite indexes in the Firebase console:

| Collection path | Fields |
|----------------|--------|
| `teams/{teamId}/events/{eventId}/matches/{matchId}/reconEntries` | `teamNumber ASC, createdAt DESC` |
| `teams/{teamId}/pitIssues` | `status ASC, createdAt DESC` |
| `teams/{teamId}/notes` | `pinned DESC, updatedAt DESC` |

### Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## Deployment on Render

1. Push this repository to GitHub.
2. In [Render](https://render.com), create a new **Static Site**.
3. Connect your GitHub repository.
4. Set build settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. No environment variables are required (Firebase config is hardcoded).
6. Click **Deploy**.

> Render will automatically re-deploy on every push to `main`.

---

## Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `zh` | Simplified Chinese (简体中文) |

Language preference is persisted in `localStorage` under the key `matchops_lang` and synced to the user's workspace document in Firestore.

---

## Recon Entry Fields

Each scouted match entry captures:

| Field | Description |
|-------|-------------|
| Auto Scored | Samples scored in auto |
| Can Leave Start | Robot left starting zone in auto |
| Auto Park | Parked in observation zone during auto |
| Teleop Near Scored | Near basket/net scored in teleop |
| Teleop Far Scored | Far basket/net scored in teleop |
| Teleop Park | Parked during teleop end |
| Park Points | End-game park points |
| Notes | Free-form scouter notes |

---

## Project Structure

```
src/
├── App.tsx               # Root router + provider stack
├── main.tsx              # Entry point
├── index.css             # Tailwind + global component styles
├── config/
│   └── firebase.ts       # Firebase init (hardcoded config)
├── types/
│   └── index.ts          # All TypeScript interfaces
├── i18n/
│   ├── index.ts          # i18next init
│   ├── en.ts             # English translations
│   └── zh.ts             # Chinese translations
├── services/
│   ├── ftcscout.ts       # FTCScout REST client
│   └── firestore.ts      # All Firestore data access
├── contexts/
│   ├── AuthContext.tsx
│   ├── WorkspaceContext.tsx
│   └── EventContext.tsx
├── components/
│   ├── ui/               # Button, Card, Badge, Modal, etc.
│   ├── layout/           # AppShell, ReconTabBar
│   └── recon/            # Match-specific panels and selectors
├── pages/
│   ├── LandingPage.tsx
│   ├── SignInPage.tsx
│   ├── OnboardingPage.tsx
│   └── app/
│       ├── ReconLayout.tsx
│       ├── ReconDashboard.tsx
│       ├── CurrentMatchWorkspace.tsx
│       ├── MatchHistoryPage.tsx
│       ├── TeamIntelPage.tsx
│       ├── PitPage.tsx
│       ├── BatteriesPage.tsx
│       ├── NotesPage.tsx
│       └── SettingsPage.tsx
├── router/
│   └── ProtectedRoute.tsx
└── utils/
    └── format.ts
firestore.rules             # Firestore security rules
```

---

## License

MIT © Matchops Contributors
