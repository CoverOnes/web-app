# Pages Spec — ChatOwl

每個頁面的完整佈局、間距、配色、交互說明。所有顏色引用 `design-tokens.md`，所有元件引用 `components-spec.md`。

---

## 1. Login / Register 頁

### 1.1 佈局結構

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│          [藍色漸層全頁背景]                          │
│                                                     │
│    ╔═══════════════════════════════════════╗        │
│    ║  [Logo 圓角圖 72px]                   ║        │
│    ║  ChatOwl                              ║        │
│    ║  ─────────────────────────────────── ║        │
│    ║  歡迎回來                             ║        │
│    ║                                       ║        │
│    ║  帳號 ________________________        ║        │
│    ║  密碼 ________________________        ║        │
│    ║                                       ║        │
│    ║  [──────── 登入 ──────────]           ║        │
│    ║                                       ║        │
│    ║  還沒有帳號？ 立即註冊               ║        │
│    ╚═══════════════════════════════════════╝        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 背景

```tsx
<div className="
  min-h-screen
  bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600
  flex items-center justify-center
  p-4
">
```

背景漸層：`from-primary-800`(#162566) → `via-primary-700`(#1a2f7a) → `to-primary-600`(#1e3a8a)，方向 135°（左上到右下）。

背景裝飾（optional）：大型半透明圓形 blur 元素，`bg-accent-500/10 blur-[120px] rounded-full w-96 h-96 absolute` 放右上角和左下角，增添深度感。

### 1.3 Auth 卡片

```tsx
<div className="
  w-full max-w-[400px]
  bg-white dark:bg-neutral-800
  rounded-2xl
  shadow-[0_25px_50px_rgba(14,27,74,0.25)]
  px-8 py-10
">
```

- 寬度：最大 400px，行動版 `w-full` + `mx-4`
- 圓角：`rounded-2xl`（16px）
- 陰影：深藍色調陰影 `shadow-[0_25px_50px_rgba(14,27,74,0.25)]`
- 內距：`px-8 py-10`（32px/40px）

### 1.4 卡片內容結構

```tsx
{/* Logo 區 */}
<div className="flex flex-col items-center mb-8">
  <img
    src="/logo.png"
    alt="ChatOwl"
    className="w-18 h-18 rounded-2xl mb-3 shadow-md"
  />
  <h1 className="text-[28px] font-bold text-neutral-900 dark:text-neutral-100">
    ChatOwl
  </h1>
  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
    歡迎回來，請登入您的帳號
  </p>
</div>

{/* 表單 */}
<form className="flex flex-col gap-4" noValidate>
  {/* Error banner */}
  {error && (
    <div className="
      flex items-center gap-2 px-4 py-3
      bg-error-100 dark:bg-error-500/15
      border border-error-500/30
      rounded-lg text-sm text-error-500
    " role="alert">
      <AlertCircle size={16} />
      {error}
    </div>
  )}

  {/* Email input */}
  <div className="flex flex-col gap-1.5">
    <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
      電子郵件
    </label>
    <input
      id="email"
      type="email"
      autoComplete="email"
      placeholder="your@email.com"
      className="/* Text Input 規格見 components-spec.md */"
    />
  </div>

  {/* Password input */}
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        密碼
      </label>
      <a href="/forgot-password" className="text-xs text-accent-500 hover:text-accent-600 font-medium">
        忘記密碼？
      </a>
    </div>
    <div className="relative">
      <input
        id="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        className="/* Text Input + pr-11 */"
      />
      <button
        type="button"
        aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>

  {/* Submit */}
  <button
    type="submit"
    disabled={isLoading}
    className="/* Primary button lg */ mt-2"
  >
    {isLoading ? <Spinner /> : '登入'}
  </button>
</form>

{/* Switch mode */}
<p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
  還沒有帳號？
  <button
    onClick={switchToRegister}
    className="text-accent-500 hover:text-accent-600 font-semibold ml-1 focus-visible:outline-none focus-visible:underline"
  >
    立即註冊
  </button>
</p>
```

### 1.5 Register 頁差異

- 標題改為「建立帳號」，subtitle 改「開始你的 ChatOwl 旅程」
- 額外欄位：「顯示名稱」（第一個）、「確認密碼」（最後）
- Submit button 文字「建立帳號」
- 底部改「已有帳號？ 登入」

### 1.6 States

| State | Behavior |
|-------|---------|
| Default | 表單可輸入 |
| Loading | Submit button loading，所有輸入框 disabled |
| Error | Error banner 出現，shake animation on card（`animate-shake`） |
| Success（登入） | Button 短暫顯示 ✓，300ms 後 navigate to `/` |

### 1.7 Accessibility

- `<form>` 有 `noValidate`，前端自行驗證
- 每個 `input` 有對應的 `<label>` 用 `htmlFor/id` 關聯
- Error banner 有 `role="alert"`（screen reader 即時讀取）
- Password toggle button 有語意化 `aria-label`
- Tab 順序：email → password → submit → switch link

---

## 2. 主佈局（Sidebar + Chat）

### 2.1 大架構

```
Desktop (≥ 1024px)
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (h-14, z-[600])                                         │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  Sidebar         │  Chat Area                                   │
│  w-80 (320px)    │  flex-1                                      │
│  bg-primary-800  │  bg-white dark:bg-neutral-800               │
│                  │                                              │
│  fixed height:   │  - Chat Room Header                         │
│  calc(100vh-56px)│  - Message List (scrollable)                │
│                  │  - Input Area (sticky bottom)               │
└──────────────────┴──────────────────────────────────────────────┘
```

### 2.2 Root Layout Classes

```tsx
<div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
  <Navbar />  {/* fixed top-0 left-0 right-0 h-14 z-[600] */}

  <div className="flex flex-1 pt-14"> {/* offset for fixed navbar */}
    {/* Sidebar */}
    <aside
      id="sidebar"
      className="
        w-80 flex-none
        h-[calc(100vh-56px)]
        bg-primary-800 dark:bg-primary-900
        flex flex-col
        overflow-hidden
      "
    >
      <SidebarContent />
    </aside>

    {/* Main content */}
    <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-56px)]">
      {selectedRoom ? <ChatRoom /> : <EmptyChat />}
    </main>
  </div>
</div>
```

---

## 3. Sidebar 詳細規格

### 3.1 佈局

```
┌──────────────────────────┐
│  [Logo 24px] ChatOwl     │  ← header h-[52px] px-4
├──────────────────────────┤
│  🔍 搜尋對話...          │  ← search bar my-2 mx-3
├──────────────────────────┤
│  [AV+dot] Room A   12:30 │  ← room item h-[72px]
│           最後訊息...  ●3 │
│                          │
│  [AV+dot] Room B   昨天  │
│           Hello!         │
│           ...            │
│  ← (scrollable area)     │
├──────────────────────────┤
│  [＋ 新增對話]           │  ← footer h-[52px]
└──────────────────────────┘
```

### 3.2 Sidebar Header

```tsx
<div className="
  flex items-center justify-between
  h-[52px] px-4
  border-b border-white/10
  flex-none
">
  <div className="flex items-center gap-2">
    <img src="/logo.png" alt="" className="w-6 h-6 rounded-md" aria-hidden="true" />
    <span className="text-base font-semibold text-white">ChatOwl</span>
  </div>
  {/* 新增按鈕（桌面版也可放這） */}
  <button
    aria-label="新增對話"
    className="/* icon button 白色版 w-8 h-8 */"
  >
    <Plus size={18} />
  </button>
</div>
```

### 3.3 Search Bar

見 `components-spec.md` 2.2 節。高度 36px（`h-9`），位置 `mx-3 my-2`。

### 3.4 Room List

```tsx
<nav aria-label="對話列表">
  <ul
    role="listbox"
    aria-label="對話列表"
    className="
      flex-1 overflow-y-auto
      overscroll-contain
      scroll-smooth
      py-1
      /* 自訂 scrollbar */
      [&::-webkit-scrollbar]:w-1
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-white/20
      [&::-webkit-scrollbar-thumb]:rounded-full
    "
  >
    {rooms.map(room => (
      <li key={room.id} role="presentation">
        <RoomItem room={room} isActive={selectedRoomId === room.id} />
      </li>
    ))}
  </ul>
</nav>
```

### 3.5 Sidebar Footer

```tsx
<div className="
  flex-none h-[52px] px-3
  border-t border-white/10
  flex items-center
">
  <button className="
    w-full flex items-center gap-2 px-3 py-2 rounded-xl
    text-white/70 hover:text-white hover:bg-white/8
    text-sm font-medium
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-white/50 focus-visible:ring-inset
  ">
    <Plus size={18} />
    新增對話
  </button>
</div>
```

---

## 4. Chat Room

### 4.1 佈局

```
┌─────────────────────────────────────────────────┐
│  Chat Header (h-[60px])                         │
│  [← back] [AV] Room Name  [members]  [settings]│
├─────────────────────────────────────────────────┤
│                                                 │
│  Message List (flex-1, overflow-y-auto)         │
│                                                 │
│  [date divider: 今天]                           │
│                                                 │
│  [AV] Alice                                     │
│  ┌─────────────────────┐                        │
│  │ 你好！              │                        │
│  │ 10:30               │                        │
│  └─────────────────────┘                        │
│                                                 │
│                       ┌──────────────────────┐  │
│                       │ 在的，有什麼事嗎？   │  │
│                       │ 10:31           ✓✓   │  │
│                       └──────────────────────┘  │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Input Area (flex-none)                         │
│  [___________________________] [▶ Send]         │
└─────────────────────────────────────────────────┘
```

### 4.2 Chat Header

```tsx
<header className="
  flex items-center gap-3 px-4
  h-[60px] flex-none
  bg-white dark:bg-neutral-800
  border-b border-neutral-200 dark:border-neutral-700
  shadow-sm
">
  {/* Mobile back button */}
  <button
    aria-label="返回對話列表"
    className="/* icon button md */ md:hidden"
  >
    <ChevronLeft size={20} />
  </button>

  {/* Avatar */}
  <div className="relative flex-none">
    <img
      src={roomAvatar}
      alt={`${roomName} 的頭像`}
      className="w-10 h-10 rounded-full object-cover"
    />
    {status && (
      <span className={`
        absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
        border-2 border-white dark:border-neutral-800
        ${status === 'online' ? 'bg-success-500' : 'bg-neutral-400'}
      `} aria-hidden="true" />
    )}
  </div>

  {/* Room info */}
  <div className="flex-1 min-w-0">
    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
      {roomName}
    </h2>
    <p className="text-xs text-neutral-500 dark:text-neutral-400">
      {isGroup ? `${memberCount} 位成員` : (status === 'online' ? '在線中' : '離線')}
    </p>
  </div>

  {/* Action buttons */}
  <div className="flex items-center gap-1 flex-none">
    <button aria-label="通話" className="/* icon button md text-neutral-500 hover:text-primary-500 */">
      <Phone size={20} />
    </button>
    <button aria-label="視訊" className="/* icon button md */">
      <Video size={20} />
    </button>
    <button aria-label="設定" className="/* icon button md */">
      <Settings size={20} />
    </button>
  </div>
</header>
```

### 4.3 Message List

```tsx
<div
  className="
    flex-1 overflow-y-auto
    px-4 py-4
    flex flex-col gap-1
    overscroll-contain
    scroll-smooth
  "
  role="log"
  aria-label="訊息列表"
  aria-live="polite"
  aria-relevant="additions"
>
  {/* Date Divider */}
  <div className="flex items-center gap-2 py-3" role="separator">
    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
    <span className="text-xs text-neutral-400 dark:text-neutral-500 px-2 select-none">
      今天
    </span>
    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
  </div>

  {/* Messages */}
  {messages.map(msg => (
    <MessageBubble key={msg.id} message={msg} />
  ))}

  {/* Typing indicator */}
  {someoneTyping && (
    <div className="flex items-center gap-2 py-1 pl-2">
      <img src={typingUser.avatar} alt="" className="w-6 h-6 rounded-full" />
      <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-[#253248] rounded-[18px_18px_18px_4px] border border-neutral-100 dark:border-neutral-700">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )}

  {/* Scroll anchor */}
  <div ref={bottomRef} />
</div>
```

### 4.4 Input Area

見 `components-spec.md` 2.3 節。高度動態（根據 textarea 行數），最小 68px（padding + 44px input）。

### 4.5 Empty Chat State

```tsx
{/* 未選擇房間時的右側佔位 */}
<div className="
  flex-1 flex flex-col items-center justify-center
  bg-neutral-50 dark:bg-neutral-900
  text-center p-8
">
  <img src="/logo.png" alt="" className="w-24 h-24 rounded-3xl mb-6 opacity-60" aria-hidden="true" />
  <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
    選擇一個對話開始聊天
  </h2>
  <p className="text-sm text-neutral-400 max-w-xs">
    從左側選擇現有對話，或點擊「新增對話」開始新的聊天
  </p>
</div>
```

---

## 5. Popup Chat（Messenger 風格浮窗）

### 5.1 佈局

```
[桌面右下角]
┌──────────────────────┐  ← w-80 (320px)
│ [AV] Alice     [_][✕]│  ← header h-12 bg-primary-800
├──────────────────────┤
│                      │
│ [訊息列表]           │  ← h-[280px], overflow-y-auto
│                      │
├──────────────────────┤
│ [__________] [▶]     │  ← input area h-[68px]
└──────────────────────┘
```

### 5.2 定位與 Z-index

```tsx
{/* Popup container — 右下角，多個 popup 水平排列 */}
<div className="
  fixed bottom-0 right-4 z-[300]
  flex items-end gap-3
">
  {openPopups.map((popup, index) => (
    <PopupChat key={popup.id} popup={popup} />
  ))}
</div>
```

多視窗：最多同時開 3 個（過多時隱藏最左邊的），每個寬 320px，間距 12px。

### 5.3 Popup 元件

```tsx
<div className="
  w-80 flex flex-col
  bg-white dark:bg-neutral-800
  rounded-t-xl overflow-hidden
  shadow-xl
  border border-neutral-200 dark:border-neutral-700
  border-b-0
">
  {/* Header */}
  <button
    onClick={toggleMinimize}
    aria-expanded={!isMinimized}
    aria-controls={`popup-body-${id}`}
    className="
      flex items-center gap-2 px-3
      h-12 flex-none
      bg-primary-800 dark:bg-primary-900
      hover:bg-primary-700
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-white/50 focus-visible:ring-inset
      w-full text-left
    "
  >
    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white truncate">{name}</p>
      {isOnline && <p className="text-[10px] text-accent-400">在線中</p>}
    </div>
    {/* Control buttons */}
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      <button
        aria-label={isMinimized ? '展開' : '最小化'}
        onClick={toggleMinimize}
        className="/* small icon button text-white/70 hover:text-white */"
      >
        <Minus size={14} />
      </button>
      <button
        aria-label="關閉"
        onClick={onClose}
        className="/* small icon button text-white/70 hover:text-white */"
      >
        <X size={14} />
      </button>
    </div>
  </button>

  {/* Body（收起時 hidden） */}
  <div
    id={`popup-body-${id}`}
    className={`
      flex flex-col
      transition-all duration-200
      ${isMinimized ? 'h-0 overflow-hidden' : 'h-[360px]'}
    `}
  >
    {/* Messages */}
    <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} compact />)}
    </div>

    {/* Input */}
    <div className="
      flex items-center gap-2 px-3 py-2
      border-t border-neutral-200 dark:border-neutral-700
      flex-none
    ">
      <input
        type="text"
        placeholder="輸入訊息..."
        aria-label={`傳送訊息給 ${name}`}
        className="
          flex-1 h-9 px-3 rounded-full
          bg-neutral-100 dark:bg-neutral-700
          border border-neutral-200 dark:border-neutral-600
          text-sm text-neutral-900 dark:text-neutral-100
          placeholder:text-neutral-400
          focus-visible:outline-none focus-visible:border-accent-500
          focus-visible:ring-1 focus-visible:ring-accent-500/20
        "
      />
      <button
        aria-label="送出"
        className="
          w-9 h-9 flex items-center justify-center rounded-full
          bg-primary-500 hover:bg-primary-400
          text-white
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-accent-500 focus-visible:ring-offset-2
          disabled:opacity-50
        "
      >
        <Send size={14} />
      </button>
    </div>
  </div>
</div>
```

### 5.4 Popup 狀態

| State | Popup Height | Header |
|-------|-------------|--------|
| Expanded（預設） | 全高 360px + header 48px = 408px | 無變化 |
| Minimized | 只剩 header 48px | header 維持可見 |
| Has unread（minimized 時） | 48px | 頭像旁顯示 unread badge |

### 5.5 動畫

- 開啟：`slide-in-from-bottom-4 fade-in duration-200`
- 收起：`h-[360px]` → `h-0` over `duration-200 ease-in-out`
- 展開：`h-0` → `h-[360px]` over `duration-200 ease-in-out`

---

## 6. Navbar

詳見 `navbar.md`（已完整定義）。核心規格摘要：
- 高度：56px（desktop）/ 48px（mobile）
- 背景：`bg-primary-700`（#1a2f7a），light/dark 模式不變
- Z-index：600
- Left：logo + 名稱；Center：搜尋框；Right：鈴鐺 + 用戶選單

---

## 7. Settings 頁

### 7.1 佈局

```
┌─────────────────────────────────────────────────────┐
│  Navbar                                             │
├──────────────────┬──────────────────────────────────┤
│  Sidebar         │  Settings Content               │
│                  │                                  │
│                  │  ┌────────────────────────────┐ │
│                  │  │  [Avatar XL]               │ │
│                  │  │  Wayne Chen                │ │
│                  │  │  wayne@example.com         │ │
│                  │  │  [✏ 編輯個人資料]          │ │
│                  │  └────────────────────────────┘ │
│                  │                                  │
│                  │  帳號設定                        │
│                  │  ┌────────────────────────────┐ │
│                  │  │ 顯示名稱    Wayne Chen  ✏  │ │
│                  │  │ 電子郵件   w@ex.com      ✏  │ │
│                  │  └────────────────────────────┘ │
│                  │                                  │
│                  │  偏好設定                        │
│                  │  ┌────────────────────────────┐ │
│                  │  │ 深色模式          [toggle] │ │
│                  │  │ 通知                  [▶]  │ │
│                  │  └────────────────────────────┘ │
│                  │                                  │
│                  │  [────── 登出 ──────]           │ │
│                  │                                  │
└──────────────────┴──────────────────────────────────┘
```

### 7.2 Settings Content 樣式

```tsx
<main className="
  flex-1 overflow-y-auto
  bg-neutral-50 dark:bg-neutral-900
  p-6
">
  <div className="max-w-[600px] mx-auto flex flex-col gap-6">

    {/* Profile card */}
    <section className="
      bg-white dark:bg-neutral-800
      rounded-2xl p-6
      shadow-sm border border-neutral-200 dark:border-neutral-700
      flex flex-col items-center text-center
    ">
      {/* Avatar with edit overlay */}
      <div className="relative mb-4">
        <img
          src={avatarUrl}
          alt="我的頭像"
          className="w-[72px] h-[72px] rounded-full object-cover"
        />
        <button
          aria-label="更換頭像"
          className="
            absolute inset-0 rounded-full
            bg-black/40 opacity-0 hover:opacity-100
            flex items-center justify-center
            transition-opacity duration-150
          "
        >
          <Camera size={20} className="text-white" />
        </button>
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{displayName}</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{email}</p>
      <button className="/* Ghost button sm */ mt-3">
        <Edit size={14} />
        編輯個人資料
      </button>
    </section>

    {/* Settings section */}
    <section>
      <h3 className="
        text-xs font-semibold uppercase tracking-wider
        text-neutral-400 dark:text-neutral-500
        mb-2 px-1
      ">
        偏好設定
      </h3>
      <div className="
        bg-white dark:bg-neutral-800
        rounded-2xl
        shadow-sm border border-neutral-200 dark:border-neutral-700
        overflow-hidden
      ">
        {/* Dark mode toggle */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-neutral-500" />
            <span className="text-[15px] text-neutral-900 dark:text-neutral-100">深色模式</span>
          </div>
          <Toggle isOn={isDark} onChange={toggleDark} aria-label="深色模式" />
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700" />

        {/* Notification settings link */}
        <button className="
          w-full flex items-center justify-between px-5 py-4
          hover:bg-neutral-50 dark:hover:bg-white/5
          transition-colors duration-150
          focus-visible:outline-none focus-visible:bg-neutral-50
        ">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-neutral-500" />
            <span className="text-[15px] text-neutral-900 dark:text-neutral-100">通知設定</span>
          </div>
          <ChevronRight size={18} className="text-neutral-400" />
        </button>
      </div>
    </section>

    {/* Logout */}
    <button className="
      w-full flex items-center justify-center gap-2
      h-11 rounded-xl
      border border-error-500/30
      text-error-500 text-[15px] font-medium
      hover:bg-error-100 dark:hover:bg-error-500/10
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-error-500 focus-visible:ring-offset-2
    ">
      <LogOut size={18} />
      登出
    </button>

  </div>
</main>
```

### 7.3 Section 結構

每個設定 section 遵循：
- 小標題：`text-xs font-semibold uppercase tracking-wider text-neutral-400`
- 容器：`bg-white dark:bg-neutral-800 rounded-2xl border`
- item 間以 `border-t border-neutral-200 dark:border-neutral-700` 分隔

---

## 8. 頁面間交互流程

### 8.1 Login → Main Layout

1. 登入成功：button 顯示 ✓，300ms 後 `navigate('/')`
2. Router 根據 auth state 決定渲染 Login 或主佈局

### 8.2 Room 選擇

1. 點擊 RoomItem → `selectedRoomId` 更新
2. Mobile：sidebar 隱藏，ChatRoom 全螢幕
3. Desktop：sidebar 不動，右側更新 ChatRoom 內容

### 8.3 新增對話

1. 點擊「新增對話」→ Modal 開啟（`components-spec.md` 5 節）
2. 搜尋用戶 / 輸入群組名稱
3. 確認 → API 呼叫 → 新房間加入列表 → 自動選中

### 8.4 Popup Chat

1. 在某些入口（用戶頭像、「開始聊天」按鈕）點擊
2. 若 Popup 已存在（同用戶）→ focus 到現有 Popup
3. 若未存在 → 從右側 create，slide-in 動畫
4. 最多 3 個 Popup，超過則警示用戶關閉一個

### 8.5 Dark Mode 切換

1. Toggle（Settings 頁或 Navbar Dropdown）觸發
2. `<html>` class 加/移除 `dark`
3. 所有 `dark:` 前綴樣式即時生效
4. 儲存偏好至 localStorage → 下次載入恢復
5. 動畫：`transition-colors duration-300 ease-in-out`（已在 body 上）
