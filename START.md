# 啟動指南

## 前置條件

確保 Chat Gateway 後端正在運行：
```bash
cd /Users/waynechen/_project/chat-gateway
go run cmd/api/main.go
```

## 啟動前端

```bash
cd /Users/waynechen/_project/chat-web
npm run dev
```

訪問：http://localhost:5500

## 功能列表

已完成功能：
- 用戶切換
- 聊天室列表（滾動載入更多）
- 選擇聊天室
- 訊息列表（滾動載入歷史）
- 發送訊息
- 即時接收訊息（SSE）
- 自動標記已讀
- 顯示未讀數量
- 安全輸入驗證
- XSS 防護

## 技術特性

- React 18 + TypeScript
- Vite 建置工具
- Zustand 狀態管理
- Axios HTTP 客戶端
- Server-Sent Events 即時通訊
- DOMPurify XSS 防護
- date-fns 日期處理

## 建置生產版本

```bash
npm run build
```

建置產物在 `dist/` 目錄

