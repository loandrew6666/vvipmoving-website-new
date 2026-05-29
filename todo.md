# VVIP Moving 官網 TODO

## 基礎架構
- [x] 資料庫 Schema 設計（案件/工單/FAQ/案例/新聞）
- [x] 全站 CSS 主題設定（品牌色、字體）
- [x] 全站 Header 導覽列（桌面+手機）
- [x] 全站 Footer
- [x] 浮動客服入口（右下角）

## 核心頁面
- [x] 首頁 (/)
- [x] 關於我們 (/about)
- [x] 服務項目總覽 (/services)
- [x] 到府估價 SOP (/evaluate)
- [x] 計價方式 - 台北 (/pricing-taipei)
- [x] 計價方式 - 高雄 (/pricing-kaohsiung)
- [x] 案例回顧 (/case)
- [x] 影音專區 (/video)
- [x] 常見問題 (/faq)
- [x] 最新消息 (/news)
- [x] 聯絡我們 (/contact)

## AI 智能估價（核心功能）
- [x] AI 估價頁面 (/ai-estimate)
- [x] Step 0：選擇服務區域（台北/高雄）
- [x] Step 1：房型格局計數器
- [x] Step 2：照片上傳（多張+預覽）
- [x] Step 3：AI 分析結果顯示（車數/傢俱/估價範圍）
- [x] Step 4：建立案件表單
- [x] 送出後顯示案件編號與 CTA

## 案件系統
- [x] 案件查詢頁面 (/track)
- [x] 案件建立 API
- [x] 案件狀態 Pipeline（new/pending/quoted/contracted/scheduled/completed/archived）
- [x] 台北/高雄分流邏輯
- [x] 案件通知（Owner Notification）

## SEO 與追蹤
- [x] 每頁 Title/Meta description/og tags
- [x] robots.txt
- [x] sitemap.xml
- [x] HTML lang="zh-TW"

## 測試
- [x] vitest 測試（7 個測試全部通過）
  - FAQ Router
  - Cases Router
  - News Router
  - Ticket Router（queryByNo, queryByPhone）
  - Auth Router

## 待辦（未來擴充）
- [ ] 後台管理介面（案件管理、狀態更新）
- [ ] LINE Webhook 整合（案件摘要自動傳送）
- [ ] 照片上傳至 S3 功能
- [ ] 真實案例圖片（需要客戶授權）

## 真實資料導入（第二階段）
- [x] 提取原網站所有真實照片 URL（wixstatic CDN）
- [x] 提取所有 YouTube 影片 ID 與縮圖（19 支影片）
- [x] 提取真實 FAQ 問答資料（25+ 題）
- [x] 提取真實計價方式（台北/高雄）
- [x] 提取真實服務項目說明
- [x] 提取真實新聞/最新消息（12 則）
- [x] 提取真實公司資訊（電話、地址、Email、社群連結）
- [x] 建立 brandData.ts 統一管理所有真實品牌資料
- [x] Header 導入真實 Logo 圖片與電話
- [x] Footer 導入真實聯絡資訊與社群連結
- [x] 首頁導入真實 Hero 圖片、影片、新聞
- [x] 關於我們頁面導入真實文案
- [x] 服務項目頁面導入真實服務說明
- [x] 計價方式台北/高雄頁面導入真實計價資料
- [x] 影音專區導入真實 YouTube 影片（19 支）
- [x] FAQ 頁面導入真實問答資料
- [x] 案例回顧頁面導入真實案例照片
- [x] 最新消息頁面導入真實新聞資料
- [x] 到府估價頁面導入真實 SOP 流程
- [x] 聯絡我們頁面導入真實聯絡資訊

## 視覺修正（第三階段）
- [x] Footer 版權年份 2020 → 2026
- [x] Footer/Header Logo 圖片顯示修復
- [x] 首頁 Hero 區 AI 估價按鈕反白問題修正
- [x] 首頁台北/高雄切換按鈕重新設計（未選中的按鈕要清楚可見）
- [x] 首頁服務項目區塊重新提取（參考原網站 /type 頁面）
- [x] 首頁計價方式區塊完善（含樓層費用、行政區劃分）
- [x] Header 導覽列文字置中對齊
- [x] 首頁營業時間 09:00–18:00 → 09:00–21:00

## 按鈕可見性修正（第四階段）
- [x] About.tsx 按鈕反白問題修正
- [x] 全站所有頁面按鈕可見性全面檢查與修正（Services、Evaluate、PricingTaipei、PricingKaohsiung、Faq）
- [x] Header/Footer Logo 圖片修復（改用 useState 管理錯誤狀態，移除 brightness-0 invert）

## 全面優化（第五階段）
- [x] 建立全站按鈕可見性自動檢核（確認全站 bg-brand 色彩正確定義）
- [x] 修正所有橘色背景上消失的白色按鈕（AI估價、立即預約、LINE預約等）
- [x] 修正最新消息分類按鈕「全部」看不到問題（按鈕已正確顯示）
- [x] 補充包材介紹頁面（/packaging）完整資料與圖片（16 種包材全部補齊）
- [x] 重新設計服務項目頁面（參考原網站，包含真實照片與服務說明）
- [x] 補充關於我們頁面照片（家的溫暖、法律顧問證書、公司登記證明）
- [x] 從 Facebook/Instagram 提取最新消息文章（2025-2026 年度最新 10 則）
- [x] 從 IG 提取最新素材照片（已將最新貧文內容更新至最新消息）
- [x] 全站所有頁面橘色背景按鈕統一修正（Tailwind 4 @theme 加入 --color-brand 定義）

