# Frontend Redesign Spec — ChatOwl

**Feature:** Full UI Redesign (Sidebar + ChatView Architecture)
**Design source:** `/Users/waynechen/_project/design/chat/project/ChatOwl.html`
**Target project:** `chat-web` — React 19 + TypeScript 5.9 + Vite 7 + Zustand + Tailwind CSS v4
**Branch:** `refactor/redesign-architecture`
**Author:** ui-designer
**Date:** 2026-04-23

---

## Design System Context

No `DESIGN.md` exists. Design tokens are inferred from the prototype's CSS variables and the existing `src/index.css` `@theme` block. The new tokens introduced by this redesign MUST be added to the `@theme` block in `src/index.css`.

The prototype uses `data-panel="light"` on `<html>` for light mode; the current codebase uses `html.dark` class. The redesign MUST reconcile these — see Section 2 (Color System) for the migration strategy.

---

## 1. Layout Architecture

### 1.1 Overall Shell

```
┌─────────────────────────────────────────────────────┐
│  AppShell  (display: flex; height: 100vh)           │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │   Sidebar    │  │       ChatArea              │  │
│  │   280px      │  │  flex: 1; min-width: 0      │  │
│  │  (flex-col)  │  │  (flex-col)                 │  │
│  │              │  │  ┌──────────────────────┐   │  │
│  │              │  │  │   TopNavbar  56px    │   │  │
│  │              │  │  ├──────────────────────┤   │  │
│  │              │  │  │   RoomHeader  64px   │   │  │
│  │              │  │  ├──────────────────────┤   │  │
│  │              │  │  │   MessageList        │   │  │
│  │              │  │  │   (flex: 1, scroll)  │   │  │
│  │              │  │  ├──────────────────────┤   │  │
│  │              │  │  │   Composer           │   │  │
│  │              │  │  └──────────────────────┘   │  │
│  └──────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**CSS layout (AppShell):**
```css
display: flex;
height: 100vh;
overflow: hidden;
background: var(--color-main-bg);
```

**Sidebar:**
- Width: `280px` (CSS var `--sidebar-w: 280px`)
- `flex-shrink: 0`
- `height: 100%`
- `border-right: 1px solid var(--color-sb-border)`
- `overflow: hidden` on root; only the rooms list section scrolls

**ChatArea:**
- `flex: 1; min-width: 0`
- `display: flex; flex-direction: column`
- `overflow: hidden` — children handle their own scroll

**Z-index stack:**
```
TopNavbar:           z-[600]  (existing --z-navbar)
Modal backdrop:      z-[400]  (existing --z-modal)
Mobile drawer:       z-[200]  (existing --z-sidebar-mobile)
Mobile drawer backdrop: z-[150]
FAB:                 z-[6]
Bottom nav:          z-[5]
```

### 1.2 Sidebar Internal Structure

```
Sidebar (aside)
├── SidebarBrand          — logo + name + "new chat" button
├── SidebarSearch         — search input
├── SidebarNav            — nav items list
├── SidebarSectionLabel   — "對話" heading + count
├── RoomList              — scrollable, flex: 1
│   ├── RoomRow × N
│   ├── SidebarSectionLabel — "在線上 (N)"
│   └── PresenceItem × N
└── SidebarFooter         — current user profile + settings icon
```

**SidebarBrand dimensions:**
- Height: `57px` (padding `14px 16px`, border-bottom)
- Logo icon: `30×30px` with gradient `var(--accent)` → `var(--indigo)`
- Brand name: `font-size: 15px; font-weight: 600; letter-spacing: -0.01em`
- Subtitle: `font-size: 11px; color: var(--sb-text-dim)`
- "+" button: `30×30px; border-radius: 8px; background: var(--accent)`

**SidebarSearch:**
- Padding: `12px 12px 4px 12px`
- Input box: `height: 34px; border-radius: 8px`
- Focus state: `border-color: var(--accent); background: var(--accent-soft)`

**SidebarNav:**
- Padding: `8px 8px 0 8px`
- Each NavItem: `height ~32px; padding: 7px 10px; border-radius: 8px`

**SidebarSectionLabel:**
- Padding: `14px 16px 6px 16px`
- `font-size: 11px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase`

**RoomList (scrollable area):**
- `flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 8px`
- Custom scrollbar: width `10px`, thumb `rgba(148,163,184,0.15)`, rounded

**SidebarFooter:**
- `margin-top: auto; padding: 10px 12px; border-top: 1px solid var(--sb-border)`
- Avatar size: `32px`
- Name: `font-size: 13px; font-weight: 500`
- Status line: `font-size: 11px; color: var(--green)`

### 1.3 ChatArea Internal Structure

```
ChatArea (div, flex-col)
├── TopNavbar             — global search + bell + user avatar
├── RoomHeader            — room-specific info + action buttons
├── MessageScroll         — flex: 1, overflow-y: auto
│   ├── EncryptionNotice
│   ├── DaySeparator
│   ├── MessageGroup × N
│   │   ├── Avatar (others only)
│   │   ├── SenderHeader (others only)
│   │   └── MessageBubble × N (each with ReactionBar)
│   └── TypingIndicator (optional)
└── Composer              — attachment strip + textarea + toolbar
```

---

## 2. Color System

### 2.1 Token Table

All tokens below MUST be added to `src/index.css` under `@theme`. The naming convention changes from the prototype's bare `var(--sb-bg)` to `var(--color-sb-bg)` to comply with Tailwind CSS v4's `@theme` token convention.

**Theme mechanism change:** The prototype sets `data-panel="light"` on `<html>` via `document.documentElement.dataset.panel`. The existing codebase toggles `html.dark` class. The redesign MUST use the `data-panel` attribute approach to match the design — update `useTheme.ts` accordingly.

| Token name (CSS var) | Dark (default) | Light (`[data-panel="light"]`) | Usage |
|---|---|---|---|
| `--color-accent` | `#2563EB` | `#2563EB` | Primary accent (blue) |
| `--color-accent-hover` | `#1D4ED8` | `#1D4ED8` | Accent hover |
| `--color-accent-soft` | `rgba(37,99,235,0.14)` | `rgba(37,99,235,0.14)` | Accent glow/bg |
| `--color-indigo` | `#6366F1` | `#6366F1` | Secondary accent |
| `--color-green` | `#059669` | `#059669` | Online status |
| `--color-cyan` | `#22D3EE` | `#22D3EE` | Encryption badge |
| `--color-red` | `#EF4444` | `#EF4444` | Unread badge, errors |
| `--color-amber` | `#F59E0B` | `#F59E0B` | Away status |
| `--color-sb-bg` | `#0B1220` | `#FFFFFF` | Sidebar background |
| `--color-sb-bg-2` | `#0F172A` | `#F8FAFC` | Sidebar secondary bg |
| `--color-sb-hover` | `rgba(255,255,255,0.04)` | `rgba(15,23,42,0.04)` | Sidebar row hover |
| `--color-sb-active` | `rgba(255,255,255,0.06)` | `rgba(37,99,235,0.08)` | Sidebar row active |
| `--color-sb-border` | `rgba(255,255,255,0.06)` | `rgba(15,23,42,0.08)` | Sidebar borders |
| `--color-sb-text` | `#E2E8F0` | `#0F172A` | Sidebar primary text |
| `--color-sb-text-dim` | `#94A3B8` | `#64748B` | Sidebar muted text |
| `--color-sb-tint` | `rgba(255,255,255,0.04)` | `rgba(15,23,42,0.04)` | Subtle bg tint |
| `--color-sb-tint-2` | `rgba(255,255,255,0.06)` | `rgba(15,23,42,0.06)` | Slightly stronger tint |
| `--color-main-bg` | `#111827` | `#F8FAFC` | Main area background |
| `--color-main-bg-2` | `#1E293B` | `#FFFFFF` | Cards, navbar, inputs |
| `--color-main-text` | `#E5E7EB` | `#0F172A` | Primary text |
| `--color-main-text-dim` | `#94A3B8` | `#64748B` | Muted/secondary text |
| `--color-main-border` | `rgba(255,255,255,0.08)` | `rgba(15,23,42,0.08)` | Main area borders |
| `--color-bubble-other` | `#1E293B` | `#F1F5F9` | Incoming message bubble |
| `--color-bubble-other-text` | `#E5E7EB` | `#0F172A` | Incoming message text |
| `--color-input-bg` | `#0F172A` | `#FFFFFF` | Input field background |

