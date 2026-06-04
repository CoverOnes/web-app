# CoverOnes Web — Design Implementation Plan

> Canonical design source: `design-reference/chat/project/shared.css` + all `*.html` mockups + `src/mobile.jsx`.
> This document is the spec for frontend-engineers. Read DESIGN.md first, then this file.

---

## Table of Contents

1. [Token Alignment](#1-token-alignment)
2. [Layout Shell](#2-layout-shell)
3. [RWD Strategy](#3-rwd-strategy)
4. [Page-by-Page Mapping](#4-page-by-page-mapping)
5. [Chat Feature Plan](#5-chat-feature-plan)
6. [Phased Build Plan](#6-phased-build-plan)

---

## 1. Token Alignment

### 1.1 Problem Statement

`src/index.css` currently has **two parallel systems** that conflict:

- **`@theme` block** — chat-web-origin tokens (`--color-sb-bg`, `--color-main-bg`, `--color-accent`, etc.)
- **`:root` block** — CoverOnes v2 tokens (`--co-bg`, `--co-accent`, `--co-accent-2`, etc.)

Components mix both. The `--color-accent` is `#2563EB` (blue) while `--co-accent` is `#6366F1` (indigo). These must be unified.

### 1.2 Single Source of Truth

`shared.css` is the design-system canonical. All `--co-*` tokens MUST map 1:1 to `shared.css` variables. The `--color-*` chat-web namespace is **kept only for chat feature components** (`src/components/chat/**`) that were ported directly from chat-web; all new CoverOnes components use `--co-*` exclusively.

### 1.3 Token Mapping Table

| `shared.css` var | Current `--co-*` | Current `--color-*` | Action |
|-----------------|-----------------|---------------------|--------|
| `--bg: #060A14` | `--co-bg: #060A14` | — | ALIGNED — keep |
| `--bg-2: #0B1220` | `--co-bg-2: #0B1220` | `--color-sb-bg: #0B1220` | ALIGNED — keep co-bg-2; sb-bg stays for chat |
| `--bg-3: #0F172A` | `--co-bg-3: #0F172A` | `--color-sb-bg-2: #0F172A` | ALIGNED |
| `--bg-card: #111827` | `--co-bg-card: #111827` | `--color-main-bg: #111827` | ALIGNED |
| `--bg-card-2: #1E293B` | `--co-bg-card-2: #1E293B` | `--color-main-bg-2: #1E293B` | ALIGNED |
| `--line: rgba(148,163,184,0.1)` | `--co-line: rgba(148,163,184,0.10)` | `--color-main-border: rgba(255,255,255,0.08)` | co-line ALIGNED; main-border different opacity — keep for chat |
| `--line-strong: rgba(148,163,184,0.18)` | `--co-line-strong: rgba(148,163,184,0.18)` | — | ALIGNED |
| `--text: #E5E7EB` | `--co-text: #E5E7EB` | `--color-main-text: #E5E7EB` | ALIGNED |
| `--text-dim: #94A3B8` | `--co-text-dim: #94A3B8` | `--color-main-text-dim: #94A3B8` | ALIGNED |
| `--text-muted: #64748B` | `--co-text-muted: #64748B` | `--color-sb-text-dim: #94A3B8` | co-text-muted ALIGNED |
| `--accent: #6366F1` | `--co-accent: #6366F1` | `--color-accent: #2563EB` **MISMATCH** | CONFLICT — see §1.4 |
| `--accent-2: #8B5CF6` | `--co-accent-2: #8B5CF6` | `--color-indigo: #6366F1` | co-accent-2 ALIGNED |
| `--accent-blue: #2563EB` | `--co-accent-blue: #2563EB` | `--color-accent: #2563EB` | co-accent-blue ALIGNED; color-accent stays for chat |
| `--cyan: #22D3EE` | `--co-cyan: #22D3EE` | `--color-cyan: #22D3EE` | ALIGNED |
| `--green: #10B981` | `--co-green: #10B981` | `--color-green: #059669` | co-green ALIGNED; color-green slight mismatch — keep for chat |
| `--amber: #F59E0B` | `--co-amber: #F59E0B` | `--color-amber: #F59E0B` | ALIGNED |
| `--red: #EF4444` | `--co-red: #EF4444` | `--color-red: #EF4444` | ALIGNED |
| `--pink: #EC4899` | `--co-pink: #EC4899` | — | ALIGNED |

### 1.4 Resolving the Primary Accent Conflict

`shared.css` uses **indigo `#6366F1` as `--accent`** (the primary interactive color for nav active state, button gradients, progress bars). The chat-web origin used **blue `#2563EB` as `--color-accent`** (send button, focused states).

**Decision**: CoverOnes primary accent = `--co-accent: #6366F1` (indigo). The indigo-to-violet gradient (`#6366F1` → `#8B5CF6`) is the primary button gradient. Blue `#2563EB` becomes `--co-accent-blue` (used in logo mark + button secondary gradients per the design mockups). Chat components keep `--color-accent: #2563EB`.

**Rationale**: All 28 design mockups use indigo for nav active bar, `.btn-primary` gradient, `.tab.active` underline, `.bar` fill, `.nav-item.active` glow. This is the design intent.

### 1.5 Missing Tokens to Add to `src/index.css`

Add these to the `:root` block — they exist in `shared.css` but have no `--co-*` mapping:

```css
--co-btn-primary-from: #2563EB;
--co-btn-primary-to:   #8B5CF6;
--co-sidebar-w:        240px;
--co-topbar-h:         60px;
--co-card-r:           12px;
--co-btn-r:            8px;
--co-tab-h:            44px;
--co-badge-r:          999px;
```

Sidebar and topbar dimensions MUST be CSS variables so mobile overrides can zero them in a single place.

### 1.6 Badge Color Tokens (role system)

Add to `:root`:

```css
/* Role badge tokens — maps to shared.css .bdg-dev / .bdg-design / .bdg-mfg / .bdg-mkt */
--co-bdg-dev-bg:      rgba(99,102,241,0.15);
--co-bdg-dev-text:    #A78BFA;
--co-bdg-dev-border:  rgba(99,102,241,0.3);

--co-bdg-design-bg:   rgba(34,211,238,0.15);
--co-bdg-design-text: #67E8F9;
--co-bdg-design-border: rgba(34,211,238,0.3);

--co-bdg-mfg-bg:      rgba(245,158,11,0.15);
--co-bdg-mfg-text:    #FCD34D;
--co-bdg-mfg-border:  rgba(245,158,11,0.3);

--co-bdg-mkt-bg:      rgba(236,72,153,0.15);
--co-bdg-mkt-text:    #F9A8D4;
--co-bdg-mkt-border:  rgba(236,72,153,0.3);
```

Role badge alignment: `dev` = 開發 / software; `design` = 設計; `mfg` = 製造 / hardware; `mkt` = 行銷 / 業務.

### 1.7 Typography

No change needed. `src/index.css` already declares:
```css
--font-sans: 'Inter', 'Noto Sans TC', -apple-system, ...
```
This matches `shared.css` exactly. Ensure `font-feature-settings: "cv11","ss01"` and `font-variant-numeric: tabular-nums` are applied at `html` level (already present in index.css — do NOT remove).

---

## 2. Layout Shell

### 2.1 Desktop Layout (≥ 1024px)

Per `shared.css` `.page`:
```
grid-template-columns: 240px 1fr
```

Per `shared.css` `.sb` (sidebar): `position: sticky; top: 0; height: 100vh; background: var(--bg-2)`
Per `shared.css` `.topbar`: `height: 60px; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(12px)`

**Changes to `CoverOnesLayout.tsx`**:
- Wrap in a `display: grid; grid-template-columns: 240px 1fr` container (not flex) when not mobile
- `CoverOnesSidebar` sits in column 1 as `position: sticky; top: 0; height: 100vh`
- Main column is `display: flex; flex-direction: column; min-width: 0`
- `CoverOnesTopbar` stays inside main column at top (sticky within column — `position: sticky; top: 0; z-index: 10`)

**Changes to `CoverOnesSidebar.tsx`**: Full redesign to match `shared.css` spec:
- Brand: 34×34 mark with `linear-gradient(135deg, #2563EB, #8B5CF6)` + name "CoverOnes" + sub "B2B 企業媒合平台"
- Company switcher widget (current company + dropdown chevron)
- Nav sections with `font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em` section labels
- Nav items: icon + label + optional badge/count, active = left 3px indigo bar + `rgba(99,102,241,0.18)` bg gradient
- Sidebar footer: user avatar pill + name + role

**Changes to `CoverOnesTopbar.tsx`**: Full redesign:
- `height: 60px; background: rgba(11,18,32,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--co-line)`
- Left: hamburger (mobile only) or breadcrumb
- Center: search bar `max-width: 540px; height: 38px; background: var(--co-bg-3); border-radius: 10px` with kbd shortcut badge
- Right: icon buttons (notifications bell with unread count) + me-pill (avatar + display name + role)

### 2.2 Mobile Layout (< 768px) — App-Like

Per `mobile.jsx` pattern. **The mobile experience must feel native.**

**Shell structure** (matching `mobile.jsx`):
```
fixed full-screen container
  ├── [content area — flex:1, overflowY:auto, paddingBottom: 72px]
  │    ├── MobileScreenHeader (52px — hamburger + title + action icon)
  │    └── <Outlet /> (full-screen, no side margins)
  ├── FAB (position:absolute, right:16, bottom:90, 52×52, radius:16, co-accent bg)  [context-dependent]
  └── MobileBottomNav (position:fixed, bottom:0, height:72px, paddingBottom: safe-area-inset)
      └── MobileDrawer (position:absolute overlay, width:300, slide from left, z-index:20)
```

**Changes to `CoverOnesMobileBottomNav.tsx`**:
- 5 tabs (matching the 5 most important nav items — see §4)
- Active tab: icon fills accent color, label in accent color
- Unread badge: 9.5px red pill, `box-shadow: 0 0 0 2px var(--co-bg-card-2)` (outline against nav bg)
- Height: 72px + `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch

**Changes to `MobileDrawer.tsx`** (already exists):
- Match `mobile.jsx` `mobStyles.drawer` exactly: `width: 300px; transform: translateX(-100%) → translateX(0); transition: 220ms cubic-bezier(0.2,0.9,0.3,1)`
- Backdrop: `position:absolute; inset:0; background:rgba(0,0,0,0.5); transition:opacity 220ms`
- Drawer content: CoverOnes brand + nav items + company switcher + user footer

**Mobile screen header** (new component: `MobileScreenHeader.tsx`):
- `height: 52px; padding: 0 16px; display:flex; align-items:center; gap:12`
- Hamburger button (36×36, opens drawer) | Page title (17px, 600 weight) | Right action button (36×36)
- Background: `var(--co-bg-card)` with `border-bottom: 1px solid var(--co-line)`

**Swipe gesture** (already implemented in `CoverOnesLayout.tsx`):
- Left-edge swipe (startX < 24, dx > 60) → open drawer — KEEP AS-IS
- Currently `MOBILE_BREAKPOINT = 768` — keep

**FAB** (new component: `MobileFAB.tsx`):
- Shown on pages where primary action is available (job board → post job; messages → new chat)
- `position: fixed; right: 16px; bottom: 90px; width: 52px; height: 52px; border-radius: 16px`
- `background: var(--co-accent); box-shadow: 0 10px 24px rgba(99,102,241,0.4)`
- Hidden on desktop; controlled by page via a `useFAB` context or prop

### 2.3 Tablet Layout (768px–1023px)

- Sidebar hidden by default, accessible via hamburger drawer (same as mobile)
- Bottom nav shown (same as mobile)
- Content area: `max-width: 720px; margin: 0 auto` for text-heavy pages (Settings, Profile)
- Card grids: 2-column

### 2.4 AppShell Changes

`AppShell.tsx` sets the root CSS grid. On desktop it must set:
```css
display: grid;
grid-template-columns: var(--co-sidebar-w) 1fr;
height: 100vh;
overflow: hidden;
```
On mobile (`< 768px`): `display: flex; flex-direction: column` — sidebar is in drawer only.

---

## 3. RWD Strategy

### 3.1 Breakpoints

| Name | Width | Description |
|------|-------|-------------|
| `mobile` | < 768px | App-like: bottom-nav + drawer + full-screen views |
| `tablet` | 768px–1023px | Drawer sidebar + bottom-nav + 2-col grids |
| `desktop` | ≥ 1024px | Fixed sidebar 240px + topbar 60px + multi-column |
| `wide` | ≥ 1440px | Design mockup native width — content max-width 1200px |

In Tailwind v4, use `@media (max-width: 767px)` / `@media (min-width: 768px)` etc., or Tailwind responsive prefixes `sm:`, `lg:` (confirm breakpoint config in `tailwind.config.*` if exists, else set in `@theme`).

### 3.2 Pattern Per Page Type

**Page Header** (`PageHead.tsx`):
- Desktop: `padding: 24px 28px 18px 28px; display:flex; gap:16`
- Mobile: `padding: 12px 16px; font-size of h1: 20px` (reduced from 24px); actions collapse to icon-only or move below title

**List / Card Grid** (Jobs, Discover, Network):
- Desktop: 2–3 column grid, `gap: 16px`
- Tablet: 2-column grid
- Mobile: single column, cards full-width, reduced padding `12px`

**Data Tables** (Bids pipeline, Contracts):
- Desktop: full table with all columns
- Mobile: horizontal scroll (`overflow-x: auto`) OR stack into card-per-row format showing key fields only

**Forms** (PostJob, Settings, Login, Signup):
- Desktop: centered `max-width: 640px` or split two-panel
- Mobile: `width: 100%; padding: 0 16px` full-width, stacked labels above inputs

**Detail Pages** (JobDetail, ContractDetail, ProjectDetail):
- Desktop: main content + right sidebar (e.g. apply action card)
- Mobile: linear stack, action card moves to bottom (sticky) or above fold

**Dashboard / Homepage**:
- Desktop: multi-column (welcome + hero + two-column feed + right sidebar)
- Mobile: single column scroll, stat cards in 2×2 grid, feed linearized

**Tabs** (`.tabs` class from `shared.css`):
- Desktop: horizontal tab row `padding: 0 28px; gap: 24px`
- Mobile: horizontal scroll (`overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar: none`), tabs don't wrap

**Minimum touch targets**: All interactive elements ≥ 44×44px on mobile (per Apple HIG / WCAG 2.5.5).

---

## 4. Page-by-Page Mapping

### 4.1 Auth Pages

| Design Mockup | App Route | Status | Notes |
|--------------|-----------|--------|-------|
| `Login.html` | `/login` | EXISTS — redesign | Recreate glassmorphism split layout: full-screen dark bg + hero left + card right. Current `Login.tsx` uses generic layout. |
| `Signup.html` | `/register` | EXISTS — redesign | Recreate B2B signup: company registration fields + role selection. Current `Register.tsx` is generic. |
| `VerifyEmail.html` | `/verify-email` + `/register/verify-sent` | EXISTS — redesign | Two states: sent-confirmation screen and verify-code entry. |
| `ForgotPassword.html` | `/forgot-password` (NEW route needed) | NEW — build | 3-step flow: enter email → sent confirmation → reset password form. Create `ForgotPasswordPage.tsx`. |

**Auth page design rule**: These pages do NOT use the sidebar/topbar layout shell. They use a standalone full-screen page with the dark hero treatment from `Login.html` (split: hero animation left 60% / card right 40% on desktop; card centered full-screen on mobile).

### 4.2 Core App Pages — Exists, Needs Redesign

| Design Mockup | App Route | Current File | Redesign Scope |
|--------------|-----------|--------------|----------------|
| `Homepage.html` | `/` → redirects to `/jobs` | `Home.tsx` | Dashboard page: greeting header + 4 stat cards + two-column layout (recommended projects + activity feed + right sidebar stats). Currently has a basic dashboard. Requires full redesign to match mockup. |
| `Projects.html` | `/jobs` | `JobBoardPage.tsx` | Job board = Projects list. Redesign card grid with project cards showing company logo square, budget badge, deadline, role badges (dev/design/mfg/mkt), "立即應標" button. Keep tabs (全部/開放中/已得標/已關閉). |
| `ProjectDetail.html` | `/jobs/:id` | `JobDetailPage.tsx` | Full redesign: RFP layout + left main + right sticky apply-card. Add Q&A section below, bidder list. |
| `PostProject.html` | `/jobs/new` | `PostJobPage.tsx` | 4-step stepper: 基本資訊 → 需求規格 → 預算時程 → 發布. Currently is a basic form. |
| `Bidding.html` | `/bids` | `MyBidsPage.tsx` | Pipeline view with 5-stage kanban + focus card stepper + countdown timers. Currently uses `PipelineCard` component. Redesign to match Bidding mockup. |
| `Contracts.html` | `/contracts` | `MyContractsPage.tsx` | Contracts list + status badges + milestone progress bars. Full redesign. |
| `Contracts.html` (detail) | `/contracts/:id` | `ContractDetailPage.tsx` | Contract detail with milestone stepper + deliverables + invoice section. |
| `Settings.html` | `/settings` | `Settings.tsx` | Full settings redesign: sections for 公司資訊/認證/團隊/方案/API金鑰/通知偏好. Currently gated behind `avatarSettings` flag — flag should be set to `true` in P2. |

### 4.3 New Pages to Build

| Design Mockup | New Route | New File | Priority |
|--------------|-----------|----------|----------|
| `Discover.html` | `/discover` | `DiscoverPage.tsx` | P2 — Explore companies: card grid + filter sidebar + industry tags |
| `Network.html` | `/network` | `NetworkPage.tsx` | P2 — Business connections: SVG network graph + connections list + invite cards |
| `Company.html` | `/company` | `MyCompanyPage.tsx` | P2 — My company profile management |
| `CompanyProfile.html` | `/companies/:id` | `CompanyProfilePage.tsx` | P2 — Other company's public profile + capability radar |
| `Profile.html` | `/profile` | `ProfilePage.tsx` | P3 — Personal public profile |
| `Notifications.html` | `/notifications` | `NotificationsPage.tsx` | P2 — Full notification center (bell already in topbar) |
| `Saved.html` | `/saved` | `SavedPage.tsx` | P3 — Saved companies + projects |
| `Search.html` | `/search` | `SearchPage.tsx` | P2 — Full-site search results (global search → this page) |
| `Reports.html` | `/reports` | `ReportsPage.tsx` | P3 — Industry reports (PRO feature) |
| `Insights.html` | `/insights` | `InsightsPage.tsx` | P3 — Analytics dashboard + network visualization |
| `Calendar.html` | `/calendar` | `CalendarPage.tsx` | P3 — Meeting scheduling + availability |
| `Pricing.html` | `/pricing` | `PricingPage.tsx` | P3 — Subscription plans comparison |
| `Help.html` | `/help` | `HelpPage.tsx` | P3 — Help center + FAQ |
| `Review.html` | `/reviews` or within contract | `ReviewPage.tsx` | P3 — Bidirectional rating flow |
| `404.html` | catch-all `*` | `NotFoundPage.tsx` | P1 — Replace `Navigate to /jobs` catch-all with proper 404 |
| `Maintenance.html` | `/maintenance` | `MaintenancePage.tsx` | P3 — Maintenance mode landing |
| `ChatOwl.html` | `/messages` | see §5 | P3 — Full chat feature un-park |

### 4.4 Role Badge Usage by Page

Role badges (`.bdg-dev / .bdg-design / .bdg-mfg / .bdg-mkt`) appear on:
- `Projects.html` — each project card shows required role type(s)
- `ProjectDetail.html` — header badge + bidder role badges
- `Bidding.html` — pipeline cards show project role type
- `Network.html` — connection cards show company's primary role
- `CompanyProfile.html` — capability tags
- `Homepage.html` — recommended project cards

**Domain mapping**: CoverOnes is a multi-vendor tender platform. Role badges map to the `category` or `type` field on listings/bids:
- `dev` → 軟體開發/IT
- `design` → 設計/UI/UX
- `mfg` → 製造/硬體/工程
- `mkt` → 行銷/業務/公關

The `ProjectCard` and `PipelineCard` components must accept a `role` prop and render the appropriate badge.

---

## 5. Chat Feature Plan

### 5.1 Current State

The chat feature exists but is **fully parked**:
- `featureFlags.ts`: `chat: false`
- Route: `/messages` wrapped in `<FeatureRoute flag="chat">` → shows "coming soon"
- Components exist: `src/components/chat/` has `ChatRoom.tsx`, `ChatList.tsx`, `ChatPopup.tsx`, `Composer.tsx`, `MessageGroup.tsx`, `MessageList.tsx`, `RoomHeader.tsx`, etc.
- API: `src/api/chat.ts` re-exports from `src/lib/api/chat.ts` (correct auth path, uses Zustand access token)

### 5.2 Design Reference

- **Desktop chat**: `design-reference/chat/project/src/chat.jsx` — sidebar room list + main chat view with message groups, reactions, composer, encryption badge
- **Mobile chat list**: `mobile.jsx` `MobileListScreen` — screen header + scrollable room rows
- **Mobile chat screen**: `mobile.jsx` `MobileChatScreen` + `MobileComposer` — full-screen chat, back button, phone/video icons, message bubbles, composer with attachment + send
- **Create room modal**: `design-reference/chat/project/src/modal.jsx` — Direct/Group tabs, searchable contacts
- The chat feature page (`/messages`) becomes a dedicated route that replaces the main layout with a two-panel view on desktop (sidebar + chat room) or a full-screen view on mobile.

### 5.3 Un-parking Plan

**Step 1 — Feature flag**: Set `chat: true` in `featureFlags.ts`. This makes `/messages` and `/contacts` visible.

**Step 2 — Messages route redesign**: `/messages` should render a full-screen chat layout that overrides the CoverOnes app chrome on mobile:
- Desktop: show `CoverOnesLayout` (sidebar + topbar) + in the main area: chat sidebar (room list, 280px) + chat panel
- Mobile: when no room selected → show `MobileListScreen` pattern (header + room list); when room selected → show `MobileChatScreen` (full-screen, hides bottom-nav)

**Step 3 — Mobile bottom-nav update**: Add "訊息" tab (5th item, MessageSquare icon, unread count badge) when `chat` flag is true. Current `CoverOnesMobileBottomNav.tsx` already has this logic via `ALL_TABS` array — it just needs the flag enabled.

**Step 4 — Component audit** (`src/components/chat/`):
- `ChatList.tsx` → redesign to match `mobile.jsx` `MobileListScreen` (list rows with avatar, name, preview, timestamp, unread badge)
- `ChatRoom.tsx` → audit against `chat.jsx`: verify message grouping, encryption badge (LockSmall icon), status icons (sent/delivered/read), reaction bar on hover
- `Composer.tsx` → match `MobileComposer` on mobile and `chatStyles.composer` on desktop: textarea with auto-grow, attachment button, send button (accent when text non-empty)
- `RoomHeader.tsx` → match `chatStyles.roomHeader`: avatar + name + online status + phone/video call buttons
- `CreateRoomModal.tsx` → match modal.jsx: Direct/Group tabs, searchable contact list, multi-select for groups, glassmorphism backdrop
- `ChatPopup.tsx` — desktop popup (bottom-right) — keep as-is for now; it is already shown when `openPopups` has rooms

**Step 5 — API integration**: `src/lib/api/chat.ts` provides the chat API. The `useChatStore` (Zustand) manages `rooms`, `openPopups`, active room. Verify these hooks work against the live backend once the flag is on.

**Step 6 — Contacts route**: `/contacts` → `Contacts.tsx` exists. Redesign to match `mobile.jsx` contacts tab: name list with role badge + online dot + "私訊" button.

### 5.4 Mobile Chat Specifics

When user is in a chat room on mobile:
- Bottom-nav MUST be hidden (`paddingBottom: 0` on content, no bottom-nav rendered)
- Screen header shows back arrow + room name + lock icon + call buttons
- Composer is pinned to bottom above keyboard (use `position: sticky; bottom: 0` or handle `visualViewport` for iOS keyboard push-up)
- Message input keyboard pushes content up — set `height: 100dvh` on the chat container (not `100vh`) to handle this correctly on iOS Safari

---

## 6. Phased Build Plan

Each phase is independently shippable (does not break existing functionality).

### P1 — Token + Shell + RWD Foundation (Week 1)

**Goal**: The dark B2B design system is the only source of truth. The shell (sidebar + topbar + bottom-nav + drawer) matches design mockups. All existing pages render correctly inside the new shell.

**Files to change**:

| Action | File |
|--------|------|
| UPDATE | `src/index.css` — unify token namespaces, add missing tokens (§1.5, §1.6), remove duplicate/conflicting values |
| REDESIGN | `src/components/layout/CoverOnesSidebar.tsx` — match `shared.css` `.sb` spec exactly |
| REDESIGN | `src/components/layout/CoverOnesTopbar.tsx` — match `shared.css` `.topbar` spec exactly (height 60px, search bar, me-pill) |
| REDESIGN | `src/components/layout/CoverOnesMobileBottomNav.tsx` — 5 tabs, proper active/badge styling, safe-area inset |
| REDESIGN | `src/components/layout/MobileDrawer.tsx` — match `mobile.jsx` drawer spec (300px, 220ms cubic-bezier) |
| CREATE | `src/components/layout/MobileScreenHeader.tsx` — 52px header for mobile screen tops |
| CREATE | `src/components/layout/MobileFAB.tsx` — 52×52 FAB component with useFAB context |
| UPDATE | `src/components/layout/CoverOnesLayout.tsx` — switch to CSS grid on desktop, wire MobileScreenHeader |
| UPDATE | `src/components/layout/AppShell.tsx` — CSS grid setup |
| CREATE | `src/components/layout/MobileFABContext.tsx` — context for pages to register FAB action |
| UPDATE | `src/App.tsx` — add `/forgot-password` and `/404` routes |
| CREATE | `src/pages/NotFoundPage.tsx` — replace catch-all Navigate with proper 404 page |

**Acceptance**: `npm run lint && npm run build` passes. On mobile, app shows bottom-nav + drawer. On desktop, sidebar is 240px and topbar is 60px. All existing routes render without layout breakage.

---

### P2 — Core Pages Redesign (Weeks 2–3)

**Goal**: The 8 live-data pages are pixel-perfect to the design mockups. New pages needed for core B2B flows are built.

**Files to change**:

| Action | File | Design Mockup |
|--------|------|--------------|
| REDESIGN | `src/pages/Home.tsx` | `Homepage.html` |
| REDESIGN | `src/pages/JobBoardPage.tsx` | `Projects.html` |
| REDESIGN | `src/pages/JobDetailPage.tsx` | `ProjectDetail.html` |
| REDESIGN | `src/pages/PostJobPage.tsx` | `PostProject.html` — 4-step stepper |
| REDESIGN | `src/pages/MyBidsPage.tsx` | `Bidding.html` — pipeline + focus card |
| REDESIGN | `src/pages/MyContractsPage.tsx` | `Contracts.html` |
| REDESIGN | `src/pages/ContractDetailPage.tsx` | `Contracts.html` (detail state) |
| REDESIGN | `src/pages/Login.tsx` | `Login.html` — full split layout |
| REDESIGN | `src/pages/Register.tsx` | `Signup.html` |
| REDESIGN | `src/pages/VerifyEmail.tsx` | `VerifyEmail.html` |
| REDESIGN | `src/pages/VerifyEmailSent.tsx` | `VerifyEmail.html` (sent state) |
| CREATE | `src/pages/ForgotPasswordPage.tsx` | `ForgotPassword.html` |
| CREATE | `src/pages/NotificationsPage.tsx` | `Notifications.html` |
| CREATE | `src/pages/SearchPage.tsx` | `Search.html` |
| REDESIGN | `src/pages/Settings.tsx` | `Settings.html` — enable `avatarSettings` flag |
| UPDATE | `src/components/marketplace/ProjectCard.tsx` | Add role badge + new card design |
| UPDATE | `src/components/marketplace/PipelineCard.tsx` | Match Bidding mockup cards |
| CREATE | `src/components/ui/RoleBadge.tsx` | `dev/design/mfg/mkt` badge component |
| CREATE | `src/components/ui/CompanyLogo.tsx` | Logo square (`.co-lg` variants) |
| UPDATE | `src/features/flags/featureFlags.ts` | `avatarSettings: true`, `kycOnboarding: true` |
| UPDATE | `src/App.tsx` | Add new routes |

**Acceptance**: All redesigned pages render pixel-perfect to mockups at 1440px and 375px. Role badges display correctly. `npm run lint && npm run build && npm test` passes.

---

### P3 — Chat Feature Un-park (Week 3–4)

**Goal**: `/messages` works as a full chat feature matching `chat.jsx` (desktop) and `mobile.jsx` (mobile). The bottom-nav shows Messages tab with unread count.

**Files to change**:

| Action | File | Notes |
|--------|------|-------|
| UPDATE | `src/features/flags/featureFlags.ts` | `chat: true`, `contacts: true` |
| REDESIGN | `src/pages/Messages.tsx` | Two-panel desktop / full-screen mobile wrapper |
| REDESIGN | `src/components/chat/ChatList.tsx` | Match `MobileListScreen` + desktop sidebar panel |
| REDESIGN | `src/components/chat/ChatRoom.tsx` | Match `chat.jsx` message groups + encryption badge |
| REDESIGN | `src/components/chat/Composer.tsx` | Match `MobileComposer` (mobile) + `chatStyles.composer` (desktop) |
| REDESIGN | `src/components/chat/RoomHeader.tsx` | Match `chatStyles.roomHeader` with call buttons |
| REDESIGN | `src/components/chat/CreateRoomModal.tsx` | Match modal.jsx Direct/Group tabs |
| REDESIGN | `src/pages/Contacts.tsx` | Contacts list with role badge + message button |
| UPDATE | `src/components/layout/CoverOnesMobileBottomNav.tsx` | Verify Messages tab shown when flag=true |
| UPDATE | `src/pages/ChatRoomPage.tsx` | Wire to new components |

**Acceptance**: Can navigate to `/messages`, see room list, open a room, send a message. On mobile, chat room is full-screen with back arrow, bottom-nav hidden during room view. `npm run lint && npm run build && npm test` passes.

---

### P4 — Remaining Pages + Polish (Week 4–5)

**Goal**: All 28 design mockup pages exist in the app. Polish animation, transitions, empty states.

**Files to change**:

| Action | File | Design Mockup |
|--------|------|--------------|
| CREATE | `src/pages/DiscoverPage.tsx` | `Discover.html` |
| CREATE | `src/pages/NetworkPage.tsx` | `Network.html` |
| CREATE | `src/pages/MyCompanyPage.tsx` | `Company.html` |
| CREATE | `src/pages/CompanyProfilePage.tsx` | `CompanyProfile.html` |
| CREATE | `src/pages/ProfilePage.tsx` | `Profile.html` |
| CREATE | `src/pages/SavedPage.tsx` | `Saved.html` |
| CREATE | `src/pages/ReportsPage.tsx` | `Reports.html` |
| CREATE | `src/pages/InsightsPage.tsx` | `Insights.html` |
| CREATE | `src/pages/CalendarPage.tsx` | `Calendar.html` |
| CREATE | `src/pages/PricingPage.tsx` | `Pricing.html` |
| CREATE | `src/pages/HelpPage.tsx` | `Help.html` |
| CREATE | `src/pages/ReviewPage.tsx` | `Review.html` |
| CREATE | `src/pages/MaintenancePage.tsx` | `Maintenance.html` |
| UPDATE | `src/App.tsx` | Wire all new routes |
| UPDATE | `src/components/layout/CoverOnesSidebar.tsx` | Add all nav items for new pages |
| UPDATE | `src/components/layout/CoverOnesMobileBottomNav.tsx` | Confirm 5-tab selection covers most-used pages |
| UPDATE | `src/index.css` | Add `@keyframes slideIn`, `@keyframes shimmer` for mobile page transitions + loading skeletons |

**Empty state rule**: Every list/grid page MUST have an empty state component matching the design (centered icon + title + CTA button) — no blank whitespace.

**Polish checklist**:
- [ ] `focus-visible` outlines on all interactive elements (2px indigo ring)
- [ ] Page transitions on mobile (slide-in animation for push navigation)
- [ ] Loading skeletons for all data-fetching sections
- [ ] Error states for failed API calls
- [ ] Toast notifications for actions (成功/失敗)

---

## 7. Open Ambiguities (ASK User Before Implementing)

These points are unclear from the design mockups alone and must be confirmed before the relevant phase starts:

1. **Homepage redirect**: Currently `/` redirects to `/jobs`. Should `/` become the `Homepage.html` dashboard, with `/jobs` being the job board? Or keep the redirect? **Impact**: P2 routing.

2. **Bottom-nav 5 tabs**: `mobile.jsx` uses: 聊天/聯絡人/群組/通知/設定. CoverOnes needs different tabs. Proposed: 首頁/案件/招標/合約/訊息. Confirm the 5 tabs before P1.

3. **Company switcher**: The sidebar has a company switcher widget. Does the API support multiple companies per user (企業多帳號)? If not, simplify to a static display of the current company. **Impact**: P1 sidebar.

4. **KYC gate**: `kycOnboarding: false` currently. Should KYC be gated (user must verify identity to post/bid), and when should this flag go `true`? **Impact**: P2 flow.

5. **Role badge data source**: What API field determines whether a listing is `dev/design/mfg/mkt`? Is there a `category` or `type` enum on the listing object? Confirm before building `RoleBadge` + card redesigns. **Impact**: P2.

6. **Chat backend**: Is the chat WebSocket/REST backend live? Without a real backend, the chat feature will have no data. Can it launch with mock data first? **Impact**: P3 go-live timing.

7. **ForgotPassword API**: Is the password reset endpoint live? What is its shape? **Impact**: P2 `ForgotPasswordPage`.

8. **Discover/Network/Company pages**: These require company directory API endpoints not mentioned in the current `featureFlags`. Are they available or TBD? **Impact**: P4 scheduling.

---

## 8. Implementation Notes for Frontend Engineers

- **Always open the matching `.html` file** in `design-reference/chat/project/` before writing any component. The HTML + `shared.css` are the spec.
- **Token usage**: Use `--co-*` tokens in Tailwind arbitrary values (`bg-[var(--co-bg)]`) or inline styles. NEVER hardcode hex values in `.tsx` files.
- **Icons**: The design uses `lucide`-style stroke icons at 1.75 stroke weight. The existing `src/components/ui/Icon.tsx` should be the single import point. Check it covers all needed icons before adding SVG inline.
- **No freelancing**: If a component or layout isn't in the design mockups, ASK before building.
- **Quality gate before every PR**: `npm run lint && npm run build && npm test` — all green.
- **Mobile-first implementation order**: Write mobile styles first, then enhance for desktop. Prevents the common mistake of building desktop-only and forgetting mobile.
- **Test at exactly 375px and 1440px**: These are the design viewport sizes. Use browser devtools device emulation.
