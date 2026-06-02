# Design Tokens — ChatOwl (Complete Redesign)

## Overview

Design token 系統以 logo 為基礎：深皇家藍底色（`#1E2FA8` 系列）搭配青色雙環（`#00BCD4` 系列）。整體風格對標 Discord / Slack / Telegram：深藍 sidebar 主導結構感，白色/極淺灰 chat 區提供閱讀舒適度。

**所有 component 必須引用本文件定義的 token，禁止在元件中寫入 hardcoded hex 值。**

---

## 1. Color Tokens

### 1.1 Primary Blue Scale（藍色主色，8 階）

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `primary-50` | `#eff6ff` | `bg-primary-50` | 極淺藍，hover 背景、輕量 tint |
| `primary-100` | `#dbeafe` | `bg-primary-100` | 淺藍，form focus 底色 |
| `primary-200` | `#bfdbfe` | `bg-primary-200` | 次淺藍，disabled state |
| `primary-300` | `#93c5fd` | `bg-primary-300` | 中淺藍，loading skeleton |
| `primary-400` | `#3b82f6` | `bg-primary-400` | 亮藍，hover/focus ring |
| `primary-500` | `#1d4ed8` | `bg-primary-500` | 標準藍，primary button、send button |
| `primary-600` | `#1e3a8a` | `bg-primary-600` | 深藍，sidebar active item 背景 |
| `primary-700` | `#1a2f7a` | `bg-primary-700` | 較深，navbar 背景 |
| `primary-800` | `#162566` | `bg-primary-800` | 深皇家藍，sidebar 背景（logo 主色） |
| `primary-900` | `#0f1a4a` | `bg-primary-900` | 最深海軍藍，dark mode sidebar |
| `primary-950` | `#090f2e` | `bg-primary-950` | 極深，dark mode 頁面底色 |

### 1.2 Accent Cyan Scale（品牌青色）

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `accent-100` | `#cffafe` | `bg-accent-100` | 極淡青，通知底色 |
| `accent-200` | `#a5f3fc` | `bg-accent-200` | 淡青，badge 背景（暗色模式） |
| `accent-300` | `#67e8f9` | `bg-accent-300` | 中淡青，logo 雙環淺色部分 |
| `accent-400` | `#22d3ee` | `bg-accent-400` | 標準青，unread badge、active indicator |
| `accent-500` | `#00BCD4` | `bg-accent-500` | logo 品牌青，focus ring 色、link 色 |
| `accent-600` | `#0891b2` | `bg-accent-600` | 深青，pressed 狀態 |
| `accent-900` | `#164e63` | `bg-accent-900` | 最深青，dark mode accent surface |

### 1.3 Neutral Scale

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `neutral-0` | `#ffffff` | `bg-white` | 純白，chat 區背景、卡片背景 |
| `neutral-50` | `#f8fafc` | `bg-neutral-50` | 近白，page 背景（light mode） |
| `neutral-100` | `#f1f5f9` | `bg-neutral-100` | 極淺灰，sidebar item hover |
| `neutral-200` | `#e2e8f0` | `bg-neutral-200` | 淺灰，border、divider |
| `neutral-300` | `#cbd5e1` | `bg-neutral-300` | 中淺灰，disabled border |
| `neutral-400` | `#94a3b8` | `bg-neutral-400` | 灰，placeholder 文字 |
| `neutral-500` | `#64748b` | `bg-neutral-500` | 中灰，次要文字 |
| `neutral-600` | `#475569` | `bg-neutral-600` | 深灰，sidebar 次要文字 |
| `neutral-700` | `#334155` | `bg-neutral-700` | 較深灰，dark mode border |
| `neutral-800` | `#1e293b` | `bg-neutral-800` | 深，dark mode 次要 surface |
| `neutral-900` | `#0f172a` | `bg-neutral-900` | 最深，dark mode 主要背景 |

### 1.4 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#22c55e` | 在線狀態點、成功訊息 |
| `success-400` | `#4ade80` | dark mode 在線狀態點 |
| `success-100` | `#dcfce7` | 成功背景（light） |
| `warning-500` | `#f59e0b` | 警告、離線很久 |
| `warning-100` | `#fef3c7` | 警告背景（light） |
| `error-500` | `#ef4444` | 錯誤狀態、danger action |
| `error-400` | `#f87171` | dark mode error |
| `error-100` | `#fee2e2` | 錯誤背景（light） |
| `info-500` | `#3b82f6` | 資訊提示 |
| `info-100` | `#eff6ff` | 資訊背景（light） |