## 第六階段優化
- [x] 最新消息圖片從臉書真實貼文提取（含 fbcdn 真實照片+文案整合）
- [x] 服務項目照片畫質提升（使用原網站高解析度圖片）
- [x] 案例回顧照片從原網站 /case 提取真實 YouTube 高畫質縮圖
- [x] 包材介紹完整參照原網站 /package 重建（真實圖片已導入）
- [x] 關於創勝頁面完整重新設計（AI生成背景圖、溫馨家庭照、律師區塊、證書）
- [x] 導覽列 BAR 互動方式改善（hover 顯示、點擊自動關閉、路由變更自動關閉）
- [x] 服務項目頁面加入常見問題區塊（6 則 FAQ，參照 /fqa）
- [x] 聯絡我們改版（AI 估價優先）並修正 DialogTitle 無障礙錯誤

## 第七階段優化
- [x] 包材介紹從原網站完整提取照片與文字說明（15 張真實包材照片上傳 S3）
- [x] 最新消息從 IG/FB 下載真實照片並導入（2024-2026，臉書路跨活動合照+尾牙合照）
- [x] 關於創勝：刪除手捧房子的 AI 生成圖片（改為臉書真實全員合照）
- [x] 關於創勝：法律顧問區塊改為完整展示貨運會員證書+法律顧問證書（大圖展示）
- [x] 關於創勝：修正年份（20+ 年搞家經驗）
- [x] 關於創勝：Google 評分改為 4.2 並優化呈現方式
- [x] 關於創勝：經營理念區塊換成真實溫馨照片（臉書路跨活動合照）
- [x] 所有背景圖片上傳 S3 永久 CDN URL（Hero 背景圖、律師背景圖）

## 第八階段修正
- [x] 最新消息圖片全部重新提取（Facebook CDN 過期圖片 → 下載並上傳至 S3 永久 CDN）
- [x] 包材介紹圖片確認正常顯示（16 種包材圖片均正確）
- [x] 頂部橘色 BAR 文字置中（justify-between → justify-center）
- [x] 刪除案例回顧 2023/09 台北市信義區 3房2廳 精緻搬家

## 第九階段：案件系統全面升級
- [x] 資料庫 Schema 已有完整欄位（搬家地址、房型、圖片URL、AI分析結果、備註等），無需變更
- [x] AiEstimate.tsx 加入 customerEmail 欄位（表單輸入和傳遞）
- [x] routers.ts ticket.create 升級豐富 email 通知（包含完整客戶資料、圖片連結、AI分析結果、地址、房型）
- [x] Track.tsx 完全重寫：進度条、客戶資料、搬家詳情、AI分析結果（可展開）、圖片預覽（可展開）
- [x] Header.tsx DialogTitle 無障礙錯誤修復（SheetTitle + VisuallyHidden）

## 第十階段：檔案上傳系統全面升級
- [x] 升級 upload API：新增 uploadFile procedure，支援 PDF/JPG/PNG/MP4/ZIP 多種格式，永久儲存至 S3
- [x] ZIP 自動解壓：解壓後將內部每個檔案分別上傳至 S3，回傳所有子檔案 URL
- [x] 資料庫 Schema 擴充：新增 uploadedFiles 欄位（含 name/type/url/size/extractedFiles），已執行 db:push
- [x] Track.tsx 升級：圖片預覽、PDF 連結下載、MP4 影片播放、ZIP 解壓內容展示（新系統優先，舊系統備用）
- [x] AiEstimate.tsx 升級：支援多種格式選擇，上傳時直接永久儲存至 S3，顯示上傳進度狀態

## 第十一階段：手機版全面優化
- [x] 底部固定 Tab Bar：首頁/AI估價（突出圓形）/撥打/案件查詢/更多選單
- [x] 更多選單抽屌：3欄格狀導航 + 快速撥打/LINE 按鈕
- [x] 首頁 Hero 手機版：大觸控 CTA、信任指標列、服務卡片橫向滑動
- [x] 服務卡片改為橫向滑動（overflow-x-scroll + snap）
- [x] 影音/最新消息改為 2 欄格狀
- [x] 各頁 Hero 縮小到 h-40（手機版）
- [x] 最新消息/包材介紹改為 2 欄格狀
- [x] 分類按鈕改為 sticky 導航列
- [x] FloatingCTA 手機版隱藏（由 Tab Bar 取代）
- [x] TypeScript 0 errors 確認

## 第十二階段：手機版視覺修正
- [x] 強制整個網站只使用淺色主題：覆寫 .dark CSS 變數為淺色對應値，不再跟隨系統深色模式
- [x] 橘色 Banner 上的「高雄預約」按鈕改為溫和暗橘色（bg-brand-dark/80）
- [x] 全站檢查：只有影片播放器使用 bg-black，其他區域無深黑色按鈕

## 第十三階段：AI 估僷系統全面重建
- [x] 後端：真正 LLM 影像辨識（照片驗證 + 物件辨識）
- [x] 後端：依物件車數對照表計算總車數和估僷範圍
- [x] 前端：依房型分區上傳（客廳/臥室/廤房/書房/玄關/其他）
- [x] 前端：照片驗證提示（非室內照片時警告）
- [x] 前端：辨識結果顯示物件清單 + 車數明細

## Bug 修復：AI 估價 estimateNote 車數矛盾（2026-02-27）
- [x] estimateNote 由後端依實際計算結果組合生成，不讓 LLM 自行填寫車數數字
- [x] LLM 只負責提供「物件辨識摘要說明」，車數數字一律由後端計算後注入

## 第十四階段：後台管理介面 + 物件對照表更新（2026-02-27）
- [x] 更新 ITEM_TRUCK_MAP 為客戶官方對照表（含別名對應，如「液晶電視」→「電視」）
- [x] 後台路由 /admin 加入 App.tsx（adminProcedure 保護）
- [x] 後台案件列表頁（DashboardLayout，含搜尋/篩選/狀態標籤）
- [x] 後台案件詳情頁（AI 估價紀錄、物件清單、照片預覽、狀態更新）
- [x] 後端 adminRouter：案件查詢、狀態更新 procedures
- [x] 新增 vitest 測試：adminRouter

