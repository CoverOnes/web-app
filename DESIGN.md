# CoverOnes Web — Design Source of Truth

> ⚠️ **ALL UI / frontend work MUST follow the design in `design-reference/`. Do NOT freestyle UI.**
> The design prototype (Claude Design HTML/CSS/JS handoff) is the canonical spec — recreate it
> **pixel-perfectly in React (Tailwind v4 + the tokens in `src/index.css`)**. Match the visual
> output; don't copy the prototype's internal structure.

## Where the design lives
`web-app/design-reference/chat/`
- **`README.md`** — the handoff instructions (read first).
- **`chats/chat1.md`** — the design conversation = the user's actual intent. Read before implementing.
- **`project/shared.css`** — the **design system** (colors, typography, spacing, radius, components). Align `src/index.css` tokens to this.
- **`project/*.html`** — 28 page mockups: Login · Signup · ForgotPassword · VerifyEmail · Homepage · Discover · Search · Projects · ProjectDetail · PostProject · Bidding · Contracts · Network · Company · CompanyProfile · Profile · Settings · Notifications · Saved · Reports · Review · Insights · Calendar · Pricing · Help · Maintenance · 404 · ChatOwl.
- **`project/src/*.jsx`** — app · sidebar · **mobile (RWD breakpoints + patterns)** · modal · chat · icons · data · tweaks.

## Rules for any frontend agent (and Lead)
1. **Before** building/changing ANY page or component: open the matching `design-reference/chat/project/<Page>.html` + `shared.css`, and recreate it pixel-perfectly in React. The HTML/CSS spell out exact dimensions/colors/layout — read them directly.
2. **RWD is mandatory** — follow `src/mobile.jsx` for the mobile/tablet breakpoints + responsive behavior. Every page must work on mobile.
3. Reuse/align the `src/index.css` design tokens with `shared.css` (single source for colors/spacing/type).
4. Map design pages → real app routes (e.g. Projects→JobBoard, PostProject→PostJob, ProjectDetail→JobDetail, Contracts, Profile, Settings, Login/Signup/VerifyEmail).
5. **If the design is ambiguous, ASK the user** — do not guess. (User directive 2026-06-04: "不然你都這樣亂做不行啦".)
