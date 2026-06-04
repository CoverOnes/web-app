# web-app

CoverOnes React web UI — the browser front end for the CoverOnes freelance marketplace platform.

## What it does

- Registration, email verification, and login flows.
- KYC onboarding — guides users through identity verification to unlock posting and bidding.
- Job board — browse listings, view job detail, and post new jobs.
- Bidding — submit and track bids on open jobs.
- Contracts — view active contracts, review terms, and sign digitally.
- Real-time notifications via SSE (unread count badge, inbox).
- Feature-flag gating for in-progress features (messaging, contacts, settings).

## Where it sits

Browser front end served at `:5500` in the local dev stack. All API calls go through the gateway at `:8080`; the app holds no direct service connections.

## Route groups

| Path prefix | Area |
|-------------|------|
| `/login`, `/register`, `/verify-email` | Auth |
| `/kyc` | KYC onboarding |
| `/jobs` | Job board and job detail |
| `/bids` | My bids |
| `/contracts` | My contracts and contract detail |
| `/messages`, `/contacts`, `/settings` | Coming soon (feature-flagged) |

## Tech

| | |
|-|--|
| Language | TypeScript 5.9 |
| UI library | React 19 |
| Build tool | Vite 7 |
| State management | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| HTTP client | Axios |

## Run locally

Start the full dev stack (all backends + this app) from `../dev-stack`:

```bash
cd ../dev-stack
task up
```

The web app is then available at `http://localhost:5500`. To run the frontend in isolation for development:

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env.local` to point at the gateway (see `.env.example`).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Gateway base URL (e.g. `http://localhost:8080`) |