## 第十五階段：全站 Icon 統一設計語言（2026-02-27）
- [x] 移除所有 emoji（🌴🏙️🎯 等）
- [x] 移除「過度 AI 感」彩色圓角方塊 icon（多色背景 + 多色 lucide icon）
- [x] 統一為簡潔單色 lucide icon，搞配品牌橘色，無多彩背景
- [x] 修改首頁、服務、關於、價格頁
- [x] 修改 FAQ、案例、聯絡、包裝、追蹤頁
- [x] 修改公用元件（Header、Footer、FloatingCTA、MobileBottomNav）


## 第十六階段：資安修復 - 停用 Amplitude（2026-02-27）
- [x] 確認前端代碼無硬編碼的 Amplitude API key
- [x] 確認 Umami 追蹤已正確配置（index.html 第 26-29 行）
- [ ] 聯繫 Manus 平台支援，要求停用 Amplitude 追蹤（平台層級注入）
- [ ] 確認 VITE_ANALYTICS_ENDPOINT 和 VITE_ANALYTICS_WEBSITE_ID 環境變數已正確配置


## 第十七階段：AI 估價相機拍攀流程優化 + RWD 修正（2026-02-27）
- [x] 修正手機 RWD 文字溢出問題（結果頁面估價說明、物件清單、風險物件警示）
- [x] 建立相機拍攀流程組件（CameraCapture.tsx）：連續拍攀、確定上傳、拍攀輔助提示
- [x] 整合相機流程到 AiEstimate.tsx：選擇空間 → 相機拍攀 → 確定上傳到該空間
- [x] 保留直接上傳已存照片選項（作為備選方案）
- [x] 測試相機流程在 iOS 和 Android 的相容性


## 第十九階段：簡化客戶聊天系統（2026-03-01）
- [x] 擴充 tickets 表：加入 customerIP、chatHistory（JSON）欄位（db:push 完成）
- [x] 前端 ChatWidget：客戶資料表單 + 聊天 UI + 本地儲存（localStorage）
- [x] 後端 tRPC procedures：客戶聊天相關操作（admin.sendChatMessage、admin.getChatHistory）
- [x] 後台聊天管理：在 AdminTicketDetail 加入聊天記錄顯示和客服回覆功能
- [x] 測試：成功執行 29 個 vitest 測試（包含 6 個新的聊天系統測試）


## 第二十階段：聊天系統增強功能（2026-03-01）
- [x] 聊天記錄關鍵字搜尋：在 AdminTicketDetail 聊天區塊加入搜尋輸入框，支援即時篤選
- [ ] WebSocket 實時通知：跳過（複雜度較高）
- [x] 客戶 IP 綁定驗證：實現 IP 位置識別，下次訪問自動帶入客戶資訊


## 第二十一階段：聊天系統和照片拍攝功能升級（2026-03-01）
- [x] 修複 ticket.queryByCustomerIp API 查詢錯誤（返回 undefined 改為 null）
- [x] AI 估價結束後自動打開聊天對話框並帶入估價資訊
- [x] 照片拍攝功能升級：支援多張照片、數字標記、拍攝提醒


## 第二十二階段：Bug 修復（2026-03-01）
- [x] 修復 AdminTicketDetail 無限迴圈更新錯誤：調整 useEffect 依賴項，使用 chatHistory.length 而非整個陣列物件


## 第二十三階段：關鍵問題修複（2026-03-01）
- [x] 修複文字過長溢出問題：調整 CSS 換行和文字截斷，支援多語言
- [ ] 修複聊天訊息發送故障：需要解決 tRPC 類型同步問題（複雜度較高，後續版本實現）
- [x] 修複照片數字編號錯誤：新上傳照片應該是下一個編號，而非重複最後一張的編號
- [ ] 更新估價表並修複車數計算邏輯：使用新的估價表，加入推理模式動态調整（後續版本實現）


## 第二十四階段：聊天系統關鍵問題修復（2026-03-01）
- [x] 修復頁面重整後聊天視窗消失：改進 localStorage 持久化邏輯，確保客戶資訊和聊天記錄在頁面重整後仍然保留
- [x] 修復客戶端訊息發送功能：實現正確的訊息發送邏輯，確保訊息能正常顯示在聊天框中
- [x] 實現前後台訊息同步：新增 /api/chat/send 端點，確保前台傳的訊息能保存到資料庫


## 第二十五階段：後台客服工作隊列功能（2026-03-01）
- [ ] 後端數據模型擴充：在 tickets 表中添加 status 欄位（pending, replied, completed）
- [ ] 後端 API 定義：實現 ticket.listPending 查詢待回覆案件
- [ ] 後台 UI 實現：在 AdminTickets 頁面添加「待回覆」篩選按鈕和排序功能
- [ ] 測試並驗證篩選和排序功能正常運作


## 第二十六階段：後台 UI 排序和篩選功能（2026-03-02）
- [x] 在 AdminDashboard 中添加「待回覆」快速篩選按鈕（琥珀色，點擊立即篩選）
- [x] 實現排序功能：最新建立、最早建立、最近更新
- [x] 優化 UI 布局：篩選和排序控制項並排顯示


## 第二十七階段：聘天系統完整重建（2026-03-02）
- [x] 診斷聘天系統問題：持久化失效、案件編號驗證邏輯錯誤
- [x] 重構 ChatWidget 組件：完整的 localStorage 持久化邏輯
- [x] 實現案件編號驗證：只有正確的案件編號才能查詢後台資料
- [x] 實現修正和清除功能：用戶可以修正錯誤並清除聘天室
- [x] 前後台訊息同步：確保訊息能正常發送和接收
- [x] 測試聘天系統：手機重整、案件編號修正、訊息發送
## 第二十八階段：聘天系統完全重建 - 修警案件編號查詢和訊息同步（2026-03-02）
- [x] 診斷問題：案件編號查詢失效、訊息同步完全失效
- [x] 修警後端 API：案件查詢、訊息保存、訊息查詢
- [x] 重構前端 ChatWidget：完整的聊天邏輯
- [x] 實現後台客服介面：查看和回覆訊息
- [x] 完整流程測試：客戶發送 → 後端保存 → 客服查看 → 客服回覆 → 客戶接收
- [x] 添加 Email 通知功能
- [x] 最終驗證和 Checkpoint


