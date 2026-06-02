# Components Spec — ChatOwl

所有元件使用 `design-tokens.md` 中定義的 token，禁止 hardcoded hex 值。

---

## 1. Button

### 1.1 Variants

| Variant | Use Case |
|---------|----------|
| `primary` | 主要操作（登入、送出、建立房間） |
| `secondary` | 次要操作（取消、返回） |
| `ghost` | 輕量操作（icon 旁文字按鈕） |
| `danger` | 破壞性操作（刪除、離開房間） |
| `icon` | 純圖示按鈕（40×40px，無文字） |

### 1.2 Sizes

| Size | Height | Padding (H) | Font Size | Usage |
|------|--------|-------------|-----------|-------|
| `sm` | 32px | `px-3` | 13px | 緊湊空間、inline 操作 |
| `md` | 40px | `px-4` | 14px | 一般操作 |
| `lg` | 48px | `px-6` | 15px | Auth 頁主按鈕 |
| `icon-sm` | 32×32px | — | — | 小圖示按鈕 |
| `icon-md` | 40×40px | — | — | 標準圖示按鈕 |
| `icon-lg` | 44×44px | — | — | 主要行動（觸控最小值） |

### 1.3 States

#### Primary Button

| State | Classes |
|-------|---------|
| Default | `bg-primary-500 text-white font-semibold rounded-lg` |
| Hover | `hover:bg-primary-400` |
| Active | `active:bg-primary-600` |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none` |
| Loading | spinner 替代文字，`cursor-wait` |

```tsx
// Primary Button — LG（Auth 頁）
<button className="
  w-full h-12 px-6
  bg-primary-500 hover:bg-primary-400 active:bg-primary-600
  text-white text-[15px] font-semibold
  rounded-lg
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-accent-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
```

#### Secondary Button

| State | Classes |
|-------|---------|
| Default | `bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-200 dark:border-neutral-600` |
| Hover | `hover:bg-neutral-200 dark:hover:bg-neutral-600` |
| Active | `active:bg-neutral-300 dark:active:bg-neutral-500` |
| Focus | 同 primary |
| Disabled | 同 primary |

#### Ghost Button

| State | Classes |
|-------|---------|
| Default | `bg-transparent text-primary-500 dark:text-primary-300 font-medium rounded-lg` |
| Hover | `hover:bg-primary-50 dark:hover:bg-primary-900/30` |
| Active | `active:bg-primary-100 dark:active:bg-primary-900/50` |

#### Danger Button

| State | Classes |
|-------|---------|
| Default | `bg-error-500 text-white font-semibold rounded-lg` |
| Hover | `hover:bg-error-400` |
| Active | `active:bg-red-700` |

#### Icon Button（sidebar / navbar 用）

```tsx
<button className="
  flex items-center justify-center
  w-10 h-10                            /* 40×40px, 符合 44px 通過 padding */
  rounded-full
  text-white/90
  hover:bg-white/12 active:bg-white/20
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-white focus-visible:ring-offset-1
  focus-visible:ring-offset-primary-700
" aria-label="[描述操作]">
  <Icon size={20} />
</button>
```

### 1.4 Loading State

```tsx
// Spinner 替代 label
<button disabled className="... cursor-wait">
  <Spinner className="w-4 h-4 animate-spin mr-2" />
  <span>載入中...</span>
</button>
```

---

## 2. Input

### 2.1 Text Input（表單用）

| State | Classes |
|-------|---------|
| Default | `bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100` |
| Hover | `hover:border-neutral-300 dark:hover:border-neutral-600` |
| Focus | `focus-visible:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20` |
| Error | `border-error-500 focus-visible:ring-error-500/20` |
| Disabled | `bg-neutral-100 dark:bg-neutral-900 opacity-60 cursor-not-allowed` |
| Placeholder | `placeholder:text-neutral-400 dark:placeholder:text-neutral-600` |

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
    {label}
  </label>
  <input
    className="
      h-11 px-4 rounded-lg
      bg-white dark:bg-neutral-800
      border border-neutral-200 dark:border-neutral-700
      text-[15px] text-neutral-900 dark:text-neutral-100
      placeholder:text-neutral-400
      hover:border-neutral-300 dark:hover:border-neutral-600
      focus-visible:outline-none
      focus-visible:border-accent-500
      focus-visible:ring-2 focus-visible:ring-accent-500/20
      disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed
      transition-colors duration-150
    "
  />
  {/* Error message */}
  {error && (
    <p className="text-xs text-error-500 flex items-center gap-1">
      <AlertCircle size={12} />
      {error}
    </p>
  )}
</div>
```

