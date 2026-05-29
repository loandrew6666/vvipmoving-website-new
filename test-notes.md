# VVIP Moving 網站全面測試報告

## 已修復的核心問題

### 1. ChatWidget.tsx - 聊天系統核心修復
- [x] `addCustomerMessage` 不存在的 tRPC 調用 → 改為使用 `ticket.sendChatMessage`
- [x] `ticketId` 永遠為 0，導致發送按鈕永遠禁用 → 修復 ticketId 傳遞和持久化
- [x] 重複的浮動「客服」按鈕（與 FloatingCTA 衝突）→ 移除 ChatWidget 自帶按鈕
- [x] `openChatWithEstimate` 沒有設置 ticketId → 新增 ticketId 設置邏輯
- [x] localStorage 持久化不完整 → 完善 ticketId 的存取

### 2. AiEstimate.tsx - AI 估價修復
- [x] `createTicket` 返回的 `id` 沒有傳給 ChatWidget → 新增 ticketId 傳遞

### 3. ChatPanel.tsx - 後台聊天面板修復
- [x] 引用不存在的 `@/types` 模組 → 內聯 ChatMessage 類型
- [x] 使用 `trpc.admin.markChatMessageAsRead.mutate()` 而非 `useMutation` → 修復為 useMutation

### 4. server/_core/index.ts - 後端修復
- [x] `/api/chat/send` 使用 `db.query.tickets` 但不支持此語法 → 改為 drizzle select

## 待修復的 UI/UX 問題

### 高優先級
1. FloatingCTA 按鈕位置 `fixed top-4 right-4` 與 Header 重疊
2. ChatWidget 手機版底部被 MobileBottomNav 遮擋
3. FloatingCTA 在手機版應調整位置避免與底部導航衝突

## API 測試結果
- [x] ticket.create → 成功返回 {ticketNo, id}
- [x] ticket.sendChatMessage → 成功發送訊息
- [x] ticket.getChatHistory → 成功獲取聊天記錄
- [x] TypeScript 編譯 → 0 錯誤