## 第二十九階段：聘天訊息已讀/未讀功能（2026-03-02）
- [x] 更新資料庫模式：添加訊息已讀狀態欄位
- [x] 擴展後端 API：實現訊息已讀狀態管理
- [x] 改進前端 ChatWidget：顯示已讀狀態
- [x] 改進後台 ChatPanel：標記已讀和優先顯示未讀
- [x] 改進後台儀表板：顯示未讀訊息計数
- [x] 測試和驗證完整功能


## 第三十階段：聘天系統完整重建 - 自動開啟和持久化（2026-03-02）
- [x] 重構 ChatWidget：移除驗證環節，簡化 UI
- [x] 實現自動開啟：AI 估價送出後立即開啟聘天
- [x] 實現持久化：重整頁面後對話框仍存在
- [x] 移除 LINE 選項：聘天對話框中不顯示 LINE 联繫
- [x] 添加文件上傳：支援圖片傳送功能
- [x] 測試完整流程：估價→聘天→持久化


## 第三十一階段：UI/UX 優化 - 強化 AI 估價流程（2026-03-02）
- [x] 優化 AI 估價彈窗：移除「加入 LINE」和「立即預約」按鈕
- [x] 整合懸浮窗按鈕：合併客服和 AI 估價按鈕，避免重疊
- [x] 優化全站流程：所有客戶優先引導到 AI 智能估價
- [x] 響應式設計：考量電腦、手機和移動端設備
- [x] 測試完整流程：驗證 UI 在各設備上的表現


## 第三十二階段：緊急修警 - 合併按鈕和聘天系統（2026-03-02）
- [x] 合併客服和 AI 估價按鈕設計（參考第一張截圖）
- [x] 移除脚沈特效
- [x] 修警 iPhone 點擊問題
- [x] 恢複 AI 估價彈窗多個快捷按鈕
- [x] 修警聘天訊息發送問題
- [x] 驗證客服訊息發送→後端接收→客服回覆→客戶接收
- [x] 驗證 AI 估價完成→自動開啟聘天框
- [x] 驗證重新刷新頁面後聘天框仍存在
- [x] 驗證重新開啟新 AI 估價後聘天框仍存在
- [x] 驗證後台能看到所有訊息


## 第三十三階段：全面測試和修復（2026-03-02）
- [x] 修復 ChatWidget ticketId 傳遞問題（從 AI 估價正確傳遞 ticketId）
- [x] 修復 ChatWidget 發送按鈕永遠禁用問題（ticketId 為 0 導致 canSend 為 false）
- [x] 修復 ChatWidget localStorage 持久化（ticketId 正確保存和恢復）
- [x] 修復 FloatingCTA 與 Header 重疊問題（桌面版改為右下角）
- [x] 修復 FloatingCTA 手機版與 MobileBottomNav 衝突（手機版客服按鈕在底部導航上方）
- [x] 修復 ChatWidget 手機版被 MobileBottomNav 遮擋（bottom 偏移 4.5rem）
- [x] 修復 ChatPanel.tsx 引用不存在的 @/types 模組
- [x] 修復 ChatPanel.tsx 使用 trpc.admin.markChatMessageAsRead.mutate() 改為 useMutation
- [x] 修復 server/_core/index.ts /api/chat/send 端點使用不支持的 db.query.tickets 語法
- [x] 修復 AiEstimate.tsx 正確提取 ticket.create 返回的 ticketId
- [x] 修復 AdminTicketDetail 聊天面板 onKeyPress 改為 onKeyDown
- [x] 修復 AdminTicketDetail 聊天面板缺少自動刷新（refetchInterval）
- [x] 修復 ChatWidget 中文輸入法 Enter 鍵問題（isComposing 檢查）
- [x] 全面瀏覽器測試（桌面版 + 手機版）
- [x] 運行 vitest 確保所有測試通過（37 個測試全部通過）

## 第三十四階段：聊天圖片上傳和電話按鈕（2026-03-02）

- [x] 修復後台聊天面板傳送訊息後顯示延遲（改為樂觀更新）
- [x] 後台 ChatPanel 添加圖片上傳功能（上傳到 S3 後發送圖片訊息）
- [x] 後台 AdminTicketDetail 聊天區域支援圖片上傳
- [x] 前台 ChatWidget 添加圖片上傳按鈕（本機圖片）
- [x] 前台 ChatWidget 添加相機拍攝按鈕（開啟相機模組）
- [x] 前台 ChatWidget 右上角添加電話按鈕（直接撥打 02-55740033）
- [x] 後端 API 支援圖片訊息類型（imageUrl 欄位）
- [x] 前後台聊天訊息支援顯示圖片

## 第三十五階段：DDoS 防護和安全加強（2026-03-07）
- [x] 全局速率限制中間件（每 IP 每分鐘 60 次）
- [x] 敏感端點加強限制（AI 估價/案件建立 150秒1次）
- [x] IP 黑名單機制（連續觸發限制自動封鎖 30 分鐘）
- [x] 請求體大小限制（JSON 1MB, 檔案 16MB）
- [x] User-Agent 和 Content-Type 驗證
- [x] 欄位正規表示式格式驗證（前後端）
- [ ] 隱藏 tRPC 路由協定防止掃描
- [ ] 資料庫加密字段和註冊記錄表
- [x] 防止未授權用戶成為管理員（已完成）
- [x] 移除不安全的公開端點（已完成）