**Accent preset variants** (controlled by `useTheme` / settings):

| Preset | `--color-accent` | `--color-accent-hover` | `--color-accent-soft` |
|---|---|---|---|
| blue (default) | `#2563EB` | `#1D4ED8` | `rgba(37,99,235,0.14)` |
| indigo | `#6366F1` | `#4F46E5` | `rgba(99,102,241,0.14)` |
| teal | `#0D9488` | `#0F766E` | `rgba(13,148,136,0.14)` |
| violet | `#8B5CF6` | `#7C3AED` | `rgba(139,92,246,0.14)` |

**Density tokens** (set via `data-density` attribute on `<html>`):

| Attribute value | `--density-row` | `--density-gap` | `--density-pad` |
|---|---|---|---|
| `comfortable` (default) | `52px` | `10px` | `16px` |
| `compact` | `44px` | `6px` | `12px` |
| `spacious` | `60px` | `14px` | `20px` |

**Geometry tokens** (add to `@theme`):

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `12px` | Cards, modals |
| `--radius-bubble` | `10px` | Message bubbles (override existing `--radius-bubble-*`) |
| `--radius-input` | `8px` | Input fields |
| `--radius-chip` | `999px` | Badges, chips |
| `--navbar-h` | `56px` | TopNavbar height |
| `--sidebar-w` | `280px` | Sidebar width |
| `--shadow-pop` | `0 10px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)` | Dropdowns |
| `--shadow-modal` | `0 40px 80px -20px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.3)` | Modals |

### 2.2 Theme Application Mechanism

Replace the current `useTheme.ts` approach (toggling `html.dark`) with:

```typescript
// Apply dark/light panel
document.documentElement.dataset.panel = panel; // "dark" | "light"

// Apply density
document.documentElement.dataset.density = density; // "comfortable" | "compact" | "spacious"

// Apply accent (write CSS vars directly)
document.documentElement.style.setProperty('--color-accent', accentHex);
document.documentElement.style.setProperty('--color-accent-hover', accentHoverHex);
document.documentElement.style.setProperty('--color-accent-soft', accentSoftRgba);
```

The `[data-panel="light"]` CSS block MUST be in `src/index.css`. The `html` element carries both `data-panel` and `data-density` attributes simultaneously.

