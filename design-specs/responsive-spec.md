# Responsive Spec — ChatOwl

斷點定義、各裝置佈局差異、行為規格。

---

## 1. Breakpoints

| 名稱 | 斷點 | Tailwind Prefix | 目標裝置 |
|------|------|-----------------|---------|
| `mobile` | 0 – 767px | default（無 prefix） | 手機（portrait）|
| `tablet` | 768px – 1023px | `md:` | 手機（landscape）、平板 |
| `desktop` | 1024px – 1279px | `lg:` | 筆電、桌機 |
| `wide` | 1280px+ | `xl:` | 大螢幕桌機 |

Tailwind v4 設定（在 `@theme {}` 中）：
```css
@theme {
  --breakpoint-sm:  640px;   /* Tailwind 預設，保留 */
  --breakpoint-md:  768px;
  --breakpoint-lg:  1024px;
  --breakpoint-xl:  1280px;
  --breakpoint-2xl: 1536px;
}
```

---

## 2. 主佈局（Sidebar + Chat）響應式

### 2.1 Desktop（≥ 1024px）

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar（h-14）fixed top                                    │
├────────────────┬────────────────────────────────────────────┤
│  Sidebar       │  Chat Area                                 │
│  w-80 (320px)  │  flex-1                                    │
│  fixed left    │  min-w-0                                   │
│                │                                            │
│  bg-primary-800│  bg-white dark:bg-neutral-800             │
│                │                                            │
└────────────────┴────────────────────────────────────────────┘
```

- Sidebar：固定寬 320px（`w-80`），不可調整（MVP）
- Chat Area：`flex-1 min-w-0`，填滿剩餘空間
- 兩者均 `h-[calc(100vh-56px)]` 並 `overflow-hidden`（各自內部 scroll）
- Popup Chat：顯示

### 2.2 Tablet（768px – 1023px）

```
┌──────────────────────────────────────────────────────┐
│  Navbar（h-14）                                      │
├──────────────────┬───────────────────────────────────┤
│  Sidebar         │  Chat Area                        │
│  w-[280px]       │  flex-1                           │
│  fixed left      │                                   │
│                  │                                   │
│  * 寬度縮為 280px │                                   │
└──────────────────┴───────────────────────────────────┘
```

- Sidebar：寬度 280px（`w-[280px]`）
- 搜尋框字體縮小：`text-xs`
- RoomItem：頭像縮為 40px（`w-10 h-10`）
- Navbar：搜尋框存在但寬度較窄，max-width 240px
- Popup Chat：最多 2 個（第 3 個隱藏）

### 2.3 Mobile（< 768px）

```
[Sidebar hidden — slides in from left]

