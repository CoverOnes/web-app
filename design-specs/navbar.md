# Navbar Design Spec

## Overview

The Navbar is the persistent top bar present on all authenticated pages. It provides global navigation (logo/home link), a search bar, notifications access, and the user account dropdown. It is a brand surface and does not change between light and dark mode.

---

## Layout & Dimensions

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│  [owl]  ChatOwl   [──────────── Search ────────────]   🔔  [av] │
│  ←16px→ ←8px→                                         ←16px→   │
└─────────────────────────────────────────────────────────────────┘
height: 56px
```

- Height: **56px** (`h-14`)
- Background: `bg-primary-700` (`#1a2980`) — invariant across light/dark mode
- Shadow: `shadow-navbar` (`0 2px 4px rgba(0,0,0,0.20)`)
- Z-index: `z-navbar` (600) — above all other layers
- Layout: `flex items-center px-4` with three zones: left, center (flex-1), right

**Left zone** (`flex items-center gap-2 shrink-0`):
- Owl logo image: 32×32px, `rounded-full object-cover`
- App name "ChatOwl": `text-lg font-semibold text-white` (18px/600)
- Entire left zone is an `<a href="/">` wrapping both logo and text

**Center zone** (`flex-1 max-w-xl mx-6`):
- Search input bar (see States section)
- Full width of center zone, max-width 480px on very wide screens

**Right zone** (`flex items-center gap-3 shrink-0`):
- Bell icon button: 40×40px touch target, `lucide-react` `<Bell size={20} />`
- User avatar: 32px circle, `<img>` with `rounded-full object-cover`
- Chevron-down icon: `<ChevronDown size={16} />` indicating dropdown
- Avatar + chevron wrapped in a single `<button>` for dropdown trigger

### Mobile (< 768px)

```
┌──────────────────────────────────┐
│  ☰   ChatOwl                  🔔 │
└──────────────────────────────────┘
height: 48px
```

- Height: **48px** (`h-12`)
- Left: Hamburger icon button (`<Menu size={20} />`) 44×44px touch target
- Center: "ChatOwl" text only (logo hidden), `text-base font-semibold text-white`
- Right: Bell icon button 44×44px touch target
- Search bar hidden; search accessed via separate search page/modal
- User avatar dropdown hidden; profile accessed via Bottom Nav

### Tablet (768px–1023px)

- Height: 56px
- Same as desktop but center search bar width constrained to available space
- Avatar dropdown visible; hamburger replaces sidebar toggle

---

## Color & Typography

| Element | Token | Value |
|---------|-------|-------|
| Navbar background | `bg-navbar` | `primary-700` #1a2980 |
| App name text | `text-on-brand` | `neutral-000` #ffffff |
| Search bar background | `rgba(255,255,255,0.12)` | — |
| Search bar border | `rgba(255,255,255,0.20)` | — |
| Search bar text | `text-white` | #ffffff |
| Search placeholder | `rgba(255,255,255,0.55)` | — |
| Icon buttons | `text-white` | #ffffff |
| Icon button hover bg | `rgba(255,255,255,0.12)` | — |
| Dropdown menu bg (light) | `bg-white` | #ffffff |
| Dropdown menu bg (dark) | `bg-[#1a2438]` | — |
| Dropdown text (light) | `text-[#050505]` | — |
| Dropdown text (dark) | `text-[#e8eaf0]` | — |

App name typography: `text-lg font-semibold` (18px, weight 600)
Search input typography: `text-base` (14px, weight 400)

---

## States

### Search Bar

| State | Visual |
|-------|--------|
| Default | `bg-white/12 border border-white/20 rounded-full px-4 py-2` |
| Focus | `bg-white/18 border-white/40 ring-2 ring-white/30` — `focus-visible:ring-2` |
| Filled | Same as focus, with clear (X) button appearing at right |
| Hover | `bg-white/15 border-white/30` |

### Bell Icon Button

| State | Visual |
|-------|--------|
| Default | `text-white opacity-90` |
| Hover | `bg-white/12 rounded-full` transition-fast |
| Active/pressed | `bg-white/20` |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-primary-700 rounded-full` |
| Has notifications | Red dot badge (8px circle, `bg-danger-500`) positioned top-right of icon |

Notification badge: `absolute top-0.5 right-0.5 w-2 h-2 bg-danger-500 rounded-full` — no number shown in badge, count shown in dropdown panel.

### User Avatar / Dropdown Trigger

| State | Visual |
|-------|--------|
| Default | Avatar image + `<ChevronDown>` in `text-white/70` |
| Hover | `bg-white/12 rounded-full px-2 py-1` wrapping both avatar and chevron |
| Active | `bg-white/20` |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-white rounded-lg` |
| Dropdown open | ChevronDown rotates 180° (`rotate-180 transition-base`) |

### Hamburger Button (Mobile)