**Contrast verification** (WCAG AA 4.5:1 minimum):
- Dark: `--color-main-text` (#E5E7EB) on `--color-main-bg` (#111827) → ~12:1 — PASS
- Light: `--color-main-text` (#0F172A) on `--color-main-bg` (#F8FAFC) → ~19:1 — PASS
- Accent (#2563EB) on dark bg: ~4.6:1 — PASS (barely; do not use for small text below 14px)
- `--color-sb-text-dim` (#94A3B8 dark / #64748B light) on respective bgs — use only for supplementary text ≥12px

---

## 3. Typography

### 3.1 Font Families

Import both fonts via Google Fonts (already partially in `src/index.css`):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Update `src/index.css` `@theme`:
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Body `font-feature-settings: "cv11","ss01","ss03"` and `font-variant-numeric: tabular-nums` — add to `body` in `@layer base`.

### 3.2 Font Scale

| Role | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| Brand name | 15px | 600 | 1.2 | Sidebar logo |
| NavItem label | 13px | 500 | 1 | Sidebar nav items |
| Section label | 11px | 500 | 1 | "對話", "在線上" headers |
| Room title | 13px | 500 (600 if unread) | 1 | RoomRow primary |
| Room preview | 12px | 400 (500 if unread) | 1 | RoomRow subtitle |
| Room timestamp | 10.5px | 400 | 1 | RoomRow time |
| Unread badge | 10.5px | 600 | 16px (fixed) | Unread count |
| TopNavbar search | 13px | 400 | 1 | Placeholder text |
| Keyboard hint | 10.5px | 400 | 1 | "⌘K" label, mono font |
| RoomHeader title | 15px | 600 | 1 | Active room name |
| RoomHeader sub | 12px | 400 | 1 | Status/member count |
| Sender name | 13px | 600 | 1 | Message group header |
| Message text | 14px | 400 | 1.5 | Bubble content |
| Timestamp (msg) | 10.5px | 400 | 1 | Below own bubbles |
| Encryption label | 10px–11px | 400 | 1 | Encryption notice |
| PresenceItem name | 12.5px | 400 | 1 | Online user list |
| My name (footer) | 13px | 500 | 1 | Sidebar footer |
| Modal title | 16px | 600 | 1 | Modal heading |
| Modal sub | 12px | 400 | 1 | Modal description |
| Tab label | 13px | 500 | 1 | Modal tabs |
| Contact name | 13.5px | 500 | 1 | Contact row |
| Mobile header | 17px | 600 | 1 | Mobile screen title |
| Mobile chat title | 14px–15px | 600 | 1 | Mobile chat header |
| Bottom nav label | 10px | 500 | 1 | Mobile bottom nav |

---

## 4. Component Blueprints

### 4.1 `AppShell`

**File:** `src/components/layout/AppShell.tsx`

```typescript
interface AppShellProps {
  children: React.ReactNode; // renders <Sidebar> + <ChatArea>
}
```

**Replaces:** current `Layout.tsx` structure (keep room-loading logic there in `Layout.tsx`, which renders `<AppShell>`)

**Visual:** `display: flex; height: 100vh; overflow: hidden; background: var(--color-main-bg)`

**States:** none — purely structural

---

### 4.2 `Sidebar`

**File:** `src/components/layout/Sidebar.tsx` — REPLACE current file

```typescript
interface SidebarProps {
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  activeNav: NavId; // 'all' | 'contacts' | 'groups' | 'starred'
  onSelectNav: (nav: NavId) => void;
  search: string;
  onSearch: (q: string) => void;
  onOpenCreate: () => void;
}

type NavId = 'all' | 'contacts' | 'groups' | 'starred';
```

**States:**
| State | Visual |
|---|---|
| Default | `background: var(--color-sb-bg)`, `border-right: 1px solid var(--color-sb-border)` |
| Light mode | All `--color-sb-*` vars rewritten by `[data-panel="light"]` |

**Sub-components rendered inside Sidebar:**
- `SidebarBrand` (static, with `onOpenCreate` prop)
- `SidebarSearch` (controlled: `search`, `onSearch`)
- `SidebarNav` (controlled: `activeNav`, `onSelectNav`)
- `RoomList` (scrollable region, controlled: `activeRoomId`, `onSelectRoom`)
- `PresenceList` (inside RoomList scroll region)
- `SidebarFooter` (always rendered at bottom)

**Accessibility:**
- Root element: `<aside aria-label="對話側欄">`
- MUST NOT trap focus

---

### 4.3 `SidebarBrand`

**File:** `src/components/layout/SidebarBrand.tsx`

```typescript
interface SidebarBrandProps {
  onOpenCreate: () => void;
}
```

**States:**
| Element | Default | Hover |
|---|---|---|
| "+" button | `background: var(--color-accent)` | `background: var(--color-accent-hover)` |
| "+" button | no transform | `transform: none` (no scale in design) |

**Spec:**
- Owl icon: 30×30px SVG with gradient fill, NOT an `<img>` tag
- Button: `width: 30px; height: 30px; border-radius: 8px`
- Transition: `background 150ms ease-out`
- `aria-label="新增對話"` on button
- `focus-visible: outline` using `ring-2 ring-white/50`

---

### 4.4 `SidebarSearch` / `SidebarSearchInput`

**File:** `src/components/layout/SidebarSearchInput.tsx`

```typescript
interface SidebarSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string; // default: "搜尋對話..."
}
```

**States:**
| State | Border | Background |
|---|---|---|
| Default | `var(--color-sb-border)` | `var(--color-sb-tint)` |
| Focus | `var(--color-accent)` | `var(--color-accent-soft)` |
| Has value | Same as focus OR default, shows clear (X) button |

**Spec:**
- Container: `height: 34px; padding: 0 10px; border-radius: 8px; border: 1px solid`
- Search icon: `Icon.Search` size 14, color `var(--color-sb-text-dim)`
- Clear button: shown when `value !== ''`, icon `Icon.X` size 14, `aria-label="清除搜尋"`
- Input: `font-size: 13px; background: transparent; color: var(--color-sb-text)`
- Transition: `border-color 150ms ease-out, background 150ms ease-out`

---

### 4.5 `NavItem`

**File:** `src/components/layout/NavItem.tsx`

```typescript
interface NavItemProps {
  icon: keyof typeof Icon; // 'MessageSquare' | 'Users' | 'UserGroup' | 'Star'
  label: string;
  count?: number | null;
  active: boolean;
  onClick: () => void;
}
```

**States:**
| State | Background | Text color | Icon color |
|---|---|---|---|
| Default | transparent | `var(--color-sb-text-dim)` | `currentColor` |
| Hover | `var(--color-sb-hover)` | `var(--color-sb-text-dim)` | `currentColor` |
| Active | `var(--color-sb-active)` | `var(--color-sb-text)` | `var(--color-accent)` |

**Spec:**
- Element: `<button>` (NOT `<Link>` — nav changes what's shown in the sidebar, not page URL)
- `font-size: 13px; font-weight: 500; padding: 7px 10px; border-radius: 8px; width: 100%`
- Count badge: `font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--color-sb-tint-2); color: var(--color-sb-text-dim)`
- Transition: `background 150ms ease-out, color 150ms ease-out`
- `role="tab"` if used in tab group context, else `role="button"` (default for `<button>`)
- `focus-visible:ring-2 focus-visible:ring-white/50`

---

### 4.6 `RoomRow`

**File:** `src/components/layout/RoomRow.tsx`

```typescript
interface RoomRowProps {
  room: Room;
  active: boolean;
  onClick: () => void;
}
```

**States:**
| State | Background | Left bar |
|---|---|---|
| Default | transparent | hidden |
| Hover | `var(--color-sb-hover)` | hidden |
| Active | `var(--color-sb-active)` | shown: `3px wide; var(--color-accent)` |
| Unread | transparent/hover (unchanged) | hidden |

**Spec:**
- Element: `<button>` with `aria-pressed={active}` and `aria-label={roomTitle}`
- Layout: `display: flex; align-items: center; gap: 10px; padding: 8px 12px; margin: 0 8px; border-radius: 10px`
- Min height implied by content, NOT fixed (`var(--density-row)` from density tokens should NOT apply here — room rows are content-driven)
- Active bar: `position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 2px; background: var(--color-accent)`
- Transition: `background 150ms ease-out`

**Avatar slot:**
- DM: `<Avatar person={...} size={34} showDot ring />`
  - Avatar: `border-radius: size >= 40 ? 12px : 10px` (so 34px → `border-radius: 10px`)
  - Status dot: `width: max(8, round(34*0.28))=10px`; green for online, amber for away; outline `0 0 0 2px var(--color-sb-bg)`
- Group: `34×34px div; border-radius: 10px; background: linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.2)); border: 1px solid rgba(37,99,235,0.3)` with `Icon.Hash size={16}` in accent color

**Text block:**
- Title row: title (`font-size: 13px; font-weight: 600 if unread else 500; color: #fff if unread else var(--color-sb-text)`) + pinned icon + timestamp (`font-size: 10.5px; font-weight: 600 if unread`)
- Preview row: preview text + unread badge
- Unread badge: `font-size: 10.5px; font-weight: 600; padding: 0 6px; height: 16px; line-height: 16px; border-radius: 999px; background: var(--color-red); color: #fff; min-width: 16px`
- Pin icon: `Icon.Pin size={10}; opacity: 0.5; margin-left: 4px; vertical-align: middle`
- All text: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`

---

### 4.7 `PresenceItem`

**File:** `src/components/layout/PresenceItem.tsx`

```typescript
interface PresenceItemProps {
  person: Person;
  onClick?: () => void;
}
```

**States:**
| State | Background |
|---|---|
| Default | transparent |
| Hover | `var(--color-sb-hover)` |

**Spec:**
- `<button>`: `display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 8px; font-size: 13px; width: 100%`
- Avatar: `size={24} showDot`
- Name (zh): `flex: 1; font-size: 12.5px`
- Name (en, first word): `font-size: 11px; color: var(--color-sb-text-dim)`
- `focus-visible:ring-2 focus-visible:ring-white/50`

---

### 4.8 `SidebarFooter`

**File:** `src/components/layout/SidebarFooter.tsx`

```typescript
interface SidebarFooterProps {
  currentUser: Person;
  onOpenSettings: () => void;
}
```

**Spec:**
- Container: `padding: 10px 12px; border-top: 1px solid var(--color-sb-border); display: flex; align-items: center; gap: 10px`
- Avatar: `size={32} showDot ring`
- Name: `font-size: 13px; font-weight: 500` — "你 · Alex Chen" pattern
- Status text: `font-size: 11px; color: var(--color-green); display: flex; align-items: center; gap: 5px`
  - Green dot: `width: 6px; height: 6px; border-radius: 999px; background: var(--color-green); box-shadow: 0 0 6px rgba(5,150,105,0.6)`
  - Text: "線上 · End-to-end encrypted"
- Settings button: `padding: 6px; border-radius: 6px; color: var(--color-sb-text-dim)`, hover: `background: var(--color-sb-hover)`
- `aria-label="開啟設定"` on settings button

---

### 4.9 `Avatar`

**File:** `src/components/ui/Avatar.tsx` — EXTEND existing (not replace)

The existing `Avatar` component handles simple cases. The redesign needs gradient avatar support and exact pixel sizing:

```typescript
interface AvatarProps {
  // Existing props preserved:
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'away' | 'offline';
  className?: string;

  // NEW props:
  pixelSize?: number;        // exact px size, overrides size preset
  color?: [string, string];  // [gradientFrom, gradientTo]
  showDot?: boolean;         // alias for showStatus (design uses showDot)
  ring?: boolean;            // adds 2px ring using sb-bg color
}
```

**Gradient avatar (when `color` prop provided):**
- `background: linear-gradient(135deg, color[0], color[1])`
- `border-radius: pixelSize >= 40 ? 12px : 10px`
- Text: initials (first 2 chars if single word, or first+last initials)
- `color: #fff; font-weight: 600; font-size: round(pixelSize * 0.38)px; letter-spacing: -0.02em`

**Status dot (when `showDot={true}` or `showStatus={true}`):**
- `position: absolute; right: -2px; bottom: -2px`
- Size: `max(8, round(pixelSize * 0.28))px`
- Online: `background: var(--color-green); box-shadow: 0 0 0 2px var(--color-sb-bg), 0 0 0 3px rgba(5,150,105,0.25)`
- Away: `background: var(--color-amber); box-shadow: 0 0 0 2px var(--color-sb-bg)`
- Offline: dot NOT shown (design convention — only online/away dots displayed)

**Ring (when `ring={true}`):**
- `box-shadow: 0 0 0 2px var(--color-sb-bg)` on the avatar div

---

### 4.10 `TopNavbar`

**File:** `src/components/layout/TopNavbar.tsx` — REPLACE current `Navbar.tsx`

```typescript
interface TopNavbarProps {
  onOpenCreate?: () => void;
  currentUser: Person;
  totalUnread: number;
}
```

**States:**
| Element | Default | Hover |
|---|---|---|
| Icon buttons | `color: var(--color-main-text-dim); background: transparent` | `background: var(--color-main-bg)` |
| User avatar button | transparent | `background: var(--color-main-bg)` |
| Bell icon | normal | normal; red dot if `totalUnread > 0` |

**Spec:**
- Container: `height: var(--navbar-h) [56px]; display: flex; align-items: center; gap: 12px; padding: 0 20px; background: var(--color-main-bg-2); border-bottom: 1px solid var(--color-main-border); flex-shrink: 0`
- Global search bar: `max-width: 420px; width: 100%; height: 34px; border-radius: 8px; background: var(--color-main-bg); border: 1px solid var(--color-main-border); padding: 0 12px; margin: 0 auto`
  - Search icon size 14
  - Placeholder: `font-size: 13px; color: var(--color-main-text-dim)`
  - Keyboard hint "⌘K": `font-size: 10.5px; font-family: JetBrains Mono; padding: 1px 6px; border-radius: 4px; background: var(--color-main-bg-2); border: 1px solid var(--color-main-border); margin-left: auto`
  - The search bar is a `<button role="searchbox">` that opens a search modal (does NOT navigate)
- Bell button: `width: 34px; height: 34px; border-radius: 8px; position: relative`
  - Notification dot: `position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border-radius: 999px; background: var(--color-red); box-shadow: 0 0 0 2px var(--color-main-bg-2)`
  - `aria-label="通知"`, `aria-label` MUST include count if unread: `"{N} 則通知"`
- User avatar button: `display: flex; align-items: center; gap: 6px; padding: 4px 6px 4px 4px; border-radius: 8px`
  - Avatar size: 28px
  - ChevronDown icon size 14, `color: var(--color-main-text-dim)`
  - Transition: `background 150ms ease-out`
- All icon buttons: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30`
- `z-index: var(--z-navbar) [600]`

**Design note:** The current `Navbar.tsx` sits above the sidebar+content split. The redesign's `TopNavbar` sits INSIDE `ChatArea`, above the room header. The top-level nav bar is REMOVED — the sidebar carries the brand logo instead. This is a fundamental layout change.

---

### 4.11 `RoomHeader`

**File:** `src/components/chat/RoomHeader.tsx` — NEW component (split from `ChatRoom.tsx`)

```typescript
interface RoomHeaderProps {
  room: Room;
  currentUser: string;
  onOpenCall?: () => void;
  onOpenVideo?: () => void;
  onOpenMore?: () => void;
}
```

**States:**
| Element | Default | Hover |
|---|---|---|
| Icon buttons (Phone, Video, More) | `color: var(--color-main-text-dim); background: transparent` | `background: var(--color-main-bg)` |

**Spec:**
- Container: `height: 64px; display: flex; align-items: center; gap: 12px; padding: 0 24px; border-bottom: 1px solid var(--color-main-border); flex-shrink: 0`
- DM avatar: `size={38} showDot`
- Group avatar: `38×38px; border-radius: 10px; background: linear-gradient(135deg, var(--color-accent), var(--color-indigo)); color: #fff` with `Icon.Hash size={18}`
- Room title: `font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px`
  - Inline `<EncryptionBadge />` after title
- Subtitle: `font-size: 12px; color: var(--color-main-text-dim); display: flex; align-items: center; gap: 6px`
  - DM online: green dot `6px` + "線上 · {username}"
  - Group: topic string or "{N} 位成員"
- Group member stack (when type === 'group'): avatars `size={26} ring`, `margin-left: -8px` for overlap, `+N` overflow chip
- Action buttons: `width: 34px; height: 34px; border-radius: 8px`
  - Icons: `Icon.Phone size={17}`, `Icon.Video size={17}`, `Icon.MoreH size={17}`
  - `aria-label`: "語音通話", "視訊通話", "更多選項"
- Transition: `background 150ms ease-out, color 150ms ease-out`

---

### 4.12 `MessageGroup`

**File:** `src/components/chat/MessageGroup.tsx` — REFACTOR from `MessageBubble.tsx`

The design groups consecutive messages from the same sender. This grouping logic already exists in `ChatRoom.tsx` loosely. Extract into proper component.

```typescript
interface MessageGroupProps {
  messages: Message[];         // all from same sender, same day
  own: boolean;                // sender is currentUser
  sender: Person;              // sender Person object (for avatar + name)
}
```

**Layout:**
- `display: flex; gap: 12px; flex-direction: own ? 'row-reverse' : 'row'; margin-bottom: 14px; align-items: flex-start`
- Avatar column: `size={34}` (others only); own side has `width: 34px` spacer div
- Content column: `max-width: 68%; display: flex; flex-direction: column; align-items: own ? flex-end : flex-start`

**Sender header (others only, first message in group):**
- `font-size: 13px; font-weight: 600; color: var(--color-main-text)` — zh name
- `font-size: 11px; color: var(--color-main-text-dim)` — en name
- `font-size: 11px; color: var(--color-main-text-dim)` — "· {time} {EncryptionBadge}"
- `margin-bottom: 4px; padding-left: 2px`

**Individual bubble (within group):**
- Own: `background: var(--color-accent); color: #fff; border: none; box-shadow: 0 1px 0 rgba(0,0,0,0.1) inset`
- Others: `background: var(--color-bubble-other); color: var(--color-bubble-other-text); border: 1px solid var(--color-main-border)`
- Both: `padding: 9px 13px; border-radius: 12px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word`
- Subsequent bubbles in group: `margin-top: 3px`
- On hover: `ReactionBar` appears (see 4.13)

**Own bubble meta line** (below last own bubble in group):
- `font-size: 10.5px; color: var(--color-main-text-dim); display: flex; align-items: center; gap: 5px; justify-content: flex-end; margin-top: 3px; padding-right: 4px`
- `<EncryptionBadge />`, timestamp, `<StatusDot />`

---

### 4.13 `ReactionBar`

**File:** `src/components/chat/ReactionBar.tsx`

```typescript
interface ReactionBarProps {
  own: boolean;
  onReact: (emoji: string) => void;
}
```

**States:**
| State | Opacity | Transform |
|---|---|---|
| Default (hidden) | 0 | `translateY(4px)` |
| Parent `.msg-hover:hover &` | 1 | `translateY(0)` |

**Spec:**
- `position: absolute; top: -14px; [own ? 'left' : 'right']: 8px`
- `background: var(--color-main-bg-2); border: 1px solid var(--color-main-border); border-radius: 999px; padding: 3px 6px; display: flex; gap: 2px`
- `box-shadow: 0 6px 16px rgba(0,0,0,0.25)`
- `transition: opacity 150ms ease-out, transform 150ms ease-out`
- `pointer-events: none` when hidden, `pointer-events: auto` when shown
- Emojis: ["👍", "❤️", "🎉", "👀"] + Smile icon button
- Each emoji button: `width: 24px; height: 24px; border-radius: 999px; font-size: 13px`
- Hover on emoji: `background: rgba(255,255,255,0.06)`
- Implementation note: use CSS selector `.msg-hover:hover .reaction-bar` (global CSS) or a React `useState` on the wrapper

**Global CSS required** (add to `src/index.css`):
```css
.msg-hover:hover .reaction-bar {
  opacity: 1 !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}
```

---

### 4.14 `StatusDot` (message status indicator)

**File:** `src/components/chat/StatusDot.tsx`

```typescript
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface StatusDotProps {
  status: MessageStatus;
}
```

| Status | Visual |
|---|---|
| `sending` | `10×10px circle; border: 1.5px solid currentColor; opacity: 0.5` |
| `sent` | `Icon.Check size={12}; opacity: 0.6` |
| `delivered` | `Icon.CheckDouble size={13}; opacity: 0.6` |
| `read` | `Icon.CheckDouble size={13}; color: var(--color-cyan)` |

**Type migration:** Add `status?: 'sending' | 'sent' | 'delivered' | 'read'` field to `Message` type in `src/types/index.ts`.

---

### 4.15 `EncryptionBadge`

**File:** `src/components/chat/EncryptionBadge.tsx`

```typescript
interface EncryptionBadgeProps {
  color?: string; // default: "var(--color-cyan)"
}
```

- `display: inline-flex; align-items: center; gap: 3px; font-size: 10px; opacity: 0.7`
- Shows `Icon.LockSmall size={9}` (custom 12×12 SVG icon)
- `title="AES-256-GCM v2 · end-to-end encrypted"` on the wrapper span

---

### 4.16 `EncryptionNotice`

**File:** `src/components/chat/EncryptionNotice.tsx`

No props. Rendered once at the top of the message scroll area.

**Spec:**
- `margin: 0 auto 18px auto; max-width: 480px; text-align: center`
- `padding: 10px 14px; border-radius: 10px; background: var(--color-main-bg-2); border: 1px solid var(--color-main-border); font-size: 12px; color: var(--color-main-text-dim)`
- `display: flex; align-items: center; gap: 8px; justify-content: center`
- Content: `Icon.LockSmall size={11}` (cyan) + text with `<b>AES-256-GCM v2</b>` bolded

---

### 4.17 `DaySeparator`

**File:** `src/components/chat/DaySeparator.tsx`

```typescript
interface DaySeparatorProps {
  label: string; // "今天" | "昨天" | formatted date
}
```

**Spec:**
- `display: flex; align-items: center; gap: 12px; margin: 18px 0 14px 0; font-size: 11px; color: var(--color-main-text-dim); font-weight: 500; letter-spacing: 0.02em`
- Lines: `flex: 1; height: 1px; background: var(--color-main-border)`
- Label pill: `padding: 3px 10px; border-radius: 999px; background: var(--color-main-bg-2); border: 1px solid var(--color-main-border)`

---

### 4.18 `TypingIndicator`

**File:** `src/components/chat/TypingIndicator.tsx`

```typescript
interface TypingIndicatorProps {
  person: Person;
}
```

**Spec:**
- `display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-end`
- Avatar `size={28}`
- Bubble: `padding: 10px 14px; border-radius: 12px; background: var(--color-bubble-other); border: 1px solid var(--color-main-border); display: flex; gap: 4px; align-items: center`
- Three dots: `.typing-dot` class with `typingBounce` animation (see 4.23 Animations)

---

### 4.19 `Composer` (InputBar)

**File:** `src/components/chat/Composer.tsx` — REPLACE current `MessageInput.tsx`

```typescript
interface ComposerProps {
  onSend: (content: string) => void;
  roomTitle: string;
  disabled?: boolean;
}
```

**States:**
| State | composerBox border | composerBox shadow |
|---|---|---|
| Default (unfocused) | `var(--color-main-border)` | none |
| Focused | `var(--color-accent)` | `0 0 0 3px var(--color-accent-soft)` |

**Send button states:**
| State | Background | Color |
|---|---|---|
| Has content | `var(--color-accent)` | `#fff` |
| Empty | `rgba(148,163,184,0.15)` | `var(--color-main-text-dim)` |

**Spec (outer):**
- Padding: `10px 24px 18px 24px; border-top: 1px solid var(--color-main-border); flex-shrink: 0`

**Attachment preview strip** (optional, shown when file attached):
- `display: flex; gap: 8px; margin-bottom: 8px; padding: 8px 10px; background: var(--color-input-bg); border: 1px solid var(--color-main-border); border-radius: 8px; font-size: 12px; align-items: center`
- Icon + filename + size + X dismiss button

**Composer box:**
- `background: var(--color-input-bg); border: 1px solid [dynamic]; border-radius: 10px; padding: 10px 12px`
- `transition: border-color 150ms ease-out, box-shadow 150ms ease-out`

**Textarea:**
- `width: 100%; background: transparent; color: var(--color-main-text); resize: none; min-height: 22px; max-height: 140px; font-size: 14px; line-height: 1.5`
- `rows={1}` — auto-grow via `scrollHeight` measurement in `useEffect`
- `placeholder`: `"傳訊息到 {roomTitle}..."`
- `aria-label="輸入訊息"`
- Send on `Enter` (not `Shift+Enter`), `isComposing` guard preserved

**Toolbar (below textarea):**
- `display: flex; align-items: center; gap: 4px; margin-top: 8px`
- Paperclip button: `28×28px; border-radius: 6px; color: var(--color-main-text-dim)`, hover: `rgba(148,163,184,0.12)`; `aria-label="附件"`
- Image button: same; `aria-label="圖片"`
- Emoji button: same; `aria-label="表情符號"`
- Center badge: encryption status `"AES-256-GCM · end-to-end encrypted"` with cyan lock icon; `flex: 1; text-align: center; font-size: 11px; color: var(--color-main-text-dim)`
- Send button: `height: 30px; padding: 0 12px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px`; includes `Icon.Send size={14}` + "傳送" text

---

### 4.20 `Attachment` (in message)

**File:** `src/components/chat/Attachment.tsx`

```typescript
type AttachKind = 'image' | 'file';

interface AttachmentProps {
  attach: {
    kind: AttachKind;
    name: string;
    meta: string; // "1.2MB" | "MD · 8KB" etc
    url?: string;
  };
}
```

**Image attachment:**
- `margin-top: 6px; border: 1px solid var(--color-main-border); border-radius: 8px; overflow: hidden; max-width: 320px`
- Preview area: `height: 140px` with checkered placeholder gradient
- Footer: `padding: 8px 10px; background: rgba(0,0,0,0.15); font-size: 12px`

**File attachment:**
- `margin-top: 6px; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--color-main-border); border-radius: 8px; max-width: 320px`
- Icon container: `32×32px; border-radius: 6px; background: var(--color-accent-soft); color: var(--color-accent)` with `Icon.File size={16}`
- Name: `font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis`
- Meta: `font-size: 11px; color: var(--color-main-text-dim)`

---

### 4.21 `CreateModal`

**File:** `src/components/chat/CreateModal.tsx` — REPLACE current `CreateRoomModal.tsx`

```typescript
interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (config: { kind: 'dm' | 'group'; members: string[]; name: string }) => void;
}

type ModalTab = 'dm' | 'group';
```

**States:**
| State | Visual |
|---|---|
| Closed | `return null` |
| Opening | `animation: fadeIn 180ms ease-out` (backdrop), `popIn 200ms cubic-bezier(0.2, 0.9, 0.3, 1.2)` (modal) |
| DM tab active | Single contact selection |
| Group tab active | Multi-select + group name input |

**Animations (add to `src/index.css`):**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

**Spec:**
- Backdrop: `position: fixed; inset: 0; background: rgba(3,7,18,0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal) [400]`
- Click outside backdrop → close (but NOT click inside modal)
- Escape key → close
- Modal: `width: 480px; max-width: calc(100vw - 32px); max-height: 80vh; background: var(--color-main-bg-2); border: 1px solid var(--color-main-border); border-radius: 14px; box-shadow: var(--shadow-modal)`
- Header: icon (`36×36px; border-radius: 10px; background: var(--color-accent-soft); color: var(--color-accent)`) + title + close button
- Tabs: `display: flex; padding: 0 20px; border-bottom: 1px solid var(--color-main-border)`
  - Active tab: `color: var(--color-main-text); border-bottom: 2px solid var(--color-accent)`
  - Inactive: `color: var(--color-main-text-dim); border-bottom: 2px solid transparent`
  - Transition: `color 150ms ease-out`
- Body: `padding: 16px; overflow-y: auto; flex: 1; min-height: 0`
- Footer: `padding: 12px 20px; border-top: 1px solid var(--color-main-border); display: flex; align-items: center`
  - Left: encryption badge
  - Right: Cancel + Create buttons
- Cancel: `height: 34px; padding: 0 14px; border-radius: 8px; background: transparent; border: 1px solid var(--color-main-border); font-size: 13px; font-weight: 500`
- Create: `height: 34px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 500`; active: `background: var(--color-accent); color: #fff`; disabled: `background: rgba(148,163,184,0.2); color: var(--color-main-text-dim)`

**ARIA:**
- `role="dialog" aria-modal="true" aria-labelledby="modal-title"`
- Focus trapped inside modal when open
- On open, focus the first interactive element (search input for DM tab, group name input for group tab)
- On close, return focus to the trigger button

**ContactRow (inside modal):**
```typescript
interface ContactRowProps {
  person: Person;
  selected: boolean;
  onToggle: () => void;
  multi: boolean; // DM=false (radio), group=true (checkbox)
}
```
- `display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; width: 100%`
- Selected + hover: `background: rgba(148,163,184,0.08)`
- Selected: `background: var(--color-accent-soft); border: 1px solid var(--color-accent)` (on row)
- DM selected: `Icon.Check size={16}; color: var(--color-accent)` on right
- Group checkbox: `18×18px; border-radius: 5px`; unchecked: `border: 1.5px solid rgba(148,163,184,0.5)`; checked: `background: var(--color-accent); Icon.Check size={12}; color: #fff`

---

### 4.22 Icon System

**File:** `src/components/ui/Icon.tsx` — NEW file

The design uses custom Lucide-style stroke icons at `strokeWidth="1.75"`. The current codebase uses `lucide-react` library which uses `strokeWidth="2"`.

**Decision:** Create a local `Icon` component file that wraps the exact SVG paths from the prototype. This ensures pixel-perfect match without importing extra library icons that don't match.

```typescript
interface IconBaseProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

// Export all icons:
export const Icon = {
  Owl, Plus, Search, Bell, ChevronDown, MessageSquare, Users,
  UserGroup, Star, Hash, Lock, LockSmall, Send, Paperclip,
  Smile, Phone, Video, MoreH, MoreV, Check, CheckDouble,
  Settings, Menu, X, ArrowLeft, Paint, Sun, Moon,
  Smartphone, Monitor, Image, File, Pin, Reply, Heart
};
```

The `Owl` icon uses a gradient rect + circles for eyes. The `LockSmall` icon uses a custom `12×12` viewBox — keep it separate from other 24×24 icons.

**strokeWidth:** All icons use `strokeWidth="1.75"` and `strokeLinecap="round" strokeLinejoin="round"`.

---

### 4.23 Animations

Add these to `src/index.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-main-text-dim);
  animation: typingBounce 1.2s ease-in-out infinite;
  display: inline-block;
}

.msg-hover:hover .reaction-bar {
  opacity: 1 !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}
```

Typing dots delay pattern: `delay: 0ms, 150ms, 300ms`.

---

## 5. Mobile RWD

**Breakpoint:** `< 768px` — mobile layout activates. No tablet-specific layout (design shows only mobile vs desktop).

### 5.1 Mobile Layout

When `window.innerWidth < 768`:
- Sidebar is HIDDEN (use `hidden md:flex` pattern already in current code)
- `AppShell` renders only `ChatArea` (full width) OR `MobileListScreen` (full screen)
- Mobile navigation via `MobileBottomNav` (fixed at bottom, 72px)
- Sidebar content accessible via `MobileDrawer` (slide-in from left)
- FAB (Floating Action Button) for new chat: `52×52px; border-radius: 16px; background: var(--color-accent)`

### 5.2 `MobileBottomNav`

**File:** `src/components/layout/MobileBottomNav.tsx` — REPLACE current `BottomNav.tsx`

```typescript
interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

type MobileTab = 'chats' | 'contacts' | 'groups' | 'notif' | 'settings';
```

**Spec:**
- `position: fixed; bottom: 0; left: 0; right: 0; height: 72px; padding-bottom: 16px; background: var(--color-main-bg-2); border-top: 1px solid var(--color-main-border); display: flex; z-index: 5`
- 5 tabs: 聊天 (MessageSquare), 聯絡人 (Users), 群組 (UserGroup), 通知 (Bell, badge), 設定 (Settings)
- Each tab: `flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 4px 0`
- Active color: `var(--color-accent)`; inactive: `var(--color-main-text-dim)`
- Icon size: 20px; label `font-size: 10px; font-weight: 500`
- Badge on icon: `position: absolute; top: -4px; right: -8px; font-size: 9.5px; font-weight: 600; padding: 0 4px; min-width: 14px; height: 14px; border-radius: 999px; background: var(--color-red); color: #fff; box-shadow: 0 0 0 2px var(--color-main-bg-2)`

**Replace approach:** The current `BottomNav.tsx` uses emoji icons and a CSS class file. Replace with Tailwind classes and `Icon.*` components.

### 5.3 `MobileDrawer`

**File:** `src/components/layout/MobileDrawer.tsx` — NEW component

```typescript
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
  rooms?: Room[];
  onSelectRoom?: (roomId: string) => void;
}
```

**States:**
| State | Drawer transform | Backdrop opacity |
|---|---|---|
| Closed | `translateX(-100%)` | 0 |
| Open | `translateX(0)` | 1 (pointer-events: auto) |

**Spec:**
- Backdrop: `position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 15`; transition: `opacity 220ms`
- Drawer: `position: absolute; top: 0; left: 0; bottom: 0; width: 300px; background: var(--color-sb-bg); z-index: 20`
- Transition: `transform 220ms cubic-bezier(0.2,0.9,0.3,1)` (spring-like ease-out)
- Box shadow when open: `0 0 40px rgba(0,0,0,0.5)`
- Content mirrors `Sidebar` content: brand header, nav items, online presence list, footer
- Close on backdrop click or swipe-left gesture

**Touch gesture:**
- `onTouchStart`: record `clientX`
- `onTouchEnd`: if `dx < -50` and drawer is open → close
- If `dx > 50` and `touchX < 40` → open (edge swipe from left)

**ARIA:**
- `role="dialog" aria-modal="true" aria-label="選單"`
- Focus trap when open

### 5.4 Mobile Chat Screen

When a room is selected on mobile:
- Full-screen chat replaces list view
- Mobile chat header: `height: 56px; padding: 0 16px; display: flex; align-items: center; gap: 12px; background: var(--color-main-bg-2); border-bottom: 1px solid var(--color-main-border)`
  - Back button (`Icon.ArrowLeft size={20}`), avatar/icon, title + lock badge, Phone + Video buttons
- Message scroll: `padding: 12px 12px 6px 12px` (tighter than desktop)
- `MobileComposer` instead of desktop `Composer`:
  - `padding: 8px 12px 12px 12px; background: var(--color-main-bg-2); border-top: 1px solid var(--color-main-border); display: flex; gap: 8px; align-items: flex-end`
  - Paperclip button: `36×36px; border-radius: 8px`
  - Input pill: `flex: 1; background: var(--color-input-bg); border: 1px solid var(--color-main-border); border-radius: 20px; padding: 8px 14px`
  - Send button: `36×36px; border-radius: 999px; background: var(--color-accent) (if has content) or rgba(148,163,184,0.2)`

**Mobile message bubbles:**
- `max-width: 75%` (vs 68% desktop)
- `font-size: 13.5px` (vs 14px desktop)
- Bubble `padding: 8px 12px` (vs 9px 13px desktop)
- Status: simplified — no ReactionBar on mobile

---

## 6. Interactive States

### 6.1 Theme Toggle

**Hook:** `src/hooks/useTheme.ts` — REWRITE

```typescript
type PanelMode = 'dark' | 'light';
type AccentPreset = 'blue' | 'indigo' | 'teal' | 'violet';
type DensityMode = 'comfortable' | 'compact' | 'spacious';

interface ThemeConfig {
  panel: PanelMode;
  accent: AccentPreset;
  density: DensityMode;
}

export const useTheme = () => {
  // Persist to localStorage as JSON
  // Apply via:
  //   document.documentElement.dataset.panel = config.panel
  //   document.documentElement.dataset.density = config.density
  //   document.documentElement.style.setProperty('--color-accent', ...)
  //   document.documentElement.style.setProperty('--color-accent-hover', ...)
  //   document.documentElement.style.setProperty('--color-accent-soft', ...)
  
  return { config, setPanel, setAccent, setDensity, togglePanel };
};
```

Remove the `html.dark` class approach. The `[data-panel="light"]` CSS overrides in `src/index.css` handle everything.

### 6.2 Density Modes

CSS vars `--density-row`, `--density-gap`, `--density-pad` change based on `[data-density]` attribute. Components MUST use these vars instead of hardcoded values where applicable:
- `RoomRow` row height: `min-height: var(--density-row)` (optional — design uses content-driven height, but density pad can affect padding)
- Note: The prototype defines density vars but the `roomRow` padding is still `8px 12px` (fixed). Only apply density vars where the design explicitly uses them.

### 6.3 Message Bubble States

| Condition | Own bubble | Other bubble |
|---|---|---|
| Normal text | accent bg, white text | `--color-bubble-other` bg, `--color-bubble-other-text` |
| With image attachment | bubble + image preview card | same |
| With file attachment | bubble + file card | same |
| Status: sending | opacity slightly reduced (optional), ring spinner indicator | — |
| Status: sent | Check icon (single) | — |
| Status: delivered | CheckDouble icon, opacity 0.6 | — |
| Status: read | CheckDouble icon, `color: var(--color-cyan)` | — |

### 6.4 Unread Count Badges

- Sidebar `RoomRow`: `background: var(--color-red); color: #fff; min-width: 16px; height: 16px; line-height: 16px; padding: 0 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600`
- Display: ≤99 → number; >99 → "99+"
- `MobileBottomNav`: smaller badge (see Section 5.2)
- `TopNavbar` bell: 7px red dot (no count shown)

### 6.5 Typing Indicator

- Shown when backend signals that another user is typing
- Three dots with staggered `typingBounce` animation (see Section 4.23)
- Only visible in group rooms for the first non-me member who is typing
- On desktop, shown at the bottom of the message scroll area
- No typing indicator on mobile (design omits it)

---

## 7. Existing Code Analysis

### 7.1 Components to REPLACE

| Existing file | Reason | Replacement |
|---|---|---|
| `src/components/layout/Navbar.tsx` | Design removes top navbar entirely; TopNavbar moves inside ChatArea | `src/components/layout/TopNavbar.tsx` |
| `src/components/layout/Sidebar.tsx` | Fundamental visual redesign | `src/components/layout/Sidebar.tsx` (rewrite) |
| `src/components/layout/BottomNav.tsx` | Emoji icons, no badge support, CSS file | `src/components/layout/MobileBottomNav.tsx` |
| `src/components/layout/Layout.tsx` | Shell structure changes (no top navbar) | Keep file, rewrite JSX structure |
| `src/components/chat/MessageInput.tsx` | Missing toolbar, attachment UI, encryption badge | `src/components/chat/Composer.tsx` |
| `src/components/chat/MessageBubble.tsx` | Missing grouping, reaction bar, status dot | `src/components/chat/MessageGroup.tsx` + sub-components |
| `src/components/chat/CreateRoomModal.tsx` | CSS file, no DM/Group tabs, poor a11y | `src/components/chat/CreateModal.tsx` |

### 7.2 Components to EXTEND (not replace)

| Existing file | Changes needed |
|---|---|
| `src/components/ui/Avatar.tsx` | Add `pixelSize`, `color`, `showDot`, `ring` props; gradient background support |
| `src/hooks/useTheme.ts` | Rewrite to use `data-panel` attribute + accent/density support |
| `src/store/chatStore.ts` | No changes needed for this spec (data model compatible) |
| `src/types/index.ts` | Add `status` field to `Message` type; add `Person` type |

### 7.3 Components to REUSE (keep as-is)

| Existing file | Reason |
|---|---|
| `src/components/chat/ChatList.tsx` | Logic preserved; will render new `RoomRow` inside |
| `src/components/chat/RoomItem.tsx` | REPLACE with `RoomRow.tsx` (new visual spec) |
| `src/components/chat/ChatRoom.tsx` | Refactor to use new sub-components |
| `src/components/chat/MessageList.tsx` | Refactor to use new `MessageGroup` |
| `src/store/chatStore.ts` | Keep entirely |
| `src/api/chat.ts` | Keep entirely |
| `src/hooks/useSSE.ts` | Keep entirely |
| `src/features/chat/hooks/` | Keep entirely |
| `src/components/ui/Button.tsx` | Keep |
| `src/components/ui/Badge.tsx` | Keep |
| `src/components/ui/Input.tsx` | Keep |

### 7.4 New Files to Create

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          (NEW)
│   │   ├── SidebarBrand.tsx      (NEW)
│   │   ├── SidebarSearchInput.tsx (NEW)
│   │   ├── NavItem.tsx           (NEW)
│   │   ├── RoomRow.tsx           (NEW — replaces RoomItem.tsx)
│   │   ├── PresenceItem.tsx      (NEW)
│   │   ├── SidebarFooter.tsx     (NEW)
│   │   ├── TopNavbar.tsx         (NEW)
│   │   ├── MobileBottomNav.tsx   (NEW)
│   │   └── MobileDrawer.tsx      (NEW)
│   ├── chat/
│   │   ├── RoomHeader.tsx        (NEW)
│   │   ├── MessageGroup.tsx      (NEW)
│   │   ├── ReactionBar.tsx       (NEW)
│   │   ├── StatusDot.tsx         (NEW)
│   │   ├── EncryptionBadge.tsx   (NEW)
│   │   ├── EncryptionNotice.tsx  (NEW)
│   │   ├── DaySeparator.tsx      (NEW)
│   │   ├── TypingIndicator.tsx   (NEW)
│   │   ├── Composer.tsx          (NEW — replaces MessageInput.tsx)
│   │   ├── Attachment.tsx        (NEW)
│   │   └── CreateModal.tsx       (NEW — replaces CreateRoomModal.tsx)
│   └── ui/
│       └── Icon.tsx              (NEW — local icon system)
```

### 7.5 CSS Files to Remove

All `.css` import files in component directories should be replaced with Tailwind classes in JSX or `src/index.css` global styles. Files to remove after migration:
- `ChatList.css`, `ChatPopup.css`, `ContactList.css`, `CreateRoomModal.css`
- `MembersPanel.css`, `MessageList.css`, `RoomSettingsModal.css`
- `BottomNav.css`, `Layout.css`, `Navbar.css`, `Sidebar.css`

---

## 8. Implementation Checklist

Tasks are ordered by dependency. Each task MUST be completed and lint-clean before the next.

### Phase 1: Foundation (no visible change yet)

1. **Add design tokens to `src/index.css`**
   - Add all `--color-sb-*`, `--color-main-*`, `--color-accent*`, semantic color vars to `@theme`
   - Add `[data-panel="light"]` CSS block with light theme overrides
   - Add `[data-density="compact"]` and `[data-density="spacious"]` blocks
   - Add geometry tokens: `--radius-card`, `--radius-bubble`, `--radius-input`, `--radius-chip`, `--navbar-h`, `--sidebar-w`, `--shadow-pop`, `--shadow-modal`
   - Add animation keyframes: `fadeIn`, `popIn`, `typingBounce`
   - Add `.typing-dot` and `.msg-hover:hover .reaction-bar` global styles
   - Update font imports in `index.html` to include `JetBrains Mono`

2. **Rewrite `src/hooks/useTheme.ts`**
   - State: `{ panel, accent, density }` persisted to `localStorage` as JSON
   - Apply via `dataset.panel`, `dataset.density`, and `style.setProperty` for accent vars
   - Export `useTheme()` returning `{ config, togglePanel, setAccent, setDensity }`

3. **Extend `src/components/ui/Avatar.tsx`**
   - Add `pixelSize`, `color: [string, string]`, `showDot`, `ring` props
   - Implement gradient background when `color` prop provided
   - Implement `ring` box-shadow
   - Keep all existing props working

4. **Create `src/components/ui/Icon.tsx`**
   - Copy all SVG paths from prototype's `icons.jsx`
   - Export as `Icon` object with TypeScript types
   - Ensure `strokeWidth="1.75"` on all `IconBase`-derived icons

5. **Add `status` field to `Message` type in `src/types/index.ts`**
   - `status?: 'sending' | 'sent' | 'delivered' | 'read'`
   - Add `Person` type matching prototype's shape (if not already aliased from `User`)

### Phase 2: Atom Components

6. **Create `src/components/chat/EncryptionBadge.tsx`**
7. **Create `src/components/chat/EncryptionNotice.tsx`**
8. **Create `src/components/chat/DaySeparator.tsx`**
9. **Create `src/components/chat/StatusDot.tsx`**
10. **Create `src/components/chat/ReactionBar.tsx`**
11. **Create `src/components/chat/TypingIndicator.tsx`**
12. **Create `src/components/chat/Attachment.tsx`**

### Phase 3: Sidebar Components

13. **Create `src/components/layout/SidebarBrand.tsx`**
14. **Create `src/components/layout/SidebarSearchInput.tsx`**
15. **Create `src/components/layout/NavItem.tsx`**
16. **Create `src/components/layout/PresenceItem.tsx`**
17. **Create `src/components/layout/SidebarFooter.tsx`**
18. **Create `src/components/layout/RoomRow.tsx`** (replaces `RoomItem.tsx` visually)
    - Wire up to the same `Room` type + `useChatStore`
    - Ensure `aria-pressed` and `aria-label` are correct
19. **Rewrite `src/components/layout/Sidebar.tsx`**
    - Compose all sidebar sub-components
    - Replace current Tailwind `bg-primary-*` colors with new `--color-sb-*` vars
    - Keep room-loading logic in `Layout.tsx` (pass rooms as props or read from store)

### Phase 4: Chat Area Components

20. **Create `src/components/layout/TopNavbar.tsx`**
    - Global search button (opens modal, does not navigate)
    - Bell with unread dot
    - User avatar + chevron
    - No route-based logo link

21. **Create `src/components/chat/RoomHeader.tsx`**
    - Split out of `ChatRoom.tsx`
    - DM vs Group rendering
    - Phone, Video, MoreH action buttons

22. **Create `src/components/chat/MessageGroup.tsx`**
    - Grouping algorithm (consecutive messages from same sender, same day)
    - Sender header (others only)
    - Individual bubble rendering with `ReactionBar` overlay
    - Own bubble with meta line (`EncryptionBadge` + time + `StatusDot`)

23. **Create `src/components/chat/Composer.tsx`**
    - Auto-growing textarea (replace `MessageInput.tsx`)
    - Attachment preview strip
    - Toolbar: Paperclip + Image + Emoji + encryption badge + Send button
    - `Enter` to send, `Shift+Enter` for newline, IME guard

24. **Refactor `src/components/chat/ChatRoom.tsx`**
    - Replace `MessageInput` → `Composer`
    - Replace inline header → `RoomHeader`
    - Remove mobile back-button logic (will be handled in `MobileApp` screen management)

25. **Refactor `src/components/chat/MessageList.tsx`**
    - Replace flat `MessageBubble` render → grouped `MessageGroup` render
    - Add `DaySeparator` between day groups
    - Add `EncryptionNotice` at top
    - Add `TypingIndicator` at bottom (conditional)

### Phase 5: Modal

26. **Create `src/components/chat/CreateModal.tsx`**
    - Replace `CreateRoomModal.tsx`
    - DM tab: single-select contact list
    - Group tab: group name input + chip display + multi-select
    - Focus management, Escape key, backdrop click to close
    - `fadeIn` + `popIn` animations
    - ARIA: `role="dialog" aria-modal="true"`

### Phase 6: Mobile

27. **Create `src/components/layout/MobileBottomNav.tsx`**
    - 5 tabs with icon badges
    - Replace emoji-based `BottomNav.tsx`

28. **Create `src/components/layout/MobileDrawer.tsx`**
    - Slide-in sidebar with backdrop
    - Touch gesture: swipe-right from left edge to open, swipe-left to close
    - Focus trap

29. **Create mobile chat screen within `src/pages/Messages.tsx` or new `MobileChatScreen.tsx`**
    - Full-screen chat when room selected on mobile
    - Mobile composer (`MobileComposer`)
    - Back button returns to list

### Phase 7: App Shell & Routing

30. **Create `src/components/layout/AppShell.tsx`**
    - `display: flex; height: 100vh; overflow: hidden`
    - Desktop: `<Sidebar>` (280px) + `<ChatArea>` (flex: 1)
    - Mobile: sidebar hidden, full-width content

31. **Rewrite `src/components/layout/Layout.tsx`**
    - Remove `<Navbar />` (top bar eliminated)
    - Render `<AppShell>` wrapping `<Sidebar>` + `<main>`
    - Keep room-loading side effects
    - Bottom nav only on mobile

32. **Update `src/App.tsx`**
    - Call `useTheme()` at top level (apply `data-panel` + `data-density` to `<html>`)
    - Keep existing route structure

### Phase 8: Cleanup

33. **Remove old CSS files** (after verifying no remaining imports):
    - All `*.css` files listed in Section 7.5

34. **Remove old component files** no longer referenced:
    - `Navbar.tsx`, old `BottomNav.tsx`, old `MessageInput.tsx`, old `CreateRoomModal.tsx`, `RoomItem.tsx` (if superseded by `RoomRow.tsx`)

35. **Run `eslint` + `tsc --noEmit`** — resolve all errors to 0

---

## Spec Summary (for Lead)

**Mode:** Spec Mode — complete, ready to hand to frontend-engineer
**Design source:** `/Users/waynechen/_project/design/chat/project/ChatOwl.html` + all `src/*.jsx` files
**Output spec:** `/Users/waynechen/_project/chat-web/design-specs/frontend-redesign-spec.md`

### Scope

This spec covers a full visual redesign of `chat-web`. The backend API, Zustand store, SSE hooks, and auth flow are NOT changed. This is purely a UI layer replacement.

### Critical Architecture Changes

1. **No top navbar** — the global `<Navbar>` is eliminated. Brand identity moves to the sidebar header. Global search + user avatar move into `<TopNavbar>` inside the chat area.
2. **New app shell** — desktop is a fixed 280px sidebar + flex-grow chat area at `100vh`. The current routed-page layout (`/messages`, `/contacts` etc.) needs to be reconsidered — in the design prototype these are sidebar nav states, not separate pages.
3. **Theme system** — switches from `html.dark` class to `data-panel="dark|light"` attribute on `<html>`, enabling light/dark override of both sidebar and main area simultaneously.
4. **Icon system** — new local `Icon.tsx` with `strokeWidth="1.75"` (vs lucide-react's `2.0`).
5. **Message grouping** — messages are now grouped by sender + day; the current flat `MessageBubble` list is replaced by `MessageGroup`.

### New Components (35 tasks total)

- 4 atom chat components (EncryptionBadge, DaySeparator, StatusDot, ReactionBar, TypingIndicator, Attachment, EncryptionNotice)
- 7 sidebar sub-components
- 5 chat area components (TopNavbar, RoomHeader, MessageGroup, Composer, CreateModal)
- 3 mobile components (MobileBottomNav, MobileDrawer, MobileComposer)
- 1 icon system
- Infrastructure: token additions to `index.css`, theme hook rewrite, Avatar extension

### Frontend Engineer Instructions

- Read this spec top-to-bottom before writing any code
- Follow Phase 1 → Phase 8 order strictly — later phases depend on earlier ones
- All colors MUST use `var(--color-*)` tokens, not hardcoded hex values
- All interactive elements MUST have `:focus-visible` styles
- All icon buttons MUST have `aria-label`
- All `<img>` tags MUST have `alt`
- Minimum touch target: 44×44px for all mobile interactive elements
- Spec file path: `/Users/waynechen/_project/chat-web/design-specs/frontend-redesign-spec.md`