### 2.2 Search Bar（Sidebar 版）

```tsx
<div className="relative mx-3 my-2">
  <Search className="
    absolute left-3 top-1/2 -translate-y-1/2
    w-4 h-4 text-white/50
  " />
  <input
    type="search"
    placeholder="搜尋對話..."
    aria-label="搜尋對話"
    className="
      w-full h-9 pl-9 pr-4
      bg-white/10 hover:bg-white/15
      border border-white/15 hover:border-white/25
      rounded-full
      text-sm text-white
      placeholder:text-white/50
      focus-visible:outline-none
      focus-visible:bg-white/18
      focus-visible:border-white/35
      focus-visible:ring-1 focus-visible:ring-white/30
      transition-all duration-150
    "
  />
</div>
```

### 2.3 Message Input（Chat 底部）

```tsx
<div className="flex items-end gap-2 p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
  <textarea
    rows={1}
    placeholder="輸入訊息..."
    aria-label="輸入訊息"
    className="
      flex-1 min-h-[44px] max-h-[120px]
      px-4 py-2.5
      bg-neutral-50 dark:bg-neutral-700
      border border-neutral-200 dark:border-neutral-600
      rounded-2xl
      text-[15px] text-neutral-900 dark:text-neutral-100
      placeholder:text-neutral-400
      resize-none
      focus-visible:outline-none
      focus-visible:border-accent-500
      focus-visible:ring-2 focus-visible:ring-accent-500/20
      transition-colors duration-150
    "
  />
  {/* Send button */}
  <button
    aria-label="送出訊息"
    className="
      flex-none flex items-center justify-center
      w-11 h-11 rounded-full
      bg-primary-500 hover:bg-primary-400 active:bg-primary-600
      text-white
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-accent-500 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    "
  >
    <Send size={18} />
  </button>
</div>
```

---

## 3. Avatar

### 3.1 Sizes

| Size | Dimensions | Tailwind | Usage |
|------|-----------|----------|-------|
| `xs` | 24×24px | `w-6 h-6` | 訊息 bubble 旁（群組聊天） |
| `sm` | 32×32px | `w-8 h-8` | Sidebar 房間列表 |
| `md` | 40×40px | `w-10 h-10` | Navbar、chat header |
| `lg` | 48×48px | `w-12 h-12` | Dropdown 頂部 |
| `xl` | 72×72px | `w-18 h-18` | Settings 頁 |

### 3.2 States

| State | Classes |
|-------|---------|
| Default | `rounded-full object-cover bg-primary-200` |
| Loading / No Image | Fallback：首字母縮寫 + `bg-primary-600 text-white font-semibold` |
| With status dot | 相對定位，status dot 絕對定位右下角 |

```tsx
<div className="relative inline-block">
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt={`${name} 的頭像`}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <div className="
      w-10 h-10 rounded-full
      bg-primary-600 text-white
      flex items-center justify-center
      text-sm font-semibold select-none
    ">
      {name.charAt(0).toUpperCase()}
    </div>
  )}
  {/* Status dot */}
  {showStatus && (
    <span
      className={`
        absolute bottom-0 right-0
        w-2.5 h-2.5 rounded-full
        border-2 border-white dark:border-neutral-800
        ${status === 'online' ? 'bg-success-500' : ''}
        ${status === 'away'   ? 'bg-warning-500' : ''}
        ${status === 'offline'? 'bg-neutral-400'  : ''}
      `}
      aria-label={`狀態：${status}`}
    />
  )}
</div>
```

---

## 4. Badge

### 4.1 Unread Count Badge

```tsx
// 顯示未讀數
<span className="
  min-w-[18px] h-[18px] px-1
  bg-accent-500 text-white
  text-[10px] font-bold
  rounded-full
  flex items-center justify-center
  leading-none
" aria-label={`${count} 則未讀訊息`}>
  {count > 99 ? '99+' : count}
</span>
```

### 4.2 Notification Dot（無數字）

```tsx
<span className="
  absolute top-0.5 right-0.5
  w-2 h-2 rounded-full
  bg-error-500
" aria-hidden="true" />
```

### 4.3 Status Badge（文字型）

```tsx
// 成功 / 錯誤 / 警告
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded-full
  text-xs font-medium
  bg-success-100 text-success-700
  dark:bg-success-900/30 dark:text-success-400
">
  <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
  在線
</span>
```