| State | Visual |
|-------|--------|
| Default | `text-white opacity-90` |
| Hover | `bg-white/12 rounded-md` |
| Active | `bg-white/20` |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-white rounded-md` |

---

## Dropdown Menu

Triggered by the user avatar button. Positioned absolute, anchored to bottom-right of trigger button.

```
┌────────────────────────────┐
│  [avatar 48px]             │
│  Full Name          ← name │
│  email@example.com ← email │
├────────────────────────────┤
│  👤 Profile                │
│  ⚙️  Settings              │
├────────────────────────────┤
│  🌓 Dark mode     [toggle] │
├────────────────────────────┤
│  🚪 Log out                │
└────────────────────────────┘
width: 240px
```

- `bg-white dark:bg-[#1a2438]`
- `rounded-xl shadow-xl border border-neutral-200 dark:border-[#2d3748]`
- `z-dropdown` (100)
- `py-2`
- Each menu item: `flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-white/8 transition-fast`
- Dividers: `border-t border-neutral-200 dark:border-[#2d3748] my-1`
- Closes on Escape key, on outside click, on menu item click
- Focus trapped within dropdown when open

---

## Interactions

- Logo click / app name click → navigate to `/` (chat list)
- Search bar focus → expand if needed, show recent searches dropdown
- Bell click → open notifications panel (slide-in from top-right, or route to `/notifications`)
- Avatar click → toggle user dropdown
- Hamburger (mobile) → toggle sidebar drawer overlay
- Dropdown item "Dark mode" → calls `useTheme().toggle()`, animates with `transition-theme` (300ms)
- Dropdown appears with `opacity-0 scale-95` → `opacity-100 scale-100` over `transition-base` (200ms)
- Dropdown disappears with reverse animation

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Navbar landmark | `<nav aria-label="Main navigation">` |
| Logo link | `<a href="/" aria-label="ChatOwl home">` |
| Search input | `<input type="search" aria-label="Search conversations" role="searchbox" />` |
| Bell button | `<button aria-label="Notifications" aria-haspopup="true">` |
| Notification badge | `<span aria-live="polite" aria-label="{count} unread notifications" className="sr-only">` |
| Avatar dropdown trigger | `<button aria-label="User menu" aria-haspopup="true" aria-expanded={isOpen}>` |
| Dropdown menu | `role="menu"`, each item `role="menuitem"` |
| Hamburger | `<button aria-label="Open menu" aria-expanded={isOpen} aria-controls="sidebar">` |
| Focus management | On dropdown close, focus returns to trigger button |
| Keyboard: dropdown | Arrow Up/Down to navigate items; Enter/Space to activate; Escape to close |
| Touch targets | All icon buttons: minimum 44×44px hit area via padding |

---

## Implementation Notes

### Component Structure

```
<Navbar>
  <NavbarLeft>
    <LogoLink href="/">
      <img src="/web_icon.jpg" alt="ChatOwl logo" />
      <span>ChatOwl</span>
    </LogoLink>
  </NavbarLeft>

  <NavbarCenter>           {/* hidden on mobile */}
    <SearchBar />
  </NavbarCenter>

  <NavbarRight>
    <NotificationBell />   {/* with badge */}
    <UserMenu>             {/* hidden on mobile */}
      <UserAvatar />
      <ChevronDown />
      <DropdownPanel />
    </UserMenu>
    <HamburgerButton />    {/* mobile only */}
  </NavbarRight>
</Navbar>
```

### Tailwind Classes (Key Patterns)

```tsx
// Navbar root
<nav className="fixed top-0 left-0 right-0 h-14 md:h-14 h-12 
                bg-primary-700 shadow-[0_2px_4px_rgba(0,0,0,0.20)] 
                z-[600] flex items-center px-4 gap-4">

// Logo link
<a className="flex items-center gap-2 shrink-0 
              focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-white focus-visible:ring-offset-2 
              focus-visible:ring-offset-primary-700 rounded-lg">

// Search bar
<input className="w-full bg-white/12 border border-white/20 
                  rounded-full px-4 py-2 text-white text-sm
                  placeholder:text-white/55
                  focus-visible:outline-none focus-visible:bg-white/18 
                  focus-visible:border-white/40 focus-visible:ring-2 
                  focus-visible:ring-white/30">

// Icon button
<button className="flex items-center justify-center w-10 h-10 
                   text-white/90 rounded-full 
                   hover:bg-white/12 active:bg-white/20
                   transition-[background-color] duration-150
                   focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-white focus-visible:ring-offset-1 
                   focus-visible:ring-offset-primary-700">
```

### Props

```tsx
interface NavbarProps {
  onHamburgerClick: () => void;
  onSearch: (query: string) => void;
  notificationCount?: number;
  user: {
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
}
```

### Responsive Visibility

```tsx
// Search bar — hidden on mobile
<div className="hidden md:flex flex-1 max-w-xl mx-6">

// User menu — hidden on mobile
<div className="hidden md:flex">

// Hamburger — visible only on mobile
<button className="flex md:hidden">
```

---

## Design Decisions

1. **No dark-mode flip for navbar**: The navbar stays `primary-700` in all modes — it is a brand surface per the design system.
2. **Frosted glass search bar**: Using `bg-white/12` and `border-white/20` instead of a fully opaque input avoids visual noise on the dark navbar background.
3. **Notification dot without count**: The badge dot only signals "there are notifications" — the exact count is revealed in the panel. This avoids layout jank from count changing.
4. **Logo image 32px**: Small enough to avoid dominating the nav; paired with the text wordmark "ChatOwl" for brand recognition.