## 第三十六階段：資料庫分表、DDoS 防護和搜尋強化（2026-03-07）
- [x] 資料庫分表：tickets（公開資訊）+ ticket_sensitive（機敏資料）+ chat_messages（獨立聊天表）
- [x] BTREE 索引：ticketNo、status、createdAt、customerPhone 等
- [x] 機敏資料隔離：只有 admin 才能 JOIN 查詢 ticket_sensitive
- [x] chat_messages 獨立表（從 JSON 欄位遷移出來）
- [x] DDoS 防護中間件實施
- [x] 路由隱藏：隱藏 stack trace、混淆 tRPC 路由路徑
- [x] /api/chat/send 端點加入認證
- [x] 後台搜尋強化：複合搜尋、分頁、排序
- [x] 前端適配新 API 結構

## 第三十七階段：資料庫架構重構 - 獨立表 + 索引（2026-03-07）
- [x] chat_messages 獨立表（從 tickets.chatHistory JSON 遷移）
- [x] ticket_photos 獨立表（從 tickets.photoUrls JSON 遷移）
- [x] ticket_files 獨立表（從 tickets.uploadedFiles JSON 遷移）
- [x] ticket_room_layouts 獨立表（從 tickets.roomLayout JSON 遷移）
- [x] ticket_ai_results 獨立表（從 tickets.aiResult JSON 遷移）
- [x] 所有表加上 BTREE 索引（ticketNo, status, customerPhone, createdAt 等）
- [x] 後端 db.ts 資料存取層重寫（適配新表結構）
- [x] 後端 routers.ts 適配新資料結構
- [x] 前端適配新 API 結構
- [x] 資料遷移腳本（舊 JSON → 新表）- 49 筆案件成功遷移
- [x] DDoS 防護中間件（全局速率限制 + IP 黑名單）
- [x] 安全標頭和請求驗證中間件
- [x] 移除不安全的 /api/chat/send 端點
- [x] Vitest 測試更新（55 個測試全部通過）
- [x] TypeScript 0 錯誤確認


## 第三十八階段：Priority 1 安全加固措施（2026-03-07 緊急）
- [x] AES-256 加密敏感欄位（customerPhone、customerEmail、customerAddress）
- [x] CSRF 令牌驗證中間件與 tRPC 整合
- [x] OAuth 端點速率限制（15 分鐘 5 次嘗試）
- [x] 審計日誌表與記錄機制（所有敏感資料訪問）
- [x] Vitest 測試更新（64 個測試全部通過）
- [x] TypeScript 編譯驗證（0 錯誤）
- [x] db.ts 敏感資料存取層整合
- [x] routers.ts 創建案件時自動加密敏感資料
- [x] 加密密鑰生成和環境變數設置
- [x] CSRF 中間件在 Express 中註冊
- [x] OAuth 速率限制在 Express 中註冊


## 第三十九階段：管理員審計日誌檢視面板（2026-03-07）
- [ ] routers.ts 新增 admin.auditLogs 查詢端點
- [ ] 前端 AuditLogViewer 元件（表格、篩選、分頁、排序）
- [ ] AdminDashboard 整合審計日誌面板
- [ ] 審計日誌匯出 Excel 功能
- [ ] Vitest 測試覆蓋
- [ ] TypeScript 編譯驗證


## 第三十九階段：管理員審計日誌檢視面板（2026-03-07 完成）
- [x] routers.ts 新增 admin.auditLogs 查詢端點
- [x] 前端 AuditLogViewer 元件（表格、篩選、分頁、排序）
- [x] AdminDashboard 整合審計日誌面板
- [x] 審計日誌匯出 Excel 功能
- [x] TypeScript 編譯驗證（0 錯誤）
- [x] 依賴安裝（xlsx、date-fns）


## 第四十階段：AI 估價功能失敗診斷與修復（2026-03-08 完成）
- [x] 檢查估價端點（routers.ts 中的 estimate 端點）
- [x] 檢查前端估價請求邏輯（AiEstimate.tsx）
- [x] 根因分析：CSRF 中間件阻擋所有 tRPC POST 請求（返回 403 Forbidden）
- [x] 修正 CSRF 中間件：豁免 /api/trpc 路由（tRPC 已有 JSON content-type + SameSite cookie 保護）
- [x] 修正 uploadFile/uploadPhoto 從 protectedProcedure 改為 publicProcedure（AI 估價是公開功能）
- [x] 添加詳細錯誤日誌（前端上傳/分析日誌，後端 LLM 錯誤詳情）
- [x] 測試估價功能（curl 測試 uploadFile 和 analyze 端點均返回 200）
- [x] 64 個 Vitest 測試全部通過
- [x] TypeScript 0 錯誤


## 第四十一階段：ChatWidget TypeScript 類型錯誤修復（2026-03-08）
- [x] 診斷 addCustomerMessage 類型錯誤根因（LSP watch 模式緩存錯誤，實際代碼已無此引用）
- [x] 修復速率限制錯誤：聊天端點誤用 aiEstimate 的 150s 限制，改為專用限制
- [x] TypeScript 編譯驗證（tsc --noEmit 0 錯誤）
- [x] 聊天系統功能測試（getChatHistory/sendChatMessage/uploadChatImage 全部正常）
- [x] 64 個 Vitest 測試全部通過


## 第四十二階段：AI 估價物件辨識與車數對照表調校（2026-03-08 完成）

## 第四十三階段：估價結果文字調整（2026-03-08 完成）
- [x] 移除建議車型部分
- [x] 統一改為「估價師報價為準」
- [x] 更新估價說明文字
- [x] 讀取現有物件對照表與 AI 估價 prompt
- [x] 根據實際車輛規格重新設計物件材積對照表（120+ 物件）
- [x] 更新 AI 估價 prompt（加強物品辨識要點、車型推薦）
- [x] 更新計算邏輯（模糊匹配、材積顯示、車型推薦）
- [x] 64 個 Vitest 測試全部通過
- [x] TypeScript 0 錯誤