---

## 5. Modal / Dialog

### 5.1 Layout

```
┌──────────────────────────────────────┐
│ [Overlay: bg-black/50 backdrop-blur] │
│                                      │
│   ┌──────────────────────────────┐   │
│   │ Header: Title         [✕]   │   │
│   ├──────────────────────────────┤   │
│   │                              │   │
│   │ Body content                 │   │
│   │                              │   │
│   ├──────────────────────────────┤   │
│   │          [Cancel] [Confirm]  │   │
│   └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 5.2 Classes

```tsx
{/* Overlay */}
<div className="
  fixed inset-0 z-[400]
  bg-black/50 backdrop-blur-sm
  flex items-center justify-center p-4
">
  {/* Dialog */}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    className="
      w-full max-w-md
      bg-white dark:bg-neutral-800
      rounded-2xl shadow-xl
      flex flex-col
      max-h-[90vh]
      animate-in fade-in zoom-in-95 duration-200
    "
  >
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
      <h2 id="modal-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <button
        aria-label="關閉"
        className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <X size={16} />
      </button>
    </div>

    {/* Body */}
    <div className="px-6 py-4 overflow-y-auto flex-1">
      {children}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
      <button className="/* Secondary button md */"> 取消 </button>
      <button className="/* Primary button md */"> 確認 </button>
    </div>
  </div>
</div>
```

### 5.3 States & Interactions

| State | Behavior |
|-------|---------|
| Open | `opacity-0 scale-95` → `opacity-100 scale-100`，200ms ease-out |
| Close | 反向動畫，200ms ease-in |
| Escape | 關閉 dialog |
| Outside click | 關閉 dialog |
| Focus trap | tab key 在 dialog 內循環 |
| Scroll lock | body `overflow-hidden` 當 modal 開啟 |

---

## 6. Spinner

```tsx
// 全頁載入
<div className="flex items-center justify-center h-full">
  <div className="
    w-8 h-8 rounded-full
    border-2 border-neutral-200 dark:border-neutral-700
    border-t-primary-500
    animate-spin
  " role="status" aria-label="載入中" />
</div>

// Button 內嵌（白色）
<div className="
  w-4 h-4 rounded-full
  border-2 border-white/30
  border-t-white
  animate-spin
" aria-hidden="true" />

// 淺色背景（藍色）
<div className="
  w-5 h-5 rounded-full
  border-2 border-primary-100
  border-t-primary-500
  animate-spin
" role="status" aria-label="載入中" />
```

---

## 7. MessageBubble

### 7.1 Structure

```
[Own message — 靠右]
                              ┌────────────────────────┐
                              │ 訊息內容                │
                              │                        │
                              │ 12:34  ✓✓             │
                              └────────────────────────┘

[Other message — 靠左]
[AV] ┌────────────────────────┐
     │ 訊息內容                │
     │                        │
     │ 12:34                  │
     └────────────────────────┘
     Alice