┌──────────────────────────────────┐
│  Navbar（h-12）                  │
│  [☰] ChatOwl              🔔    │
├──────────────────────────────────┤
│                                  │
│  [對話列表 or Chat Room]         │
│  全螢幕（100vw × calc(100vh-48px)│
│                                  │
├──────────────────────────────────┤
│  Bottom Nav（h-14）fixed bottom  │
│  [💬 對話] [📞 通話] [👤 我]    │
└──────────────────────────────────┘
```

- Sidebar **隱藏**，以 overlay drawer 方式滑入
- Chat Area **全螢幕**
- 無 Popup Chat（改用全螢幕 Chat Room）
- Bottom Nav 替代部分 sidebar 功能

---

## 3. Sidebar Responsive 行為

### 3.1 Desktop / Tablet

- 常駐顯示（`fixed` 或 `static`，跟隨佈局）
- 無 overlay
- 不可手勢滑入/滑出

### 3.2 Mobile — Sidebar Drawer

```
[關閉時]                    [開啟時]
┌──────────────────────┐    ┌──────────────────┬──────────┐
│ Chat content         │    │ Sidebar w-[280px]│ Overlay  │
│                      │    │ bg-primary-800   │ bg-black/│
│                      │    │                  │ 50       │
│                      │    │ slide from left  │ backdrop │
└──────────────────────┘    └──────────────────┴──────────┘
```

```tsx
{/* Mobile sidebar overlay */}
<>
  {/* Backdrop */}
  {isSidebarOpen && (
    <div
      className="
        fixed inset-0 z-[200]
        bg-black/50 backdrop-blur-[2px]
        md:hidden
      "
      onClick={closeSidebar}
      aria-hidden="true"
    />
  )}

  {/* Sidebar drawer */}
  <aside
    id="sidebar"
    aria-label="對話列表"
    className={`
      fixed top-0 left-0 h-full z-[200]
      w-[280px]
      bg-primary-800 dark:bg-primary-900
      flex flex-col
      transition-transform duration-250 ease-in-out
      md:hidden
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
  >
    {/* Close button at top-right */}
    <button
      aria-label="關閉側邊欄"
      onClick={closeSidebar}
      className="absolute top-4 right-4 /* icon button white */"
    >
      <X size={20} />
    </button>
    <SidebarContent />
  </aside>
</>
```

- 開啟：`translate-x-0`，250ms ease-in-out
- 關閉：`-translate-x-full`，250ms ease-in
- 點擊 backdrop / Escape 關閉
- Hamburger button 觸發開啟

---

## 4. Navbar Responsive

| Element | Mobile（< 768px）| Tablet（768-1023px）| Desktop（≥ 1024px）|
|---------|-----------------|--------------------|--------------------|
| Hamburger（☰） | 顯示 | 顯示（觸控 sidebar） | 隱藏 |
| Logo image | 隱藏（省空間） | 顯示 | 顯示 |
| App name | 顯示（置中） | 顯示 | 顯示 |
| Search bar | 隱藏（另有搜尋） | 顯示（縮窄） | 顯示（最寬） |
| Bell icon | 顯示 | 顯示 | 顯示 |
| User menu | 隱藏（bottom nav） | 顯示 | 顯示 |
| Navbar height | 48px（`h-12`） | 56px（`h-14`）| 56px（`h-14`）|

```tsx
{/* Logo — hidden on mobile */}
<img src="/logo.png" className="hidden md:block w-8 h-8 rounded-lg" alt="" aria-hidden="true" />

{/* Search — hidden on mobile */}
<div className="hidden md:flex flex-1 max-w-md mx-4">
  <SearchBar />
</div>

{/* User menu — hidden on mobile */}
<div className="hidden md:block">
  <UserMenu />
</div>

{/* Hamburger — visible only on mobile & tablet */}
<button className="block lg:hidden /* icon button */">
  <Menu size={20} />
</button>
```

---

## 5. Bottom Navigation（Mobile Only）

```
┌─────────────────────────────────────────────────────┐
│  [💬 對話]      [🔔 通知]      [👤 我]             │
│  active: 藍底   muted          muted                │
└─────────────────────────────────────────────────────┘
height: 56px（h-14）
```

```tsx
<nav
  aria-label="主要導覽"
  className="
    fixed bottom-0 left-0 right-0 h-14
    z-[600]
    bg-white dark:bg-neutral-800
    border-t border-neutral-200 dark:border-neutral-700
    flex items-center
    md:hidden
    shadow-[0_-2px_8px_rgba(0,0,0,0.08)]
  "
>
  {navItems.map(item => (
    <button
      key={item.id}
      aria-label={item.label}
      aria-current={isActive(item) ? 'page' : undefined}
      className={`
        flex-1 flex flex-col items-center justify-center gap-0.5
        h-full
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-inset focus-visible:ring-accent-500
        ${isActive(item)
          ? 'text-primary-500'
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }
      `}
      onClick={() => navigate(item.path)}
    >
      <item.Icon size={22} strokeWidth={isActive(item) ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  ))}
</nav>
```

- 3 個 tab：對話（`/`）、通知（`/notifications`）、我（`/settings`）
- Active tab：`text-primary-500`，icon strokeWidth 2.5
- 未讀訊息在「對話」tab icon 右上角顯示紅點
- `pb-[56px]` 加在主內容區，避免 bottom nav 遮擋

---

## 6. Chat Room Responsive

### 6.1 Desktop / Tablet

- 在 sidebar 右側顯示
- Header：高 60px，顯示所有 action buttons
- Message list：fill 剩餘高度
- Input area：固定底部

### 6.2 Mobile

- 全螢幕（`fixed inset-0`，覆蓋 bottom nav，需 `z-[150]` 比 bottom nav 低）
- Header：高 56px，加返回按鈕 `<ChevronLeft>`，只保留 1 個 action button（Settings）
- 鍵盤出現時：input area 隨視口上移（`env(safe-area-inset-bottom)` 考量）

```tsx
{/* Mobile chat room */}
<div className="
  fixed inset-0 z-[150]
  flex flex-col
  bg-white dark:bg-neutral-800
  md:hidden md:static md:z-auto md:flex
">
  ...
</div>
```

### 6.3 Message Bubble 寬度

| Viewport | Max width |
|---------|-----------|
| Mobile | `max-w-[85%]` |
| Tablet | `max-w-[75%]` |
| Desktop | `max-w-[65%]` |

```tsx
<div className="max-w-[85%] md:max-w-[75%] lg:max-w-[65%] px-4 py-2.5 ...">
```

---

## 7. Auth 頁面 Responsive

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Card width | `w-full mx-4` | `max-w-md` | `max-w-md` |
| Card padding | `px-6 py-8` | `px-8 py-10` | `px-8 py-10` |
| Logo size | 64px | 72px | 72px |
| Title size | `text-2xl` | `text-[28px]` | `text-[28px]` |
| Background | 漸層全螢幕 | 漸層全螢幕 | 漸層全螢幕 |

---

## 8. Settings 頁面 Responsive

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| 佈局 | 無 sidebar，standalone 頁 | 有 sidebar | 有 sidebar |
| Content max-width | full | `max-w-xl` | `max-w-2xl` |
| Profile card | 縮小 padding `px-4 py-6` | `px-6 py-8` | `px-6 py-8` |
| Avatar | 64px | 72px | 72px |

Mobile 的 Settings 由 Bottom Nav「我」tab 進入，取代 sidebar 的 Settings 選項。

---

## 9. Popup Chat Responsive

| Viewport | 行為 |
|---------|------|
| Desktop（≥ 1024px） | 右下角浮窗，最多 3 個 |
| Tablet（768-1023px） | 右下角浮窗，最多 2 個 |
| Mobile（< 768px） | **不使用 Popup**，改為開啟全螢幕 Chat Room |

---

## 10. Safe Area（iOS notch / home bar）

```css
/* src/index.css — 全域 safe area 設定 */
@layer base {
  body {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

Mobile Bottom Nav：
```tsx
<nav className="... pb-[env(safe-area-inset-bottom)]" style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }}>
```

---

## 11. Responsive 測試矩陣

| 功能 | Mobile（375px） | Tablet（768px）| Desktop（1280px）|
|------|----------------|----------------|-----------------|
| Login 表單 | ✓ | ✓ | ✓ |
| Sidebar（常駐） | Drawer | ✓ | ✓ |
| Sidebar（Drawer） | ✓ | ✓ | N/A |
| Bottom Nav | ✓ | N/A | N/A |
| Navbar 搜尋 | N/A | ✓ | ✓ |
| ChatRoom（內嵌） | N/A | ✓ | ✓ |
| ChatRoom（全螢幕） | ✓ | N/A | N/A |
| Popup Chat | N/A | ✓（max 2） | ✓（max 3）|
| Settings | Bottom Nav 進入 | Sidebar 進入 | Sidebar 進入 |
| Keyboard 避讓 | ✓（input area） | 無需 | 無需 |

---

## 12. Touch Interaction 規格（Mobile）

| 互動 | 行為 |
|------|------|
| 長按 MessageBubble | 顯示操作選單（複製、刪除、回應） |
| 左滑 RoomItem（Drawer 中） | 顯示「刪除」快捷操作 |
| 下拉刷新（訊息列表） | `overscroll-y-auto`，呼叫 refresh API |
| 點擊 avatar | 前往用戶個人資料（未來功能） |
| 點擊 Popup（mobile） | 改為導航到全螢幕 Chat Room |

Touch targets：所有可點擊元素最小 44×44px（用 `min-h-[44px] min-w-[44px]` 或 padding 達成）。