## 第四十三階段：基本單位修正與物件材積重新計算（2026-03-08）
- [ ] 修正基本單位：1白箱=55×40×31.6cm=5材（而非之前的估算）
- [ ] 重新計算所有物件的材積值
- [ ] 更新 ITEM_TRUCK_MAP 中每個物件的車數單位值
- [ ] 更新 AI prompt 中的基本單位說明
- [ ] 測試驗證新的估價結果
- [ ] 64 個 Vitest 測試全部通過
- [ ] TypeScript 0 錯誤


## 第四十四階段：AI 估價 Bug 修復 + 全站文字修正（2026-03-08）
- [x] 修復物件清單每個物件顯示 0.00 車的問題（後端計算的 truckUnit 回寫到 detectedItems）
- [x] 全站文字搜索替換：「到府評估為準」→「估價師評估為準」
- [x] 全站文字搜索替換：「上門評估為準」→「估價師評估為準」
- [x] 驗證 AI 估價完整流程（64 個測試全通過）


## 第四十五階段：ITEM_TRUCK_MAP 重新校準 + AI 估價照片去重（2026-03-08）
- [x] 根據計算公式重新生成 ITEM_TRUCK_MAP（物件體積 / 13,904 / 200 + 安全係數）
- [x] 實現 AI 估價照片去重邏輯（相同照片、重疊空間）
- [x] 測試驗證與交付（64 個測試全通過）

## 第四十六階段：建立案件表單優化 + Bug 修復（2026-03-08）
- [x] 修復建立案件失敗的 Bug（moveDate 格式、addressSchema 驗證放寬）
- [x] 搬離/搬入地址改為下拉選單（縣市→區→詳細地址）
- [x] 加入電梯選擇（有/無）和樓層數欄位
- [x] 後端 API 相容性調整（schema + DB migration）
- [x] 測試驗證（64 個測試全通過）

## 第四十七階段：建立案件失敗 Bug 修復（2026-03-08）
- [x] 診斷建立案件失敗的根本原因（Select 無限渲染 + 樓層類型錯誤）
- [x] 修復問題並驗證（fromFloor/toFloor 改為 string state）
- [ ] 修複「計價」「估價」的「價」字顯示錯誤（待確認）

## 第四十八階段：懸浮 QA 按鈕 + QA 資料庫（2026-03-08）
- [x] 讀取 Excel QA 資料並分析結構（98 筆 QA）
- [x] 將 QA 資料存入資料庫（schema + seed，16 個分類）
- [x] 建立懸浮 QA 按鈕組件（RWD 不重疊，桌面左下、手機右側上方）
- [x] 實現 QA 搜尋與自動回覆功能（分類瀏覽 + 關鍵字搜尋 + 對話式回覆）
- [x] 測試驗證（64 個測試全通過）


## 第四十九階段：QA 搜尋邏輯優化 - 智能分類和相似度匹配（2026-03-08）
- [ ] 實現 LLM 自動分類用戶問題到專業類別
- [ ] 優化 QA 搜尋邏輯：完全匹配 → 類別匹配 → 相似度匹配
- [ ] 更新 QAWidget 前端邏輯（移除「轉人工」，改為提供最接近的答案）
- [ ] 測試驗證與交付


## 第四十九階段：QA 搜尋邏輯優化 - 智能分類和相似度匹配（2026-03-08）
- [x] 實現 LLM 自動分類用戶問題到專業類別
- [x] 優化 QA 搜尋邏輯：完全匹配 → 類別匹配 → 相似度匹配
- [x] 更新 QAWidget 前端邏輯（移除「轉人工」，改為提供最接近的答案）
- [x] 測試驗證（64 個測試全通過）


## 第五十階段：緊急 Bug 修複 - FAQ 按鈕無法點擊（2026-03-08）
- [x] 診斷 FAQ 按鈕無法點擊的原因（全頁遮罩残留—FloatingCTA/MobileBottomNav overlay 沒有關閉）
- [x] 修複問題（路由切換時自動關閉 overlay、overlay z-index 降低至 z-30、按鈕/菜單提升至 z-[100]）64 個測試全通過）

## 第五十一階段：完整修復浮層按鈕佈局（2026-03-08）
- [x] 左下角 QA 機器人按鈕可點擊（inline style z-index:9999）
- [x] 右下角客服按鈕（上）+ AI 估價按鈕（下）恢復原本排列
- [x] RWD 設計考量不同裝置（桌面/手機版分開處理）
- [x] 所有按鈕不重疊不遮擋（移除全頁遮罩、inline style）
- [x] 測試驗證（64 個測試全通過，tsc 0 錯誤）


## 第五十四階段：按鈕對齊 + 案件送出修復（2026-03-08）
- [x] 左右浮動按鈕對齊：QA（左下）與客服+AI估價（右下）水平對齊
- [x] QA 按鈕不遮擋頁面內容（按鈕縮小 + 位置調整）
- [x] 手機版按鈕不與底部導航欄重疊（手機版 bottom: 4.5rem）
- [x] AI 估價案件送出失敗修復（LINE ID @ 符號驗證 + 空字串處理）
- [x] 案件編號格式支援高雄 KH
- [x] Contact 表單 email/message 空字串處理
- [x] 64 個 Vitest 測試全通過
- [x] TypeScript 0 錯誤

## 第五十五階段：QA 按鈕底部對齊修復（2026-03-08）
- [x] 根本原因診斷：Tailwind md:flex 無法覆蓋 inline style display:none
- [x] FloatingCTA 完整重寫：用 JS useIsMobile() hook 控制顯示
- [x] 電腦版：按鈕組容器 bottom:1.5rem，QA 按鈕 bottom:1.5rem，完全對齊
- [x] 手機版：AI估價 bottom:4.5rem，客服 bottom:8rem，QA bottom:4.5rem，完全對齊
- [x] 64 個測試全通過，TypeScript 0 錯誤