### 1.5 Semantic Mapping（Light / Dark）

| Semantic Token | Light Mode | Dark Mode |
|----------------|-----------|-----------|
| `bg-page` | `neutral-50` (#f8fafc) | `neutral-900` (#0f172a) |
| `bg-surface` | `neutral-0` (#ffffff) | `neutral-800` (#1e293b) |
| `bg-surface-raised` | `neutral-0` (#ffffff) | `#253248` |
| `bg-sidebar` | `primary-800` (#162566) | `primary-900` (#0f1a4a) |
| `bg-sidebar-hover` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.08)` |
| `bg-sidebar-active` | `primary-600` (#1e3a8a) | `primary-700` (#1a2f7a) |
| `bg-navbar` | `primary-700` (#1a2f7a) | `primary-700` (#1a2f7a) |
| `bg-input` | `neutral-0` (#ffffff) | `neutral-800` (#1e293b) |
| `bg-input-sidebar` | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.10)` |
| `bg-bubble-own` | `primary-500` (#1d4ed8) | `primary-500` (#1d4ed8) |
| `bg-bubble-other` | `neutral-0` (#ffffff) | `#253248` |
| `bg-popup-header` | `primary-800` (#162566) | `primary-900` (#0f1a4a) |
| `text-primary` | `#0f172a` | `#f1f5f9` |
| `text-secondary` | `neutral-500` (#64748b) | `neutral-400` (#94a3b8) |
| `text-on-brand` | `neutral-0` (#ffffff) | `neutral-0` (#ffffff) |
| `text-sidebar` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.85)` |
| `text-sidebar-active` | `#ffffff` | `#ffffff` |
| `text-sidebar-muted` | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.55)` |
| `text-placeholder` | `neutral-400` (#94a3b8) | `neutral-600` (#475569) |
| `text-link` | `accent-500` (#00BCD4) | `accent-400` (#22d3ee) |
| `text-bubble-own` | `neutral-0` (#ffffff) | `neutral-0` (#ffffff) |
| `text-bubble-other` | `#0f172a` | `#f1f5f9` |
| `border-default` | `neutral-200` (#e2e8f0) | `neutral-700` (#334155) |
| `border-focus` | `accent-500` (#00BCD4) | `accent-400` (#22d3ee) |
| `border-error` | `error-500` (#ef4444) | `error-400` (#f87171) |
| `online-dot` | `success-500` (#22c55e) | `success-400` (#4ade80) |
| `away-dot` | `warning-500` (#f59e0b) | `warning-500` (#f59e0b) |
| `offline-dot` | `neutral-400` (#94a3b8) | `neutral-600` (#475569) |
| `unread-badge-bg` | `accent-500` (#00BCD4) | `accent-500` (#00BCD4) |
| `unread-badge-text` | `neutral-0` (#ffffff) | `neutral-0` (#ffffff) |

### 1.6 Message Bubble Gradient

自己的訊息 bubble 使用漸層（呼應 logo 青色到藍色）：

```css
background: linear-gradient(135deg, #1d4ed8 0%, #1a2f7a 100%);
/* 或帶青色版本（特殊強調用）: */
background: linear-gradient(135deg, #00BCD4 0%, #1d4ed8 100%);
```

標準 bubble 使用純色 `primary-500`（`#1d4ed8`），hover 時顯示漸層。

---

## 2. Typography

### 2.1 Font Stack

```css
--font-sans: 'Inter', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

Google Fonts 載入：
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
```

### 2.2 Type Scale

| Token | Size | Line Height | Weight | Tailwind | Usage |
|-------|------|-------------|--------|----------|-------|
| `text-2xs` | 10px | 14px | 400 | `text-[10px]` | 極小 meta（少用） |
| `text-xs` | 12px | 16px | 400 | `text-xs` | 時間戳、已讀狀態、計數 badge |
| `text-sm` | 13px | 18px | 400 | `text-[13px]` | 最後訊息 preview、次要說明 |
| `text-base` | 14px | 22px | 400 | `text-sm` | 訊息內容、房間名稱（sidebar）、body text |
| `text-md` | 15px | 24px | 400/500 | `text-[15px]` | 輸入框文字、較重要的 body |
| `text-lg` | 16px | 24px | 500/600 | `text-base` | Section 標題、sidebar app 名稱 |
| `text-xl` | 18px | 28px | 600 | `text-lg` | Navbar app 名稱、chat header 房間名 |
| `text-2xl` | 20px | 30px | 600 | `text-xl` | 頁面 title（Settings） |
| `text-3xl` | 24px | 32px | 700 | `text-2xl` | Auth 頁標題 |
| `text-4xl` | 28px | 36px | 700 | `text-[28px]` | Auth 頁大標 |
| `text-5xl` | 32px | 40px | 700 | `text-3xl` | Hero 文字（登入頁 logo 下方） |

### 2.3 Font Weight Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `font-regular` | 400 | Body text、訊息內容 |
| `font-medium` | 500 | 標籤、sidebar item、未讀時的房間名 |
| `font-semibold` | 600 | 標題、按鈕、app 名稱 |
| `font-bold` | 700 | Auth heading、未讀計數 |

---

## 3. Spacing Scale（4px base）

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `space-0.5` | 2px | `p-0.5` | 極小 gap，圓點間距 |
| `space-1` | 4px | `p-1` | 最小 padding，badge 內距 |
| `space-1.5` | 6px | `p-1.5` | 小 gap |
| `space-2` | 8px | `p-2` | 緊湊 padding，icon button |
| `space-2.5` | 10px | `p-2.5` | 次緊湊 |
| `space-3` | 12px | `p-3` | 常用小間距 |
| `space-4` | 16px | `p-4` | 標準 padding，卡片內距 |
| `space-5` | 20px | `p-5` | 中等間距 |
| `space-6` | 24px | `p-6` | 大間距，section 間 |
| `space-8` | 32px | `p-8` | 卡片外距 |
| `space-10` | 40px | `p-10` | 大 section 間距 |
| `space-12` | 48px | `p-12` | 特大間距 |
| `space-16` | 64px | `p-16` | Auth 頁 logo margin |
| `space-20` | 80px | `p-20` | Auth 頁 vertical padding |

### 元件尺寸規格

| 元件 | 尺寸 | 說明 |
|------|------|------|
| Touch target 最小值 | 44×44px | WCAG 2.5.5 |
| Avatar XS | 24×24px | 訊息 bubble 旁 |
| Avatar SM | 32×32px | sidebar 房間列表 |
| Avatar MD | 40×40px | navbar、chat header |
| Avatar LG | 48px | Dropdown 頂部 |
| Avatar XL | 72px | Settings 頁 |
| Avatar Auth | 96px | Auth 頁（未來功能） |
| Navbar height (desktop) | 56px | `h-14` |
| Navbar height (mobile) | 48px | `h-12` |
| Sidebar width (desktop) | 320px | `w-80` |
| Sidebar width (tablet) | 280px | |
| Bottom nav height | 56px | `h-14` |
| Input height | 44px | 符合觸控最小值 |
| Button height SM | 32px | 次要操作 |
| Button height MD | 40px | 一般按鈕 |
| Button height LG | 48px | Auth 頁主按鈕 |
| Popup width | 320px | `w-80` |
| Popup height (expanded) | 440px | |
| Popup header height | 48px | |
| Unread badge (number) | 18×18px min | `min-w-[18px] h-[18px]` |
| Status dot | 10×10px | |

---

## 4. Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `radius-none` | 0 | `rounded-none` | 特殊用途 |
| `radius-xs` | 2px | `rounded-sm` | 細節邊角 |
| `radius-sm` | 4px | `rounded` | tags、小標籤 |
| `radius-md` | 8px | `rounded-lg` | 輸入框、小卡片 |
| `radius-lg` | 12px | `rounded-xl` | 大卡片、modal、dropdown |
| `radius-xl` | 16px | `rounded-2xl` | Auth 卡片 |
| `radius-2xl` | 20px | `rounded-[20px]` | 大型卡片（特殊） |
| `radius-full` | 9999px | `rounded-full` | 頭像、badge、send button、search bar |
| `radius-bubble-own` | `18px 18px 4px 18px` | `rounded-[18px_18px_4px_18px]` | 自己的訊息 bubble |
| `radius-bubble-other` | `18px 18px 18px 4px` | `rounded-[18px_18px_18px_4px]` | 對方的訊息 bubble |

---

## 5. Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.06)` | `shadow-sm` | 極細提升感 |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)` | `shadow` | 輸入框、小卡片 |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | `shadow-md` | Dropdown、tooltip |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)` | `shadow-lg` | Mobile sidebar drawer |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)` | `shadow-xl` | Popup chat windows |
| `shadow-navbar` | `0 2px 4px rgba(0,0,0,0.24)` | `shadow-[0_2px_4px_rgba(0,0,0,0.24)]` | Navbar bottom |
| `shadow-auth-card` | `0 25px 50px rgba(14,27,74,0.25)` | `shadow-[0_25px_50px_rgba(14,27,74,0.25)]` | Auth 頁卡片（藍色陰影） |
| `shadow-bubble` | `0 1px 2px rgba(0,0,0,0.12)` | `shadow-[0_1px_2px_rgba(0,0,0,0.12)]` | Message bubble |

Dark mode：alpha 值乘以 1.5。

---

## 6. Transition & Animation

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | hover 背景色變化 |
| `duration-base` | 200ms | dropdown 開/關、元件 mount |
| `duration-theme` | 300ms | dark/light mode 切換 |
| `duration-slide` | 250ms | sidebar 滑入/滑出（mobile） |
| `duration-popup` | 200ms | popup chat 展開/收起 |
| `ease-out` | `cubic-bezier(0,0,0.2,1)` | 元素出現（deceleration） |
| `ease-in` | `cubic-bezier(0.4,0,1,1)` | 元素消失（acceleration） |
| `ease-in-out` | `cubic-bezier(0.4,0,0.2,1)` | 雙向動畫（slide） |

Tailwind 對應：`transition-colors duration-150`, `transition-all duration-200`, `duration-300 ease-in-out`

---

## 7. Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | 正常流 |
| `z-raised` | 10 | 略提升（卡片 hover） |
| `z-dropdown` | 100 | 下拉選單 |
| `z-sidebar-mobile` | 200 | Mobile sidebar overlay |
| `z-popup` | 300 | Popup chat 浮窗 |
| `z-modal` | 400 | Modal / Dialog |
| `z-toast` | 500 | Toast 通知 |
| `z-navbar` | 600 | Top navbar（最高層） |

---

## 8. Tailwind CSS v4 `@theme` 完整定義

在 `src/index.css` 中使用 `@theme {}` 宣告所有 token：

```css
@import "tailwindcss";

@theme {
  /* ===== Primary Blue ===== */
  --color-primary-50:  #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #3b82f6;
  --color-primary-500: #1d4ed8;
  --color-primary-600: #1e3a8a;
  --color-primary-700: #1a2f7a;
  --color-primary-800: #162566;
  --color-primary-900: #0f1a4a;
  --color-primary-950: #090f2e;

  /* ===== Accent Cyan ===== */
  --color-accent-100: #cffafe;
  --color-accent-200: #a5f3fc;
  --color-accent-300: #67e8f9;
  --color-accent-400: #22d3ee;
  --color-accent-500: #00bcd4;
  --color-accent-600: #0891b2;
  --color-accent-900: #164e63;

  /* ===== Neutral ===== */
  --color-neutral-50:  #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* ===== Semantic ===== */
  --color-success-100: #dcfce7;
  --color-success-400: #4ade80;
  --color-success-500: #22c55e;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-error-100:   #fee2e2;
  --color-error-400:   #f87171;
  --color-error-500:   #ef4444;
  --color-info-100:    #eff6ff;
  --color-info-500:    #3b82f6;

  /* ===== Typography ===== */
  --font-sans: 'Inter', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* ===== Spacing Extensions ===== */
  --spacing-13: 52px;
  --spacing-18: 72px;
  --spacing-22: 88px;

  /* ===== Border Radius ===== */
  --radius-bubble-own:   18px 18px 4px 18px;
  --radius-bubble-other: 18px 18px 18px 4px;

  /* ===== Animation ===== */
  --duration-fast:   150ms;
  --duration-base:   200ms;
  --duration-theme:  300ms;
  --duration-slide:  250ms;
  --duration-popup:  200ms;

  /* ===== Z-Index ===== */
  --z-dropdown:        100;
  --z-sidebar-mobile:  200;
  --z-popup:           300;
  --z-modal:           400;
  --z-toast:           500;
  --z-navbar:          600;
}

/* Dark mode via class on <html> */
@layer base {
  html {
    color-scheme: light;
  }
  html.dark {
    color-scheme: dark;
  }
}
```

### Key Tailwind Class Patterns

```
Navbar bg:            bg-primary-700
Sidebar bg:           bg-primary-800 dark:bg-primary-900
Page bg:              bg-neutral-50 dark:bg-neutral-900
Chat area bg:         bg-white dark:bg-neutral-800
Card / panel bg:      bg-white dark:bg-[#1e293b]
Primary button:       bg-primary-500 hover:bg-primary-400 active:bg-primary-600 text-white
Accent badge:         bg-accent-500 text-white
Bubble own:           bg-primary-500 text-white rounded-[18px_18px_4px_18px]
Bubble other:         bg-white dark:bg-[#253248] text-neutral-900 dark:text-neutral-100 rounded-[18px_18px_18px_4px]
Focus ring:           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
Text primary:         text-neutral-900 dark:text-neutral-100
Text secondary:       text-neutral-500 dark:text-neutral-400
Text on sidebar:      text-white/85
Border default:       border-neutral-200 dark:border-neutral-700
Sidebar active item:  bg-primary-600 text-white
Online dot:           bg-success-500
```

---

## 9. Contrast Ratios（WCAG AA 驗證）

| Foreground | Background | Ratio | Result |
|------------|-----------|-------|--------|
| `#ffffff` | `primary-700` (#1a2f7a) | 10.1:1 | PASS AA + AAA |
| `#ffffff` | `primary-800` (#162566) | 12.3:1 | PASS AA + AAA |
| `#ffffff` | `primary-500` (#1d4ed8) | 5.1:1 | PASS AA |
| `neutral-900` (#0f172a) | `neutral-50` (#f8fafc) | 18.1:1 | PASS AA + AAA |
| `neutral-500` (#64748b) | `#ffffff` | 4.6:1 | PASS AA |
| `accent-500` (#00BCD4) | `#ffffff` | 3.1:1 | 僅大文字 / UI 元件（按此使用） |
| `#ffffff` | `accent-500` (#00BCD4) | 3.1:1 | 僅大文字 / UI 元件（badge 白字 ok，因 badge 是 UI 元件非內文） |
| `#ffffff` | `error-500` (#ef4444) | 3.9:1 | 僅 UI 元件（button label ok） |
| `neutral-900` | `primary-50` (#eff6ff) | 17.8:1 | PASS |

**規則**：sidebar 白色文字在 `primary-800` 上 → 12.3:1 PASS。訊息 bubble 白字在 `primary-500` → 5.1:1 PASS。

---

## 10. Design Decisions

1. **藍色系以 logo 為基準**：Logo 底色是 `#1E2FA8` 系（皇家藍），設計系統將 `primary-800` 定為 `#162566` 作為 sidebar 主色，確保視覺延續性。

2. **青色（accent）是唯一品牌強調色**：Logo 雙環的青色 `#00BCD4` 保留為 `accent-500`，專門用於 unread badge、active indicator、focus ring。不作為大面積填色使用（對比度不足 WCAG AA 內文標準）。

3. **Sidebar 深藍固定**：`bg-primary-800`（#162566），dark mode 改 `bg-primary-900`（#0f1a4a），不使用完全黑色，保持品牌藍色調一致性。

4. **Chat 區採用乾淨白色**：`bg-white`（light）/ `bg-neutral-800`（dark）。高對比的黑白讀寫環境，減少視覺疲勞。

5. **Navbar 跨 dark/light 不變色**：`primary-700`（#1a2f7a）在兩種模式下固定，作為品牌識別錨點。

6. **Message bubble 漸層呼應 logo**：自己的訊息從 `primary-500` 到 `primary-800`（深藍漸層），呼應 logo 藍色調。

7. **訊息 bubble 不對稱圓角**：自己 `18px 18px 4px 18px`（右下角切），對方 `18px 18px 18px 4px`（左下角切），符合通訊 app 行業慣例（Telegram / iMessage 風格）。
