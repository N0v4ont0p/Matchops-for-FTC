# Matchops for FTC

Matchops is a bilingual FTC competition operations platform that keeps scouting, strategy, pit issues, batteries, and team notes in one private workspace.

## Features

- Firebase Authentication for sign-in/sign-up
- Workspace onboarding (create or join with team code)
- Team-isolated Firestore data model
- Bilingual UX (English + Simplified Chinese)
- Recon mode with autonomous/teleop observations, penalties, and strategy updates
- FTCScout event context panel for upcoming matches
- Pit mode for issue lifecycle tracking
- Batteries mode for readiness tracking
- Notes mode with tags and pinning
- Realtime collaboration via Firestore subscriptions

## Local Run

1. Install dependencies:
   - `npm install`
2. Configure environment variables:
   - Copy `.env.example` to `.env`
3. Run dev server:
   - `npm run dev`

## Render Deployment (Web Service)

This repository includes `render.yaml` for one-click setup.

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will apply `render.yaml`, build with `npm ci && npm run build`, and start with `npm run start`.

## Firebase Setup Checklist

- Enable Authentication Email/Password provider.
- Create Firestore database.
- Deploy `firestore.rules`:
  - `firebase deploy --only firestore:rules`
- Ensure your authorized domains include your Render URL.

## Data Layout

- `users/{uid}`: profile, language preference, workspace link
- `workspaces/{workspaceId}`: team metadata and member list
- `workspaces/{workspaceId}/reconEntries`
- `workspaces/{workspaceId}/pitIssues`
- `workspaces/{workspaceId}/batteries`
- `workspaces/{workspaceId}/notes`
