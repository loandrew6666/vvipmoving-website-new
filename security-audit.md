# 安全審計報告 - VVIP Moving Website

## 攻擊 1：tRPC 路由列舉

**嚴重程度：高**

駭客可以通過猜測路由名稱確認哪些 API 端點存在：

| 路由 | 回應 | 問題 |
|------|------|------|
| auth.me | 200 DATA | ⚠️ 可確認路由存在 |
| auth.logout | 405 | ⚠️ 可確認路由存在（只是方法不對） |
| ticket.create | 405 | ⚠️ 可確認路由存在 |
| ticket.list | 401 | ⚠️ 可確認路由存在（需要登入） |
| ticket.queryByNo | 400 | ⚠️ 可確認路由存在（缺少參數） |
| ticket.queryByPhone | 401 | ⚠️ 可確認路由存在 |
| ticket.queryByCustomerIp | 401 | ⚠️ 可確認路由存在 |
| ticket.sendChatMessage | 405 | ⚠️ 可確認路由存在 |
| ticket.getChatHistory | 400 | ⚠️ 可確認路由存在 |
| admin.listTickets | 401 | ⚠️ 可確認路由存在 |
| admin.getChatHistory | 401 | ⚠️ 可確認路由存在 |
| admin.sendChatMessage | 405 | ⚠️ 可確認路由存在 |
| admin.uploadChatImage | 405 | ⚠️ 可確認路由存在 |
| admin.markChatMessageAsRead | 405 | ⚠️ 可確認路由存在 |
| faq.list | 200 DATA | ✅ 公開端點（正常） |
| cases.list | 200 DATA | ✅ 公開端點（正常） |
| news.list | 200 DATA | ✅ 公開端點（正常） |
| ticket.uploadPhoto | 404 | ✅ 不存在 |
| ticket.uploadFile | 404 | ✅ 不存在 |
| user.list | 404 | ✅ 不存在 |

**漏洞 1a：路由可被列舉** - 不同的 HTTP 狀態碼（200/400/401/404/405）讓駭客可以區分「路由存在」和「路由不存在」

**漏洞 1b：錯誤堆疊洩漏** - batch 查詢的錯誤回應包含完整的 stack trace（包含檔案路徑和 node_modules 結構）

