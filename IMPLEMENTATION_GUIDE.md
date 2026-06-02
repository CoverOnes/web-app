# 🚀 Chat Web 實作指南

## ✅ 已完成

### 1. 專案初始化
- [x] 使用 Vite + React + TypeScript 建立專案
- [x] 安裝必要依賴 (axios, zustand, dompurify, date-fns, react-router-dom)
- [x] 創建專案目錄結構

### 2. 核心工具和配置
- [x] HTTP 客戶端配置 (`src/api/http.ts`)
- [x] 聊天 API 封裝 (`src/api/chat.ts`)
- [x] TypeScript 類型定義 (`src/types/index.ts`)
- [x] XSS 防護工具 (`src/utils/sanitize.ts`)
- [x] 輸入驗證工具 (`src/utils/validation.ts`)
- [x] 格式化工具 (`src/utils/formatters.ts`)

### 3. 狀態管理
- [x] Zustand Store 設置 (`src/store/chatStore.ts`)
- [x] 聊天狀態管理

### 4. 自定義 Hooks
- [x] SSE 連接 Hook (`src/hooks/useSSE.ts`)

### 5. 基礎組件
- [x] App 主組件 (`src/App.tsx`)
- [x] UserSelector 組件 (`src/components/common/UserSelector.tsx`)
- [x] 全局樣式 (`src/App.css`)

## 🔨 待實作組件

### 聊天室列表相關

#### ChatList.tsx
```tsx
位置：src/components/chat/ChatList.tsx
功能：
- 顯示聊天室列表
- 載入更多聊天室（滾動分頁）
- 點擊選擇聊天室
- 顯示未讀數量
- 創建新群組按鈕

重點：
- 使用 useChatStore 獲取聊天室列表
- 使用 chatApi.getRooms 載入資料
- 實現滾動到底部自動載入更多
```

#### RoomItem.tsx
```tsx
位置：src/components/chat/RoomItem.tsx
功能：
- 顯示單個聊天室項目
- 顯示頭像、名稱、最後訊息
- 顯示未讀徽章
- 顯示時間

props:
- room: Room
- isActive: boolean
- onClick: () => void
```

### 聊天室主界面

#### ChatRoom.tsx
```tsx
位置：src/components/chat/ChatRoom.tsx
功能：
- 聊天室標題列
- 訊息列表區域
- 訊息輸入框
- SSE 連接管理
- 自動標記已讀

子組件：
- ChatHeader (標題列)
- MessageList (訊息列表)
- MessageInput (輸入框)
```

#### MessageList.tsx
```tsx
位置：src/components/chat/MessageList.tsx
功能：
- 顯示訊息列表
- 滾動到底部
- 往上滾動載入更多歷史訊息
- 區分自己和他人的訊息
- 顯示系統訊息

重點：
- 使用 useSSE hook 接收即時訊息
- 實現虛擬滾動（可選，優化性能）
```

#### MessageBubble.tsx
```tsx
位置：src/components/chat/MessageBubble.tsx
功能：
- 顯示單條訊息
- 根據發送者顯示不同樣式
- 顯示已讀狀態
- 顯示時間

props:
- message: Message
- isOwn: boolean
- roomType: 'direct' | 'group'
```

#### MessageInput.tsx
```tsx
位置：src/components/chat/MessageInput.tsx
功能：
- 輸入框
- 發送按鈕
- Enter 鍵發送
- 輸入驗證

重點：
- 使用 validateMessage 驗證
- 使用 sanitizeInput 清理輸入
```

### 模態框組件

#### CreateRoomModal.tsx
```tsx
位置：src/components/chat/CreateRoomModal.tsx
功能：
- 創建群組表單
- 選擇成員
- 輸入群組名稱
- 提交創建

重點：
- 使用 chatApi.createRoom
- 表單驗證
```

#### RoomSettingsModal.tsx
```tsx
位置：src/components/chat/RoomSettingsModal.tsx
功能：
- 顯示群組成員
- 添加成員
- 移除成員
- 退出群組

重點：
- 使用 chatApi.addMember
- 使用 chatApi.removeMember
```

## 📝 實作步驟建議

### Phase 1: 基礎顯示（1-2小時）
1. 實作 RoomItem.tsx
2. 實作 ChatList.tsx（基礎版，不含滾動載入）
3. 測試聊天室列表顯示

### Phase 2: 聊天室主界面（2-3小時）
1. 實作 MessageBubble.tsx
2. 實作 MessageList.tsx（基礎版）
3. 實作 MessageInput.tsx
4. 實作 ChatRoom.tsx
5. 測試訊息顯示和發送

### Phase 3: 即時功能（1-2小時）
1. 整合 useSSE hook
2. 測試即時訊息接收
3. 實作自動標記已讀

### Phase 4: 進階功能（2-3小時）
1. 實作滾動分頁載入
2. 實作 CreateRoomModal.tsx
3. 實作 RoomSettingsModal.tsx
4. 測試創建群組、添加/移除成員

### Phase 5: 優化和測試（1-2小時）
1. 樣式調整
2. 效能優化
3. 錯誤處理
4. 完整測試

## 💡 重要提示

### 安全注意事項
1. 所有用戶輸入都要經過 `sanitizeInput` 和 `validateMessage`
2. 顯示用戶內容時使用 `escapeHtml` 或 `sanitizeHtml`
3. API 錯誤要妥善處理，不要洩漏敏感信息

### 效能優化
1. 使用 React.memo 優化組件重渲染
2. 大列表考慮使用虛擬滾動
3. 圖片懶加載
4. 適當使用 useCallback 和 useMemo

### 用戶體驗
1. 載入狀態要有 Loading 提示
2. 錯誤要有友好的提示訊息
3. 操作要有即時反饋
4. 滾動要流暢

## 🔗 相關文件

- [原始 HTML 參考](/Users/waynechen/_project/chat-gateway/web/index.html)
- [Chat Gateway API 文檔](../chat-gateway/README.md)
- [安全評估報告](見之前的審查)

## 🚦 啟動開發

```bash
# 啟動後端
cd ../chat-gateway
go run cmd/api/main.go

# 啟動前端
cd ../chat-web
npm run dev
```

訪問 http://localhost:5173 開始測試！