## QA 問答圖片整合（2026-03-09）
- [x] 上傳 11 張客服圖片至 CDN（包材價目表、收納品價目表、無印良品收納品、垃圾清運、搬家事前通知、收納品代購、倉儲服務、整理服務、搬家事前說明、拍照精選範例、貨車＆車數介紹）
- [x] 擴充 faqs 表：新增 imageUrl 欄位，執行 db:push 遷移
- [x] 更新 qa-search.ts Faq 介面：加入 imageUrl 欄位
- [x] 更新 14 個現有 FAQ 對應圖片（包材、貨車、倉儲、整理、垃圾清運等）
- [x] 新增 10 個附圖片的 FAQ 問答（包材種類費用、貨車車型換算、垃圾清運費用、倉儲費用流程、整理收納費用、收納品代購、收納品品牌規格、搬家前注意事項、估價照片說明、自行打包說明）
- [x] 更新 QAWidget.tsx：bot 回覆訊息支援顯示圖片，點擊圖片可放大查看
- [x] TypeScript 0 errors 確認

## 第 N 階段：移除 QA 功能 + AI 估價必填（2026-03-09）
- [x] 移除 QAWidget 組件（從 App.tsx 移除 import 和使用）
- [x] 移除 faq.search 路由（保留 faq.list 供 FAQ 頁面使用）
- [x] AI 估價表單：姓名、電話設為必填（前端紅框提示 + 驗證）
- [x] AI 估價表單：搬離/搬入地址縣市與行政區設為必填（前端驗證）

## ERP 系統串接 API（2026-03-11）
- [x] 分析現有資料結構（tickets、chatMessages、uploadedFiles）
- [x] 設計 ERP 串接 API 端點（RESTful + Webhook 推送）
- [x] 實作 API Key 認證機制
- [x] 實作 Webhook 推送（新案件、新訊息、狀態更新時主動通知 ERP）
- [x] 實作 RESTful 查詢 API（案件列表、案件詳情、聊天記錄、檔案）
- [x] 實作 ERP 回寫 API（客服回覆、狀態更新）
- [x] 撰寫 vitest 測試驗證 API 可行性（71 個測試全部通過）
- [x] 撰寫完整 API 串接文件（含下載）

## Footer 電話號碼修改（2026-03-11）
- [x] Footer.tsx 電話顯示改為只顯示 02-55740033（移除行動電話 0983-238-773）

## Bug 修復：AI 估價手動上傳照片失敗（2026-03-11）
- [x] 診斷步驟 4 手動上傳照片顯示「上傳 image.jpg 失敗，請重試」的根本原因（body parser 限制 1MB 太小）
- [x] 修復上傳功能：增加 body parser 限制至 70MB + 前端照片壓縮（1920px/0.8品質）

## 估價品項車數對照表修正（2026-05-03）
- [x] 分析 PDF 原始對照表與系統 ITEM_TRUCK_MAP 差異
- [x] 建立實務修正模型（限高、堆疊、緩衝係數）
- [x] 更新 server/routers.ts 中的 ITEM_TRUCK_MAP（約 180 項品項全部修正）
- [x] 驗證修正後估價結果合理性（71 個測試全通過）
- [x] 產出修正後的對照表文件（PDF + Markdown）

## 雲梯車互動動畫 Landing Page（2026-05-03）
- [x] 上傳真實雲梯車照片至 CDN
- [x] 安裝 GSAP 動畫庫 + storageProxy
- [x] 重寫互動頁面：Hero 改用白天照片、動畫更強烈
- [x] 滾輪控制雲梯車作業流程（駛入→展開→升起→送貨→幸福到家）
- [x] 移除圖片畫廊，專注純 3D 雲梯車互動體驗
- [x] 「運送幸福到家」情感設計
- [x] 手機與電腦版響應式效果
- [x] 引導至 AI 估價的 CTA

## 3D 渲染雲梯車互動首頁 V2（2026-05-03）
- [x] 研究創勝服務介紹文章內容
- [x] 分析 YouTube/Facebook 影片了解雲梯車作業流程
- [x] AI 生成 3D 渲染雲梯車素材（參考實拍+平面圖，非直接套用照片）
- [x] 重新設計互動首頁：3D 渲染雲梯車為主角
- [x] 融入品牌特色：打包專業、搬運穩健、歸位細心
- [x] 「雲梯車搬運幸福送到家」概念呈現
- [x] 不使用文字堆砌，用完整互動動畫呈現
- [x] 色調參考原網頁設計（橘金暖色系）
- [x] 滾輪互動控制動畫流程
- [x] 響應式設計（手機/平板/電腦）

## AI 估價系統全面升級（2026-05-03，依據優化規格書）
- [x] 前端新增欄位：搬出樓層 + 有無電梯
- [x] 前端新增欄位：搬入樓層 + 有無電梯
- [x] 前端新增欄位：不搬物品清單（文字輸入）
- [x] 前端新增欄位：預估紙箱/雜物量（極少/一般/多/極多）
- [x] 後端更新 LLM System Prompt（新的估價師角色 + 校正係數邏輯）
- [x] 後端傳遞新欄位給 LLM（樓層、電梯、不搬物品、紙箱量）
- [x] 後端加入非線性校正係數（≤2.5車×1.41 / 2.5-4.5車×1.04 / 4.5-7車×1.20 / >7車×0.81）
- [x] 後端 IP 速率限制（每 150 秒一次估價請求）
- [x] 超過 6 車自動標記「需人工複核」+ 後台通知
- [x] 測試完整估價流程（93 個 vitest 測試全部通過）

