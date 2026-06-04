# CoverOnes web-app — project instructions

## ⚠️ DESIGN SOURCE OF TRUTH — read FIRST for ANY UI work
ALL UI / UX / frontend work **MUST follow `DESIGN.md` → `design-reference/chat/`** (the canonical
Claude-Design HTML/CSS handoff). **Do NOT freestyle UI.**

- Before building or changing any page/component: open the matching
  `design-reference/chat/project/<Page>.html` + `design-reference/chat/project/shared.css`
  and recreate it **pixel-perfectly** in React (Tailwind v4 + the tokens in `src/index.css`).
- **RWD is mandatory** — every page must work on mobile/tablet; follow
  `design-reference/chat/project/src/mobile.jsx` for breakpoints + responsive patterns.
- Align `src/index.css` tokens to `shared.css` (the dark B2B palette:
  `--bg #060A14`, `--accent #6366F1`, `--accent-2 #8B5CF6`, `--cyan #22D3EE`, Inter + Noto Sans TC).
- Design pages map to real routes: Projects→job board, PostProject→post-job, ProjectDetail→job detail,
  Contracts, Bidding, Profile, Settings, Login/Signup/VerifyEmail, Network, Company, etc.
- If the design is ambiguous, **ASK the user** — do not guess. (User directive 2026-06-04.)

## Stack
React 19 · TypeScript 5.9 (strict) · Vite 7 · Tailwind CSS v4 · Zustand 5 · TanStack Query v5 · axios.
Access token in-memory (Zustand); refresh token in localStorage. No i18n library (inline zh literals).

## Quality gate (before PR)
`npm run lint && npm run build && npm test` — all green.