```

### 7.2 Classes

```tsx
{/* Message row wrapper */}
<div className={`flex items-end gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

  {/* Avatar（對方才顯示） */}
  {!isOwn && (
    <img
      src={senderAvatar}
      alt={`${senderName} 的頭像`}
      className="w-6 h-6 rounded-full object-cover flex-none self-end mb-0.5"
    />
  )}

  {/* Bubble */}
  <div className={`
    max-w-[70%]
    px-4 py-2.5
    shadow-[0_1px_2px_rgba(0,0,0,0.12)]
    ${isOwn
      ? 'bg-primary-500 text-white rounded-[18px_18px_4px_18px]'
      : 'bg-white dark:bg-[#253248] text-neutral-900 dark:text-neutral-100 rounded-[18px_18px_18px_4px] border border-neutral-100 dark:border-neutral-700'
    }
  `}>
    {/* Sender name（群組聊天，對方才顯示） */}
    {!isOwn && isGroup && (
      <p className="text-xs font-semibold text-accent-500 mb-0.5">{senderName}</p>
    )}

    {/* 訊息內容 */}
    <p className="text-[15px] leading-[1.45] break-words whitespace-pre-wrap">{content}</p>

    {/* Meta row */}
    <div className={`
      flex items-center gap-1 mt-1
      ${isOwn ? 'justify-end' : 'justify-start'}
    `}>
      <time className={`text-[10px] ${isOwn ? 'text-white/65' : 'text-neutral-400'}`}>
        {timestamp}
      </time>
      {/* 已讀狀態（只有自己才顯示） */}
      {isOwn && (
        <span aria-label={readStatus === 'read' ? '已讀' : '已送達'}>
          {readStatus === 'read'
            ? <CheckCheck size={12} className="text-accent-400" />
            : <Check size={12} className="text-white/65" />
          }
        </span>
      )}
    </div>
  </div>
</div>
```

### 7.3 States

| State | Behavior |
|-------|---------|
| Default | 以上樣式 |
| Sending | opacity-70，無已讀 icon，顯示小 spinner |
| Failed | 紅色 `!` 圓圈 icon 在 bubble 旁，點擊重新發送 |
| Selected | `ring-2 ring-accent-500` |
| Hover | 顯示更多選項 button（`...`）以絕對定位顯示於 bubble 角落 |

---

## 8. RoomItem（Sidebar 房間列表項）

### 8.1 Structure

```
┌──────────────────────────────────────────┐
│ [Avatar+dot]  Room Name         [12:34]  │
│               最後一則訊息 preview  [●3]  │
└──────────────────────────────────────────┘
height: 72px
```

### 8.2 Classes

```tsx
<button
  role="option"
  aria-selected={isActive}
  className={`
    w-full flex items-center gap-3 px-3 py-3
    min-h-[72px]
    rounded-xl mx-1
    text-left
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-white/50 focus-visible:ring-inset
    ${isActive
      ? 'bg-primary-600 text-white'
      : 'text-white/85 hover:bg-white/8 active:bg-white/12'
    }
  `}
>
  {/* Avatar */}
  <div className="relative flex-none">
    <img
      src={avatarUrl}
      alt={`${roomName} 的頭像`}
      className="w-12 h-12 rounded-full object-cover"
    />
    {/* Status dot */}
    <span className={`
      absolute bottom-0 right-0
      w-3 h-3 rounded-full
      border-2
      ${isActive ? 'border-primary-600' : 'border-primary-800'}
      ${status === 'online'  ? 'bg-success-500' : ''}
      ${status === 'away'    ? 'bg-warning-500' : ''}
      ${status === 'offline' ? 'bg-neutral-500' : ''}
    `} aria-hidden="true" />
  </div>

  {/* Text content */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <span className={`
        text-[15px] truncate
        ${hasUnread ? 'font-semibold' : 'font-medium'}
        ${isActive ? 'text-white' : ''}
      `}>
        {roomName}
      </span>
      <time className={`
        flex-none text-xs ml-2
        ${isActive ? 'text-white/70' : 'text-white/50'}
      `}>
        {lastMessageTime}
      </time>
    </div>
    <div className="flex items-center justify-between mt-0.5">
      <p className={`
        text-sm truncate
        ${isActive ? 'text-white/80' : 'text-white/55'}
        ${hasUnread ? 'font-medium' : ''}
      `}>
        {lastMessage}
      </p>
      {unreadCount > 0 && (
        <span className="
          flex-none ml-2
          min-w-[18px] h-[18px] px-1
          bg-accent-500 text-white
          text-[10px] font-bold leading-none
          rounded-full
          flex items-center justify-center
        " aria-label={`${unreadCount} 則未讀`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  </div>
</button>
```

### 8.3 States

| State | Background | Text |
|-------|-----------|------|
| Default | transparent | `text-white/85` |
| Hover | `bg-white/8` | `text-white/85` |
| Active (pressed) | `bg-white/12` | `text-white` |
| Selected (current room) | `bg-primary-600` | `text-white` |
| Unread | Default + `font-semibold` 房間名 + unread badge | |
| Focus-visible | `ring-2 ring-white/50 ring-inset` | |

---

## 9. Toggle Switch（設定頁主題切換）

```tsx
<button
  role="switch"
  aria-checked={isOn}
  aria-label="深色模式"
  onClick={toggle}
  className={`
    relative inline-flex h-6 w-11
    rounded-full border-2 border-transparent
    transition-colors duration-200
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-accent-500 focus-visible:ring-offset-2
    ${isOn ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'}
  `}
>
  <span className={`
    pointer-events-none inline-block
    h-5 w-5 rounded-full bg-white shadow
    transition-transform duration-200
    ${isOn ? 'translate-x-5' : 'translate-x-0'}
  `} />
</button>
```

---

## 10. Toast / Notification

### 10.1 Types

| Type | Icon | Background | Border |
|------|------|-----------|--------|
| `success` | CheckCircle | `bg-white dark:bg-neutral-800` | `border-l-4 border-success-500` |
| `error` | XCircle | `bg-white dark:bg-neutral-800` | `border-l-4 border-error-500` |
| `warning` | AlertTriangle | `bg-white dark:bg-neutral-800` | `border-l-4 border-warning-500` |
| `info` | Info | `bg-white dark:bg-neutral-800` | `border-l-4 border-info-500` |

### 10.2 Layout

```tsx
<div className="
  fixed bottom-4 right-4 z-[500]
  flex flex-col gap-2
">
  <div className="
    flex items-start gap-3 px-4 py-3
    bg-white dark:bg-neutral-800
    border border-neutral-200 dark:border-neutral-700
    border-l-4 border-l-success-500
    rounded-xl shadow-lg
    w-[320px] max-w-[calc(100vw-32px)]
    animate-in slide-in-from-right-5 fade-in duration-200
  ">
    <CheckCircle size={18} className="text-success-500 flex-none mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
      {message && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{message}</p>}
    </div>
    <button
      aria-label="關閉通知"
      className="flex-none text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
    >
      <X size={14} />
    </button>
  </div>
</div>
```

---

## 11. Dropdown Menu

```tsx
<div className="
  absolute right-0 top-full mt-1
  w-60
  bg-white dark:bg-neutral-800
  rounded-xl shadow-xl
  border border-neutral-200 dark:border-neutral-700
  z-[100]
  py-1
  animate-in fade-in zoom-in-95 duration-200 origin-top-right
" role="menu">
  <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{name}</p>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{email}</p>
  </div>

  {/* Menu items */}
  <button role="menuitem" className="
    w-full flex items-center gap-3
    px-4 py-2.5
    text-sm text-neutral-700 dark:text-neutral-300
    hover:bg-neutral-100 dark:hover:bg-white/8
    transition-colors duration-150
    focus-visible:outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-white/8
  ">
    <User size={16} className="text-neutral-400" />
    個人資料
  </button>

  {/* Divider */}
  <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" role="separator" />

  {/* Danger item */}
  <button role="menuitem" className="
    w-full flex items-center gap-3
    px-4 py-2.5
    text-sm text-error-500
    hover:bg-error-100 dark:hover:bg-error-500/10
    transition-colors duration-150
    focus-visible:outline-none focus-visible:bg-error-100
  ">
    <LogOut size={16} />
    登出
  </button>
</div>
```

---

## 12. Skeleton Loader

```tsx
// 房間列表 skeleton（sidebar 載入中）
<div className="flex items-center gap-3 px-3 py-3 mx-1">
  <div className="w-12 h-12 rounded-full bg-white/15 animate-pulse flex-none" />
  <div className="flex-1 space-y-2">
    <div className="h-3.5 w-3/4 bg-white/15 rounded animate-pulse" />
    <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
  </div>
</div>

// 訊息 skeleton（chat 載入中）
<div className="flex items-end gap-2 mb-1">
  <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
  <div className="h-12 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-[18px] animate-pulse" />
</div>
```

---

## 13. Empty State

```tsx
<div className="
  flex flex-col items-center justify-center
  h-full py-16 px-4
  text-center
">
  <div className="
    w-16 h-16 rounded-full
    bg-primary-50 dark:bg-primary-900/30
    flex items-center justify-center
    mb-4
  ">
    <MessageSquare size={28} className="text-primary-400" />
  </div>
  <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
    {title}
  </h3>
  <p className="text-sm text-neutral-400 max-w-[200px]">
    {description}
  </p>
  {actionLabel && (
    <button className="/* Primary button sm */ mt-4">
      {actionLabel}
    </button>
  )}
</div>
```

---

## 14. Accessibility 通則

| 規則 | 實作 |
|------|------|
| 所有互動元素有 focus-visible | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500` |
| icon-only button 有 aria-label | `aria-label="[操作描述]"` |
| 圖片有 alt | `alt="[有意義的描述]"` 或裝飾性 `alt=""` |
| 表單輸入有 label | `<label>` 顯式關聯或 `aria-label` |
| 動態內容有 aria-live | 訊息區 `aria-live="polite"` |
| 對比度 ≥ 4.5:1 | 見 design-tokens.md 第 9 節 |
| 觸控目標 ≥ 44×44px | 使用 padding 擴大點擊區域 |
| 不只靠顏色傳達訊息 | 錯誤狀態配合 icon + 文字 |
| Modal focus trap | 使用 `focus-trap-react` 或原生 dialog |
| Escape 關閉 overlay | keydown 監聽 |