## 沉浸式互動頁面 V4（參考 jeskojets.com，2026-05-03）
- [x] 研究 jeskojets.com 互動設計模式（全螢幕場景、滾動驅動、視差效果）
- [x] 生成額外 3D 渲染素材（正面特寫、到達場景、升降臂特寫）
- [x] 重寫為沉浸式互動頁面（GSAP ScrollTrigger + 全螢幕場景切換）
- [x] 載入動畫（深色背景 + LOGO + 進度條）
- [x] 品牌開場（LOGO reveal + 標語「雲梯車 把愛送到家」）
- [x] 固定導航列 + 右側進度指示器
- [x] 6 個場景滾動驅動動畫（品牌→萬獸號→打包→搬運→歸位→幸福到家）
- [x] 色調符合原網站（象牙白 + 金棕色）
- [x] 手機底部固定 CTA 按鈕
- [x] 93 個 vitest 測試全部通過

## AI 辨識系統重大修復（2026-05-03）
- [x] 移除 10 張照片硬性限制，改為批次處理所有照片
- [x] 實作批次 LLM 呼叫（每批 8 張），合併結果
- [x] 強化 System Prompt 要求逐張照片辨識所有物品
- [x] ITEM_TRUCK_MAP 新增衣物堆/鞋子堆/廚房雜物/書籍箱/盆栽等條目
- [x] 智慧去重：跨批次的重複物品合併（mergeOverlappingRoomItems）
- [x] 前端 MAX_PHOTOS_PER_ROOM 從 6 提高到 10
- [x] 前端新增 needsManualReview 提示顯示
- [x] 撰寫 vitest 測試（110 個測試全部通過）

## 估價範圍縮小（2026-05-03）
- [x] 修改後端價格範圍計算：從 minPrice/maxPrice 大範圍改為中間金額 ±10,000
- [x] 測試驗證新的價格範圍邏輯（119 個測試全部通過）

## 「不搬物品」邏輯修復 + 「只搬這些」功能（2026-05-03）
- [x] 修正後端：將「不搬物品」描述真正傳遞給 LLM 並在車數計算中排除（硬性過濾）
- [x] 新增「只搬這些」正向指定模式（前端 UI 切換 + 後端 LLM 提示 + 程式碼正向過濾）
- [x] 測試驗證排除/只搬邏輯正確運作（146 個 vitest 測試全部通過）

## 「只搬這些」模式補充邏輯（2026-05-03）
- [x] 修正：文字指定的物品即使照片未辨識到，也要自動加入車數計算
- [x] 邏輯：解析 onlyMovingItems 關鍵字，比對辨識結果，未匹配的物品查 ITEM_TRUCK_MAP 後補入
- [x] 測試驗證補充邏輯正確運作（156 個 vitest 測試全部通過）

## AI 辨識嚴重低估修復 — 雜物未辨識問題（2026-05-04）
- [x] 修正 LLM 提示詞：「只搬這些」模式下仍須辨識照片中所有物品，過濾在程式碼層處理
- [x] 修正 LLM 提示詞：強化雜物辨識（每個房間至少 2-5 箱雜物、寧可多估不要少估）
- [x] 加入「照片雜物量評估」：LLM 回傳 clutterLevel 欄位（none/low/medium/high/extreme）
- [x] 加入「客戶選擇 vs 照片實際」矛盾校正：取客戶自選和 LLM 判斷的較高值作為補償
- [x] 測試驗證修正後的估價邏輯（175 個 vitest 測試全部通過）

## 估價金額計算邏輯修改（2026-05-04）
- [x] 移除舊的 ±10,000 區間邏輯
- [x] 新邏輯：每車 12,000 元（完整打包搬運歸位），下限 -5000，上限 +15,000
- [x] 確保至少 1 車 = 12,000 元起（179 個 vitest 測試全部通過）

## 客戶塗鴉標記功能（2026-05-04）
- [x] 修改 LLM 提示詞：要求辨識照片中的塗鴉標記（✓ 打劾、○ 圓圈、✗ 打叉）
- [x] 在 JSON schema 中新增 markingType 欄位（checkmark/circle/cross/none）
- [x] 實作物品過濾邏輯：✓ 和 ○ 預設為搬運，✗ 預設為不搬
- [x] 實作查重邏輯：✗ 標記的物品與 notMovingItems 文字清單比對並排除
- [x] 測試驗證塗鴉標記邏輯正確運作（190 個 vitest 測試全部通過）

## 冰箱車數修正（2026-05-04）
- [x] 修正冰箱車數：小冰箱 0.3車、雙門/中型 0.4車、三門 0.45車、大/對開/法式/四門 0.5車
- [x] 測試確認修正無誤（190 個 vitest 測試全部通過）

## 後台登入流程修正（2026-05-05）
- [x] 在 AdminDashboard 未登入提示中新增「登入」按鈕
- [x] 點擊按鈕後跳轉到 Manus OAuth 登入頁面
- [x] 測試確認登入流程正常（190 個 vitest 測試全部通過）
- [x] 修正 admin 角色被登入流程覆蓋的問題（只有 owner 會被強制設為 admin，其他帳號不再覆蓋）
- [x] 升級 loandrew6666@gmail.com 和 weihomeben@gmail.com 為 admin

## ERP 系統 API 串接（2026-05-05）
- [x] 分析現有 ticket 資料結構與 ERP API 欄位對應
- [x] 建立 ERP API 串接模組（server/erp-integration.ts）
- [x] 在估價流程完成時自動拋轉資料到 ERP（非阻塞，失敗不影響主流程）
- [x] 處理欄位對應：customerName, customerPhone, pickupAddress, dropoffAddress, floor, elevator, serviceDate, note
- [x] 備註無法對應的欄位（照片 URL、AI 估價結果、物件清單、LINE/Email、房型格局、雜物密度）→ 全部放入 note 欄位
- [x] 錯誤處理：API 失敗時不影響主流程，記錄 console.error 供後續排查
- [x] 測試驗證 API 串接正確（202 個 vitest 測試全部通過）

## 聊天室暫存問題修正（2026-05-05）
- [x] 修正：進入 AI 估價頁面時自動清除舊的 localStorage 暫存資料（estimate_data, chat_messages, ticket_id, chat_is_open）
- [x] 確保每次新建案件時不會顯示舊案件的資訊（202 個 vitest 測試全部通過）
