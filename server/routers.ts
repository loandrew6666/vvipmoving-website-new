import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createTicket,
  getTicketByNo,
  getTicketByPhone,
  getAllFaqs,
  getAllCases,
  getCaseById,
  getAllNews,
  getNewsBySlug,
  createContact,
  getAllTickets,
  getTicketById,
  getTicketsByStatus,
  updateTicketStatus,
  addChatMessage,
  getChatHistory,
  getTicketByCustomerIp,
  updateTicketCustomerIp,
  markChatMessageAsRead,
  markAllChatMessagesAsRead,
  getUnreadChatCount,
  searchTickets,
  addTicketPhotos,
  addTicketFile,
  setTicketRoomLayout,
  setTicketAiResult,
  getTicketAiResult,
  getTicketPhotos,
  getTicketFiles,
  getTicketRoomLayout,
  createTicketSensitive,
  getTicketSensitive,
  updateTicketSensitive,
  recordAuditLog,
  getAuditLogs,
} from "./db";
import { logSensitiveDataAccess, logDeniedAccess, logAudit } from "./_core/audit";
import { getClientIp as getClientIpForAudit } from "./_core/rateLimit";
import { getClientIp as getClientIpUtil } from "./_core/rateLimit";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { matchItemToTruckMap } from "./item-matching";
import { deduplicateImages, mergeOverlappingRoomItems } from "./image-deduplication";
import { searchFaq, getRelatedFaqs } from "./qa-search";
import { nanoid } from "nanoid";
import { getClientIp, isRateLimited, getRateLimitResetTime, checkEndpointLimit } from "./_core/rateLimit";
import { createTicketSchema, sendChatMessageSchema, uploadChatImageSchema, contactFormSchema, validateInput } from "./_core/validation";
import unzipper from "unzipper";
import { sendToErp } from "./erp-integration";

// ─── Ticket Router ────────────────────────────────────────────────────────────

const ticketRouter = router({
  create: publicProcedure
    .input(createTicketSchema)
    .mutation(async ({ input }) => {
      const ticket = await createTicket({
        region: input.region,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerLine: input.customerLine,
        customerEmail: input.customerEmail,
        moveDate: input.moveDate ? new Date(input.moveDate) : undefined,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        fromCity: input.fromCity,
        fromDistrict: input.fromDistrict,
        toCity: input.toCity,
        toDistrict: input.toDistrict,
        fromHasElevator: input.fromHasElevator,
        fromFloor: input.fromFloor,
        toHasElevator: input.toHasElevator,
        toFloor: input.toFloor,
        roomLayout: input.roomLayout,
        aiResult: input.aiResult,
        photoUrls: input.photoUrls,
        uploadedFiles: input.uploadedFiles,
        notes: input.notes,
        source: input.source ?? "contact_form",
      });

      // 將敏感資料存儲到隔離表
      if (ticket?.id) {
        try {
          await createTicketSensitive(
            ticket.id,
            input.customerPhone,
            input.customerEmail,
            input.fromAddress
          );
        } catch (err) {
          console.error("[Security] Failed to store sensitive data:", err);
        }
      }

      // 通知 Owner（豐富格式）
      const regionLabel = input.region === "taipei" ? "台北" : "高雄";
      const sourceLabel: Record<string, string> = { ai_estimate: "AI 智能估價", contact_form: "聯絡表單", phone: "電話", line: "LINE" };
      
      // 房型格局文字
      const roomNames: Record<string, string> = { living: "客廳", bedroom: "臥室", kitchen: "廚房", study: "書房", balcony: "陽台", other: "其他" };
      const roomLayoutText = input.roomLayout
        ? Object.entries(input.roomLayout).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${roomNames[k] ?? k} x${v}`).join("、")
        : "未填寫";
      
      // AI 分析摘要
      const aiSummary = input.aiResult
        ? `大型傢俱：${(input.aiResult as Record<string, unknown>).furnitureCount ?? "?"} 件 | 估計車數：${(input.aiResult as Record<string, unknown>).truckCount ?? "?"} 台 | 估價：NT$ ${((input.aiResult as Record<string, Record<string, number>>).priceRange?.min ?? 0).toLocaleString()} ~ ${((input.aiResult as Record<string, Record<string, number>>).priceRange?.max ?? 0).toLocaleString()}`
        : "未進行 AI 分析";
      
      // 圖片連結
      const photoList = (input.photoUrls ?? []).slice(0, 6).map((url, i) => `[圖片${i + 1}] ${url}`).join("\n");
      const photoSummary = input.photoUrls?.length ? `共 ${input.photoUrls.length} 張照片\n${photoList}${input.photoUrls.length > 6 ? `\n...等 ${input.photoUrls.length} 張` : ""}` : "無照片";
      
      const fullContent = [
        `━━━ 客戶資料 ━━━`,
        `案件編號：${ticket?.ticketNo}`,
        `姓名：${input.customerName}`,
        `電話：${input.customerPhone}`,
        input.customerLine ? `LINE：${input.customerLine}` : null,
        input.customerEmail ? `Email：${input.customerEmail}` : null,
        ``,
        `━━━ 搬家資訊 ━━━`,
        `服務區域：${regionLabel}`,
        `來源：${sourceLabel[input.source ?? "contact_form"] ?? input.source}`,
        input.moveDate ? `搬家日期：${new Date(input.moveDate).toLocaleDateString("zh-TW")}` : null,
        input.fromAddress ? `搬出地址：${input.fromAddress}` : null,
        input.fromHasElevator ? `搬出電梯：${input.fromHasElevator === "yes" ? "有" : `無（${input.fromFloor ?? "?"}樓）`}` : null,
        input.toAddress ? `搬入地址：${input.toAddress}` : null,
        input.toHasElevator ? `搬入電梯：${input.toHasElevator === "yes" ? "有" : `無（${input.toFloor ?? "?"}樓）`}` : null,
        `房型格局：${roomLayoutText}`,
        input.notes ? `備註：${input.notes}` : null,
        ``,
        `━━━ AI 分析結果 ━━━`,
        aiSummary,
        ``,
        `━━━ 上傳照片 ━━━`,
        photoSummary,
      ].filter(Boolean).join("\n");
      
      await notifyOwner({
        title: `新案件 [${regionLabel}] - ${input.customerName}（${ticket?.ticketNo}）`,
        content: fullContent,
      });

      // 拋轉資料到 ERP 客服系統（非阻塞，失敗不影響主流程）
      sendToErp({
        ticketNo: ticket?.ticketNo,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerLine: input.customerLine,
        customerEmail: input.customerEmail,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        fromFloor: input.fromFloor,
        toFloor: input.toFloor,
        fromHasElevator: input.fromHasElevator,
        toHasElevator: input.toHasElevator,
        moveDate: input.moveDate ? new Date(input.moveDate) : undefined,
        notes: input.notes,
        roomLayout: input.roomLayout as Record<string, number> | undefined,
        aiResult: input.aiResult as any,
        photoUrls: input.photoUrls,
      }).catch((err: unknown) => console.error("[ERP] Background send failed:", err));

      return { ticketNo: ticket?.ticketNo, id: ticket?.id };
    }),

  queryByNo: publicProcedure
    .input(z.object({ ticketNo: z.string().regex(/^VV-TP-\d{4}-\d{5}$/, "案件編號格式無效") }))
    .query(async ({ input, ctx }) => {
      // IP 訪問限制：使用 query 專用限制（10s 內 5 次）
      const clientIp = getClientIp(ctx.req);
      const limit = checkEndpointLimit(clientIp, "query");
      if (limit.limited) {
        throw new Error(`查詢過於頻繁，請在 ${limit.resetSeconds} 秒後重試`);
      }
      
      // 安全修復：只返回基本資訊，不返回敏感資料
      const ticket = await getTicketByNo(input.ticketNo);
      if (!ticket) return null;
      // 只返回公開資訊：案件編號、狀態、估價範圍
      const aiData = ticket.aiResult as any;
      return {
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        status: ticket.status,
        aiResult: aiData ? {
          priceRange: aiData.priceRange || "",
          truckCount: aiData.truckCount || 0,
          estimateNote: aiData.estimateNote || "",
        } : null,
        createdAt: ticket.createdAt,
      };
    }),

  queryByPhone: protectedProcedure
    .input(z.object({ phone: z.string().regex(/^[0-9\-\+\(\)\s]{8,20}$/, "電話號碼格式無效") }))
    .query(async ({ input }) => {
      return getTicketByPhone(input.phone);
    }),

  queryByCustomerIp: protectedProcedure
    .input(z.object({ customerIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "IP 位址格式無效") }))
    .query(async ({ input }) => {
      return getTicketByCustomerIp(input.customerIp);
    }),

  updateCustomerIp: protectedProcedure
    .input(z.object({ ticketId: z.number().positive(), customerIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "IP 位址格式無效") }))
    .mutation(async ({ input }) => {
      await updateTicketCustomerIp(input.ticketId, input.customerIp);
      return { success: true };
    }),

  list: protectedProcedure.query(async () => {
    return getAllTickets();
  }),

  // 客戶查詢聘天記錄（公開）
  getChatHistory: publicProcedure
    .input(z.object({ ticketId: z.number().positive("案件 ID 必須為正整數") }))
    .query(async ({ input, ctx }) => {
      // IP 訪問限制：使用 query 專用限制（10s 內 5 次）
      const clientIp = getClientIp(ctx.req);
      const limit = checkEndpointLimit(clientIp, "query");
      if (limit.limited) {
        throw new Error(`查詢過於頻繁，請在 ${limit.resetSeconds} 秒後重試`);
      }
      return getChatHistory(input.ticketId);
    }),

  // 客戶發送脩天訊息（公開）
  sendChatMessage: publicProcedure
    .input(sendChatMessageSchema)
    .mutation(async ({ input, ctx }) => {
      // IP 訪問限制：使用 chatSend 專用限制（5s 內 3 次）
      const clientIp = getClientIp(ctx.req);
      const limit = checkEndpointLimit(clientIp, "chatSend");
      if (limit.limited) {
        throw new Error(`操作過於頻繁，請在 ${limit.resetSeconds} 秒後重試`);
      }
      await addChatMessage(input.ticketId, {
        role: "customer",
        message: input.message,
        timestamp: Date.now(),
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),

  // 客戶上傳圖片（公開）
  uploadChatImage: publicProcedure
    .input(uploadChatImageSchema)
    .mutation(async ({ input, ctx }) => {
      // IP 訪問限制：使用 upload 專用限制（30s 內 5 次）
      const clientIp = getClientIp(ctx.req);
      const limit = checkEndpointLimit(clientIp, "upload");
      if (limit.limited) {
        throw new Error(`上傳過於頻繁，請在 ${limit.resetSeconds} 秒後重試`);
      }
      const buffer = Buffer.from(input.fileBase64, "base64");
      const ext = input.fileName.split(".").pop() || "jpg";
      const key = `chat-images/${input.ticketId}/${Date.now()}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // 客戶標記訊息為已讀（公開）
  markChatMessageAsRead: protectedProcedure
    .input(z.object({
      ticketId: z.number().positive(),
      messageIndex: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      await markChatMessageAsRead(input.ticketId, input.messageIndex);
      return { success: true };
    }),

  // 客戶標記所有訊息為已讀（公開）
  markAllChatMessagesAsRead: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input }) => {
      await markAllChatMessagesAsRead(input.ticketId);
      return { success: true };
    }),
});

// ─── AI Estimate Router ───────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// 物件車數對照表（基準：1車 = 8板 = 40白箱 = 200材）
// 1材 = 30cm×30cm×30cm = 0.027m³
// 車數 = 物件實際搬運材積 ÷ 200（含包裝保護係數 1.2~1.5）
//
// 車型對照：
//   3.49噸 = 1車 = 200材
//   5噸   = 2.5車 = 500材
//   6.5噸 = 4.5車 = 900材
//   8噸   = 7車 = 1400材
//   11噸  = 9車 = 1800材
//   17噸  = 12車 = 2400材
// ═══════════════════════════════════════════════════════════════════════════════
// 基本單位：1白箱=55×40×31.6cm=69,520cm³=5材 | 1材=13,904cm³ | 1車=40白箱=200材
// 計算公式：物件體積(cm³) / 13,904 = 材數 / 200 = 車數
const ITEM_TRUCK_MAP: Record<string, number> = {
  // ══════════════════════════════════════════════════════════════
  // 基準：1車=8板車=40白箱=200材≈3.49噸
  // 數值來源：搬家師傅實務經驗（含限高、堆疊、保護間距緩衝）
  // ══════════════════════════════════════════════════════════════

  // ── 箱類/散件 ──
  "紙箱": 0.025,
  "標準紙箱": 0.025,
  "搬家紙箱": 0.025,
  "白箱": 0.025,
  "白箱子": 0.025,
  "行李箱": 0.02,
  "行李箱（20吋）": 0.01,
  "行李箱（24吋）": 0.015,
  "行李箱（28吋）": 0.02,
  "塑膠收納箱": 0.03,
  "收納箱": 0.03,
  "收納箱（50-70L）": 0.03,
  "塑膠整理箱": 0.013,
  "整理箱": 0.013,
  "衣物袋": 0.01,
  "棉被袋": 0.02,
  "衣物堆": 0.025,
  "衣物堆（一箱）": 0.025,
  "衣物箱": 0.025,
  "鞋子堆": 0.025,
  "鞋箱": 0.015,
  "廚房雜物": 0.025,
  "廚房雜物（一箱）": 0.025,
  "雜物箱": 0.025,
  "書籍箱": 0.03,
  "書籍": 0.03,
  "盆栽": 0.10,
  "小盆栽": 0.03,

  // ── 大型家電 ──
  "小冰箱": 0.30,
  "單門冰箱": 0.30,
  "小冰箱（單門）": 0.30,
  "雙門冰箱": 0.40,
  "中型冰箱": 0.40,
  "三門冰箱": 0.45,
  "大冰箱": 0.50,
  "對開冰箱": 0.50,
  "法式冰箱": 0.50,
  "對開門冰箱": 0.50,
  "四門冰箱": 0.50,
  "臥式冷凍櫃": 0.22,
  "上掀式冷凍櫃": 0.22,
  "直立冷凍櫃": 0.20,
  "紅酒櫃": 0.20,
  "酒櫃": 0.20,

  // 洗衣/烘乾系列
  "洗衣機": 0.10,
  "直立式洗衣機": 0.10,
  "滾筒洗衣機": 0.10,
  "乾衣機": 0.10,
  "烘衣機": 0.10,
  "洗脫烘": 0.20,
  "洗乾一體": 0.20,
  "洗脫烘一體": 0.20,
  "疊式洗烘": 0.20,
  "洗烘塔": 0.20,
  "洗碗機": 0.10,
  "嵌入式洗碗機": 0.10,

  // 廚房家電
  "烤箱": 0.10,
  "嵌入式烤箱": 0.10,
  "烤箱（60cm）": 0.10,
  "排油煙機": 0.10,
  "抽油煙機": 0.10,
  "烘碗機": 0.10,
  "微波爐": 0.10,
  "微波爐/水波爐": 0.10,
  "氣炸鍋": 0.01,
  "電鍋": 0.01,
  "大同電鍋": 0.01,
  "飲水機": 0.10,
  "開飲機": 0.10,
  "熱水瓶": 0.01,
  "熱水壺": 0.01,
  "快煮壺": 0.01,
  "咖啡機": 0.02,
  "義式咖啡機": 0.03,
  "果汁機": 0.01,
  "調理機": 0.01,

  // 空調/環境家電
  "冷氣室內機": 0.05,
  "冷氣": 0.05,
  "分離式冷氣": 0.05,
  "冷氣室外機": 0.30,
  "空調室外機": 0.30,
  "窗型冷氣": 0.10,
  "移動式冷氣": 0.10,
  "除濕機": 0.02,
  "空氣清淨機": 0.02,
  "清淨機": 0.02,
  "暖氣機": 0.02,
  "電暖器": 0.02,
  "電風扇": 0.02,
  "電暖扇": 0.02,
  "循環扇": 0.02,

  // 清潔家電
  "吸塵器": 0.05,
  "直立式吸塵器": 0.05,
  "掃地機器人": 0.02,
  "拖地機器人": 0.02,
  "自動餵食器": 0.02,

  // ── 影音/3C ──
  "電視": 0.15,
  "液晶電視": 0.15,
  "電視（32吋以下）": 0.10,
  "小電視": 0.10,
  "電視（43-55吋）": 0.15,
  "中型電視": 0.15,
  "電視（65吋以上）": 0.20,
  "大電視": 0.20,
  "75吋電視": 0.25,
  "85吋電視": 0.30,
  "電視櫃": 0.10,
  "電視櫃（120-200cm）": 0.10,
  "桌上電腦": 0.05,
  "電腦主機": 0.05,
  "桌上電腦主機": 0.05,
  "螢幕": 0.03,
  "電腦螢幕": 0.03,
  "螢幕（27-34吋）": 0.03,
  "落地喇叭": 0.10,
  "音響": 0.03,
  "音響系統": 0.05,
  "投影機": 0.02,
  "投影布幕": 0.02,
  "印表機": 0.02,
  "事務機": 0.05,

  // ── 家具_臥室 ──
  "單人床墊": 0.20,
  "床墊（3.5尺）": 0.20,
  "雙人床墊": 0.30,
  "床墊（5尺）": 0.30,
  "床墊": 0.30,
  "加大床墊": 0.30,
  "床墊（6尺）": 0.30,
  "King床墊": 0.35,
  "床墊（7尺）": 0.35,
  "單人床架": 0.20,
  "床架（3.5尺）": 0.20,
  "雙人床架": 0.30,
  "床架": 0.30,
  "床架（5尺）": 0.30,
  "加大床架": 0.35,
  "床架（6尺）": 0.35,
  "King床架": 0.40,
  "上下舖": 0.80,
  "雙層床": 0.80,
  "掀床": 0.40,
  "收納床架": 0.40,
  "衣櫃（2門）": 0.25,
  "小衣櫃": 0.25,
  "衣櫃": 0.35,
  "衣櫃（3門）": 0.35,
  "衣櫃（4門）": 0.40,
  "大衣櫃": 0.40,
  "系統衣櫃": 0.60,
  "走入式衣櫃": 1.00,
  "五斗櫃": 0.02,
  "斗櫃": 0.02,
  "三斗櫃": 0.02,
  "床頭櫃": 0.05,
  "床邊桌": 0.05,
  "化妝台": 0.10,
  "化妝桌": 0.10,
  "梳妝台": 0.10,
  "穿衣鏡": 0.05,
  "全身鏡": 0.05,
  "立鏡": 0.05,

  // ── 家具_客廳 ──
  "單人沙發": 0.15,
  "單人椅": 0.10,
  "雙人沙發": 0.20,
  "三人沙發": 0.30,
  "三人座沙發": 0.30,
  "L型沙發": 0.80,
  "L型沙發組": 0.80,
  "U型沙發": 1.50,
  "沙發床": 0.30,
  "躺椅": 0.15,
  "貴妃椅": 0.15,
  "單人躺椅": 0.15,
  "茶几": 0.10,
  "茶几（小）": 0.05,
  "茶几（大）": 0.15,
  "大理石茶几": 0.15,
  "玻璃展示櫃": 0.30,
  "展示櫃": 0.30,
  "書櫃": 0.20,
  "書櫃（3層）": 0.15,
  "書櫃（5層）": 0.20,
  "大書櫃": 0.30,
  "酒櫃（家具）": 0.20,
  "貓跳台": 0.15,
  "貓爬架": 0.15,

  // ── 家具_餐廳/書房 ──
  "餐桌（2人）": 0.10,
  "小餐桌": 0.10,
  "餐桌": 0.15,
  "餐桌（4人）": 0.15,
  "餐桌（6人）": 0.15,
  "大餐桌": 0.20,
  "餐桌（6-8人）": 0.20,
  "餐椅": 0.05,
  "餐椅（單張）": 0.05,
  "餐櫃": 0.20,
  "碗盤櫃": 0.20,
  "書桌": 0.10,
  "書桌（120cm）": 0.10,
  "書桌（140cm）": 0.10,
  "L型書桌": 0.20,
  "電競桌": 0.10,
  "辦公椅": 0.05,
  "電腦椅": 0.05,
  "人體工學椅": 0.05,
  "置物架": 0.10,
  "鐵架": 0.10,
  "層架": 0.10,
  "置物架（大）": 0.15,
  "鐵層架（大）": 0.15,

  // ── 家具_玄關/其他 ──
  "鞋櫃": 0.10,
  "鞋櫃（小）": 0.05,
  "鞋櫃（大）": 0.15,
  "玄關櫃": 0.10,
  "衣帽架": 0.05,
  "掛衣架": 0.05,
  "曬衣架": 0.10,
  "晾衣架": 0.10,

  // ── 辦公設備 ──
  "辦公桌": 0.10,
  "主管桌": 0.20,
  "屏風隔板": 0.10,
  "抽屜櫃": 0.10,
  "三抽櫃": 0.08,
  "活動櫃": 0.05,
  "四層抽屜櫃（金屬）": 0.15,
  "鐵櫃": 0.15,
  "檔案櫃": 0.15,
  "公文櫃": 0.15,
  "伺服器機櫃": 0.40,
  "伺服器機櫃（42U）": 0.40,
  "影印機": 0.25,
  "大型影印機": 0.25,
  "複合機": 0.25,
  "保險箱（小）": 0.10,
  "保險箱": 0.15,
  "保險箱（大）": 0.25,

  // ── 特殊/運動器材 ──
  "跑步機": 0.40,
  "跑步機（摺疊）": 0.40,
  "跑步機（商用）": 0.50,
  "橢圓機": 0.50,
  "交叉訓練機": 0.50,
  "飛輪車": 0.50,
  "健身車": 0.50,
  "重訓架": 0.60,
  "史密斯機": 1.00,
  "瑜珈墊": 0.005,

  // ── 特殊物件 ──
  "魚缸（60cm）": 0.10,
  "小魚缸": 0.05,
  "魚缸（90cm）": 0.20,
  "魚缸": 0.20,
  "魚缸（120cm）": 0.20,
  "大魚缸": 0.20,
  "直立式鋼琴": 0.50,
  "鋼琴": 0.50,
  "三角鋼琴": 0.75,
  "平台鋼琴": 0.75,
  "電子琴": 0.03,
  "電鋼琴": 0.05,
  "地毯（小）": 0.01,
  "地毯": 0.02,
  "地毯（大）": 0.03,
  "觀葉植物": 0.10,
  "大型盆栽": 0.25,
  "大型觀葉植物": 0.25,
  "腳踏車": 0.15,
  "自行車": 0.15,
  "嬰兒推車": 0.05,
  "嬰兒床": 0.15,
  "輪椅": 0.10,

  // ── 娛樂家具 ──
  "電動麻將桌": 0.30,
  "電動麻將桌（含椅）": 0.30,
  "摺疊麻將桌": 0.20,
  "撞球桌": 1.00,
  "乒乓球桌": 0.80,
};

// 依房型估算基礎車數（無照片時備用）
// 基於台灣一般家庭每空間的平均物件量估算
const ROOM_BASE_TRUCKS: Record<string, number> = {
  living: 0.6,   // 客廳：沙發+茶几+電視櫃+電視 ≈ 0.6車
  bedroom: 0.5,  // 臥室：床墊+床架+衣櫃+床頭櫃 ≈ 0.5車
  kitchen: 0.3,  // 廚房：冰箱+微波爐+小家電 ≈ 0.3車
  study: 0.3,    // 書房：書桌+書櫃+電腦 ≈ 0.3車
  balcony: 0.1,  // 陽台：洗衣機+雜物 ≈ 0.1車
  other: 0.2,    // 其他：雜物 ≈ 0.2車
};

// 台北/高雄計價基礎（每車均價）
// 每車單價（完整打包、搬運、歸位）
const PRICE_PER_TRUCK = 12000;
// 價格範圍：基準價 - 5000 ~ 基準價 + 15000
const PRICE_RANGE_LOW_OFFSET = 5000;
const PRICE_RANGE_HIGH_OFFSET = 15000;

const aiEstimateRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        region: z.enum(["taipei", "kaohsiung"]),
        roomLayout: z.record(z.string(), z.number()),
        // 分區照片：key = 房間名稱，value = 照片 URL 陣列
        roomPhotos: z.record(z.string(), z.array(z.string())).optional(),
        // 舊版相容：單一照片陣列
        photoUrls: z.array(z.string()).optional(),
        riskItems: z.array(z.string()).optional(),
        notes: z.string().optional(),
        // 新增欄位：樓層與電梯狀態
        fromHasElevator: z.enum(["yes", "no"]).optional(),
        fromFloor: z.number().optional(),
        toHasElevator: z.enum(["yes", "no"]).optional(),
        toFloor: z.number().optional(),
        // 物品過濾模式：exclude=排除不搬的 / only=只搬這些
        itemFilterMode: z.enum(["exclude", "only"]).optional(),
        // 不搬物品清單（排除模式）
        notMovingItems: z.string().optional(),
        // 只搬物品清單（指定模式）
        onlyMovingItems: z.string().optional(),
        // 預估紙箱/雜物量
        boxEstimation: z.enum(["few", "normal", "many", "extreme"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // IP 速率限制：150 秒內只允許 1 次 AI 估價
      const clientIp = getClientIp(ctx.req);
      const limit = checkEndpointLimit(clientIp, "aiEstimate");
      if (limit.limited) {
        throw new Error(`請稍候 ${limit.resetSeconds} 秒後再試，避免過於頻繁的請求。`);
      }

      const roomNames: Record<string, string> = {
        living: "客廳", bedroom: "臥室", kitchen: "廚房",
        study: "書房", balcony: "陽台", other: "其他空間",
      };
      const roomLayoutText = Object.entries(input.roomLayout)
        .filter(([, count]) => (count as number) > 0)
        .map(([room, count]) => `${roomNames[room] ?? room} x${count}`)
        .join("、");

      // 合併所有圖片 URL（分區 + 舊版）
      const allImageUrls: string[] = [];
      if (input.roomPhotos) {
        for (const urls of Object.values(input.roomPhotos)) {
          allImageUrls.push(...urls.filter(Boolean));
        }
      }
      if (input.photoUrls) allImageUrls.push(...input.photoUrls.filter(Boolean));
      
      // 照片去重：移除相同的照片（使用哈希比較）
      const dedupImageUrls = await deduplicateImages(allImageUrls);
      const uniqueImageUrls = dedupImageUrls; // 不再限制數量，改用批次處理
      
      if (allImageUrls.length > dedupImageUrls.length) {
        console.log(
          `[AI Estimate] 照片去重: ${allImageUrls.length} 張 → ${dedupImageUrls.length} 張 (移除 ${allImageUrls.length - dedupImageUrls.length} 張重複)`
        );
      }
      console.log(`[AI Estimate] 總共 ${uniqueImageUrls.length} 張照片待處理`);

      // 新版 System Prompt（基於優化規格書）
      const boxEstLabel = { few: "極少(0-15箱)", normal: "一般(15-30箱)", many: "多(30-50箱)", extreme: "極多(50+箱)" };
      const elevatorInfo = [
        input.fromHasElevator ? `搬出: ${input.fromHasElevator === "yes" ? "有電梯" : `無電梯，${input.fromFloor || "?"}F`}` : null,
        input.toHasElevator ? `搬入: ${input.toHasElevator === "yes" ? "有電梯" : `無電梯，${input.toFloor || "?"}F`}` : null,
      ].filter(Boolean).join("；");

      const systemPrompt = `# Role & Goal
你是一位擁有 20 年經驗的「創勝精緻搬家」首席估價師。你的任務是根據客戶上傳的照片，精準辨識出「每一張照片」中的所有可見物品。

# Context & Conversion Rules
- 1 車 = 3.49 噸標準貨車 = 200 材 = 8 板車 = 40 個標準白箱
- 客戶照片通常「只拍到大型傢具」，但你必須同時辨識小型物品（紙箱、收納箱、衣物堆、雜物等）

# 核心要求：逐張照片仔細辨識
你收到的是一批照片（可能 1-8 張），你必須：
1. **逐張檢查每一張照片**，不要跳過任何一張
2. **列出每張照片中所有可見物品**，包括：
   - 大型傢具（沙發、床、衣櫃、書櫃、電視櫃、餐桌等）
   - 大型家電（冰箱、洗衣機、烘衣機、冷氣、電視等）
   - 中型物品（微波爐、電鍋、飲水機、除濕機、空氣清淨機、電風扇、吸塵器等）
   - 小型物品（紙箱、收納箱、行李箱、衣物堆、鞋子、書籍、廚房雜物等）
   - 特殊物品（魚缸、盆栽、健身器材、樂器、嬰兒用品等）
3. **特別注意**：
   - 角落、門後、陰暗處、桌面上、地板上的物品
   - 紙箱/收納箱的數量（如果看到一堆紙箱，請估算數量）
   - 衣櫃內的衣物（如果看到衣櫃打開裝滿衣物，請記錄「衣物堆」並估算裝箱後約幾箱）
   - 廚房的小家電和雜物（電鍋、調味料、鍋具等）
   - 陰台的物品（洗衣機、曬衣架、雜物等）
4. **必須排除**：客戶在「不搬物品清單」中指出的物品

# 物品標準化名稱
請使用以下標準名稱：
- 冰箱：單門冰箱、雙門冰箱、三門冰箱、對開冰箱、法式冰箱、小冰箱
- 洗衣：洗衣機、滾筒洗衣機、洗烘塔、烘衣機
- 空調：冷氣室內機、冷氣室外機、窗型冷氣
- 床：單人床墊、單人床架、雙人床墊、雙人床架、加大床墊、加大床架、King床墊、King床架
- 沙發：單人沙發、雙人沙發、三人沙發、L型沙發、U型沙發
- 櫃體：五斗櫃、衣櫃(2門)、衣櫃(3門)、衣櫃(4門)、系統衣櫃、電視櫃、書櫃、鞋櫃、餐櫃、展示櫃
- 桌椅：書桌、餐桌(4人)、餐桌(6人)、餐椅、辦公椅、化妝台、茶几
- 電視：電視(32吋以下)、電視(43-55吋)、電視(65吋以上)
- 小家電：微波爐、電鍋、飲水機、除濕機、空氣清淨機、電風扇、吸塵器、烘碗機、排油煙機
- 箱類：紙箱、收納箱、行李箱、棉被袋、衣物袋
- 特殊：魚缸、盆栽、健身器材、樂器、嬰兒床、嬰兒推車

# 重要規則
- truckUnit 欄位請填 0，後端會自動計算
- 如果照片不是室內空間（人物自拍、風景、食物、文件等），在 invalidPhotos 中標記
- 同一物品在不同照片中出現時，只計算一次
- 每張照片都要認真看，不要因為照片多就跳過

# ❗❗❗ 雜物辨識最高優先級規則
這是估價最容易出錯的地方！大多數客戶的照片中都有大量雜物，你必須認真辨識：
- 看到衣櫃內滿滿的衣物 → 記錄「衣物箱」並估算裝箱後約幾箱（每箱約 0.025 車）
- 看到廚房雜物（調味料、鍋具、食材、小家電等） → 記錄「廚房雜物箱」並估算箱數
- 看到鞋子堆 → 記錄「鞋箱」並估算箱數
- 看到書架上的書籍 → 記錄「書籍箱」並估算箱數
- 看到地板上、桌面上、櫃子裡的散落物品 → 記錄「雜物箱」並估算箱數
- 看到玩具、化妆品、清潔用品、文具等散件 → 全部算入「雜物箱」
- 如果一個房間看起來很雜亂、東西很多，請大膽估算雜物箱數量（寧可多估不要少估）
- 每個有物品的房間至少要有 2-5 箱雜物箱（除非空間真的很空）
- 一個普通臥室通常有 3-8 箱雜物（衣物+書籍+化妆品+雜物）
- 一個普通廚房通常有 3-6 箱雜物（鍋碗瓢盆+調味料+小家電）
- 一個普通客廳通常有 2-5 箱雜物（書籍+雜物+裝飾品）

# ❗❗❗ 客戶塗鴉標記辨識
客戶可能在照片上用筆或記記筆標記物品，你必須辨識並記錄：
- ✓ 打勾 → 記錄 markingType: "checkmark"，預設為「需要搬運」的物品
- ○ 圓圈 → 記錄 markingType: "circle"，預設為「需要搬運」的物品
- ✗ 打叉 → 記錄 markingType: "cross"，預設為「不需要搬運」的物品
- 無標記 → 記錄 markingType: "none"，正常辨識
例如：如果照片中看到一張椅子上有打劾，記錄為 { "name": "辨識的椅子類別", "markingType": "checkmark" }

請以 JSON 格式回傳，不要有其他文字`

      // 建構包含圖片的 message content
      type ContentItem = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "auto" } };
      // 建構批次處理的基本 userContent 文字
      const baseUserText = `客戶搬家資訊：
- 服務區域：${input.region === "taipei" ? "台北" : "高雄"}
- 房型格局：${roomLayoutText}
- 特殊物品：${input.riskItems?.join("、") ?? "無"}
- 樓層與電梯：${elevatorInfo || "未提供"}
- 預估紙箱/雜物量：${input.boxEstimation ? boxEstLabel[input.boxEstimation] : "未提供"}
- 物品過濾模式：${input.itemFilterMode === "only" ? "✅ 只搬指定物品" : "❌ 排除不搬物品"}
- ${input.itemFilterMode === "only" ? `只搬這些物品：${input.onlyMovingItems || "未指定"}` : `不搬物品：${input.notMovingItems || "無"}`}
- 備註：${input.notes ?? "無"}`;

      const responseFormatText = `
請仔細分析以下照片，「逐張」辨識每張照片中的所有物品（包含大型傢具、家電、小型物品、紙箱、雜物）。
${input.itemFilterMode === "only" && input.onlyMovingItems ? `❗ 客戶指定只搬以下物品：${input.onlyMovingItems}。但你仍然必須辨識照片中「所有」可見物品（包含雜物、紙箱、散件），後端會自行過濾。` : `特別注意：客戶列出的「不搬物品」必須從清單中排除。`}

❗❗❗ 極度重要：雜物辨識規則
- 看到地板上、桌面上、櫃子裡的散落物品（衣物、書籍、雜物、玩具、食品、化妆品等），必須估算裝箱後約幾箱
- 每個房間只要看到雜物，至少記錄 1 筆「雜物箱」或「紙箱」，並估算數量
- 看到大量雜物堆積（如整個角落堆滿東西），請估算裝箱後約需要多少箱（每箱約 0.025 車）
- 如果照片中明顯有很多雜物但難以逐一列舉，請用「雜物箱」名稱並估算合理數量
- 衣櫃內的衣物、書架上的書籍、廚房的鍋碗瓢盆都要算入雜物箱

回傳 JSON 格式：
{
  "photoValidation": [
    { "index": 0, "isValid": true/false, "reason": "說明" }
  ],
  "invalidPhotos": ["無效照片說明"],
  "detectedItems": [
    { "name": "物件名稱", "count": 數量, "truckUnit": 0, "room": "所在房間" }
  ],
  "roomSummaries": [
    { "room": "房間名稱", "items": "主要物品摘要", "note": "注意事項" }
  ],
  "riskItems": ["特殊物品風險提示"],
  "clutterLevel": "雜物密度等級"
}

❗ clutterLevel 欄位說明：
- "none": 幾乎沒有雜物，空間整潔
- "low": 少量雜物，可能裝 5-10 箱
- "medium": 中等雜物，可能裝 10-25 箱
- "high": 大量雜物，可能裝 25-50 箱
- "extreme": 極大量雜物，可能裝 50+ 箱
請根據所有照片綜合判斷整體雜物密度。`;

      // === 批次處理所有照片（每批最多 8 張） ===
      const BATCH_SIZE = 8;
      const jsonSchema = {
        type: "json_schema" as const,
        json_schema: {
          name: "moving_vision_estimate",
          strict: true,
          schema: {
            type: "object",
            properties: {
              photoValidation: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer" },
                    isValid: { type: "boolean" },
                    reason: { type: "string" },
                  },
                  required: ["index", "isValid", "reason"],
                  additionalProperties: false,
                },
              },
              invalidPhotos: { type: "array", items: { type: "string" } },
              detectedItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    count: { type: "integer" },
                    truckUnit: { type: "number" },
                    room: { type: "string" },
                    markingType: { type: "string", enum: ["checkmark", "circle", "cross", "none"] },
                  },
                  required: ["name", "count", "truckUnit", "room", "markingType"],
                  additionalProperties: false,
                },
              },
              roomSummaries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    room: { type: "string" },
                    items: { type: "string" },
                    note: { type: "string" },
                  },
                  required: ["room", "items", "note"],
                  additionalProperties: false,
                },
              },
              riskItems: { type: "array", items: { type: "string" } },
              clutterLevel: { type: "string", enum: ["none", "low", "medium", "high", "extreme"] },
            },
            required: ["photoValidation", "invalidPhotos", "detectedItems", "roomSummaries", "riskItems", "clutterLevel"],
            additionalProperties: false,
          },
        },
      };

      try {
        console.log("[AI Estimate] 開始分析，圖片數量:", uniqueImageUrls.length);
        let maxClutterLevel = "low"; // LLM 判斷的雜物密度（預設 low）
        let detectedItems: Array<{ name: string; count: number; truckUnit: number; room: string; markingType: string }> = [];
        let invalidPhotos: string[] = [];
        let roomSummaries: Array<{ room: string; items: string; note: string }> = [];
        let riskItems: string[] = input.riskItems ?? [];
        let estimateNote = "";

        if (uniqueImageUrls.length > 0) {
          // === 批次處理所有照片 ===
          const totalBatches = Math.ceil(uniqueImageUrls.length / BATCH_SIZE);
          console.log(`[AI Estimate] 分 ${totalBatches} 批處理 ${uniqueImageUrls.length} 張照片（每批 ${BATCH_SIZE} 張）`);

          const allBatchResults: Array<{
            detectedItems: Array<{ name: string; count: number; truckUnit: number; room: string; markingType: string }>;
            invalidPhotos: string[];
            roomSummaries: Array<{ room: string; items: string; note: string }>;
            riskItems: string[];
            clutterLevel: string;
          }> = [];

          for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
            const batchStart = batchIdx * BATCH_SIZE;
            const batchUrls = uniqueImageUrls.slice(batchStart, batchStart + BATCH_SIZE);
            const batchNum = batchIdx + 1;
            console.log(`[AI Estimate] 批次 ${batchNum}/${totalBatches}：處理第 ${batchStart + 1}-${batchStart + batchUrls.length} 張照片`);

            // 建構每批的 userContent
            const batchUserContent: ContentItem[] = [
              {
                type: "text",
                text: `${baseUserText}\n\n這是第 ${batchNum}/${totalBatches} 批照片（第 ${batchStart + 1}-${batchStart + batchUrls.length} 張，共 ${uniqueImageUrls.length} 張）。${responseFormatText}`,
              },
            ];

            // 加入此批的圖片
            for (const url of batchUrls) {
              batchUserContent.push({
                type: "image_url",
                image_url: { url, detail: "auto" },
              });
            }

            try {
              const response = await invokeLLM({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: batchUserContent },
                ],
                response_format: jsonSchema,
              });

              const rawContent = response.choices[0]?.message?.content;
              const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
              if (!content) {
                console.error(`[AI Estimate] 批次 ${batchNum} 無回應`);
                continue;
              }
              const parsed = JSON.parse(content);
              allBatchResults.push({
                detectedItems: parsed.detectedItems ?? [],
                invalidPhotos: parsed.invalidPhotos ?? [],
                roomSummaries: parsed.roomSummaries ?? [],
                riskItems: parsed.riskItems ?? [],
                clutterLevel: parsed.clutterLevel ?? "low",
              });
              console.log(`[AI Estimate] 批次 ${batchNum} 完成：辨識到 ${(parsed.detectedItems ?? []).length} 項物品，雜物密度: ${parsed.clutterLevel ?? "low"}`);
            } catch (batchError) {
              console.error(`[AI Estimate] 批次 ${batchNum} 失敗:`, batchError instanceof Error ? batchError.message : String(batchError));
              // 單批失敗不影響其他批次，繼續處理
            }
          }

          // === 合併所有批次結果 ===
          console.log(`[AI Estimate] 合併 ${allBatchResults.length} 批結果`);
          const clutterLevels: string[] = [];
          for (const batchResult of allBatchResults) {
            detectedItems.push(...batchResult.detectedItems);
            invalidPhotos.push(...batchResult.invalidPhotos);
            roomSummaries.push(...batchResult.roomSummaries);
            riskItems.push(...batchResult.riskItems);
            clutterLevels.push(batchResult.clutterLevel);
          }
          console.log(`[AI Estimate] 合併後總計: ${detectedItems.length} 項物品，${invalidPhotos.length} 張無效照片`);
          
          // === 雜物密度聚合：取所有批次中最高的雜物等級 ===
          const clutterRank: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, extreme: 4 };
          maxClutterLevel = clutterLevels.reduce((max, level) => {
            return (clutterRank[level] ?? 0) > (clutterRank[max] ?? 0) ? level : max;
          }, "none");
          console.log(`[AI Estimate] LLM 判斷雜物密度: ${maxClutterLevel} (各批: ${clutterLevels.join(", ")})`);
          // estimateNote 由後端依實際計算結果組合
        } else {
          // 無圖片：依房型格局估算
          const roomEntries = Object.entries(input.roomLayout).filter(([, c]) => (c as number) > 0);
          roomSummaries = roomEntries.map(([room, count]) => ({
            room: roomNames[room] ?? room,
            items: `${count as number} 個空間，請上傳照片以獲得更準確估價`,
            note: "建議上傳各空間照片以提升估價準確度",
          }));
          estimateNote = "未上傳照片，以下為依房型格局的初步估算，實際費用差異可能較大，建議上傳各空間照片或預約估價師評估。";
        }

        // 物件去重：同一房間的相同物件只計算一次
        // 此処先使用簡单的房間+物件名稱組合鍵來去重
        const deduplicatedItems = mergeOverlappingRoomItems(
          detectedItems.map((item) => ({
            ...item,
            sourceUrl: "(LLM計算)", // 此処所有物件都來自 LLM
          }))
        );
        
        if (detectedItems.length > deduplicatedItems.length) {
          console.log(
            `[AI Estimate] 物件去重: ${detectedItems.length} 件 → ${deduplicatedItems.length} 件 (移除 ${detectedItems.length - deduplicatedItems.length} 件重複)`
          );
        }
        
        // 更新 detectedItems 為去重後的版本，讓前端顯示正確的物件清單
        detectedItems = deduplicatedItems;

        // === 「不搬物品」硬性過濾 ===
        // LLM 可能忽略排除指令，所以在後端用程式碼做二次過濾
        if (input.notMovingItems && input.notMovingItems.trim()) {
          const notMovingText = input.notMovingItems.trim().toLowerCase();
          // 將不搬物品描述拆分為關鍵字（支援逗號、頓號、分號、換行分隔）
          const notMovingKeywords = notMovingText
            .split(/[,，、;；\n\r]+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          
          if (notMovingKeywords.length > 0) {
            const beforeCount = detectedItems.length;
            detectedItems = detectedItems.filter((item) => {
              const itemName = item.name.toLowerCase();
              // 檢查物品名稱是否匹配任何「不搬」關鍵字
              const shouldExclude = notMovingKeywords.some((keyword: string) => {
                // 雙向匹配：關鍵字包含物品名 或 物品名包含關鍵字
                return itemName.includes(keyword) || keyword.includes(itemName);
              });
              if (shouldExclude) {
                console.log(`[AI Estimate] 排除不搬物品: "${item.name}" (匹配不搬清單)`);
              }
              return !shouldExclude;
            });
            const removedCount = beforeCount - detectedItems.length;
            if (removedCount > 0) {
              console.log(`[AI Estimate] 不搬物品過濾: ${beforeCount} 件 → ${detectedItems.length} 件 (排除 ${removedCount} 件)`);
            }
          }
        }

        // === 客戶塗鴉標記過濾 ===
        // ✗ 打叉標記的物品預設為不需要搬運，與 notMovingItems 文字清單比對並排除查重
        const crossMarkedItems = detectedItems.filter((item) => item.markingType === "cross");
        if (crossMarkedItems.length > 0) {
          const beforeCount = detectedItems.length;
          
          // 建立打叉標記物品的關鍵字集合，用於排除
          const crossMarkedKeywords = new Set(
            crossMarkedItems.map((item) => item.name.toLowerCase())
          );
          
          // 排除打叉標記的物品
          detectedItems = detectedItems.filter((item) => {
            const itemName = item.name.toLowerCase();
            const isCrossMarked = item.markingType === "cross";
            
            if (isCrossMarked) {
              console.log(`[AI Estimate] 排除打叉標記的物品: "${item.name}"`);
              return false;
            }
            
            // 同時排除與打叉標記物品相符的物品（排除查重）
            const matchesCrossMarked = Array.from(crossMarkedKeywords).some((keyword: string) => {
              return itemName.includes(keyword) || keyword.includes(itemName);
            });
            
            if (matchesCrossMarked) {
              console.log(`[AI Estimate] 排除與打叉標記物品相符的: "${item.name}"`);
              return false;
            }
            
            return true;
          });
          
          const removedCount = beforeCount - detectedItems.length;
          if (removedCount > 0) {
            console.log(`[AI Estimate] 塗鴉標記過濾: ${beforeCount} 件 → ${detectedItems.length} 件 (排除 ${removedCount} 件)`);
          }
        }

        // === 「只搬這些」正向過濾 ===
        // 如果客戶選擇「只搬這些」模式，只保留指定的物品
        if (input.itemFilterMode === "only" && input.onlyMovingItems && input.onlyMovingItems.trim()) {
          const onlyMovingText = input.onlyMovingItems.trim().toLowerCase();
          const onlyMovingKeywords = onlyMovingText
            .split(/[,，、;；\n\r]+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          
          if (onlyMovingKeywords.length > 0) {
            const beforeCount = detectedItems.length;
            detectedItems = detectedItems.filter((item) => {
              const itemName = item.name.toLowerCase();
              // 檢查物品名稱是否匹配任何「只搬」關鍵字
              const shouldKeep = onlyMovingKeywords.some((keyword: string) => {
                return itemName.includes(keyword) || keyword.includes(itemName);
              });
              if (!shouldKeep) {
                console.log(`[AI Estimate] 排除非指定物品: "${item.name}" (不在「只搬」清單中)`);
              }
              return shouldKeep;
            });
            const removedCount = beforeCount - detectedItems.length;
            if (removedCount > 0) {
              console.log(`[AI Estimate] 只搬過濾: ${beforeCount} 件 → ${detectedItems.length} 件 (排除 ${removedCount} 件非指定物品)`);
            }
          }
        }

        // === 「只搬這些」補充邏輯：文字指定但照片未辨識到的物品自動加入 ===
        if (input.itemFilterMode === "only" && input.onlyMovingItems && input.onlyMovingItems.trim()) {
          const onlyMovingText = input.onlyMovingItems.trim().toLowerCase();
          const onlyKeywords = onlyMovingText
            .split(/[,\uff0c\u3001;\uff1b\n\r]+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          
          // 檢查哪些指定物品在辨識結果中找不到
          for (const keyword of onlyKeywords) {
            const alreadyDetected = detectedItems.some((item) => {
              const itemName = item.name.toLowerCase();
              return itemName.includes(keyword) || keyword.includes(itemName);
            });
            
            if (!alreadyDetected) {
              // 嘗試在 ITEM_TRUCK_MAP 中查找這個物品
              const matchResult = matchItemToTruckMap(keyword, ITEM_TRUCK_MAP, 0.1);
              const unitTruck = matchResult.unitTruck;
              
              // 將未辨識到的指定物品加入 detectedItems
              detectedItems.push({
                name: matchResult.matchType !== "fallback" ? matchResult.matchedKey : keyword,
                count: 1,
                truckUnit: unitTruck,
                room: "客戶指定",
                markingType: "none",
              });
              console.log(
                `[AI Estimate] 補充未辨識物品: "${keyword}" → "${matchResult.matchedKey}" (${matchResult.matchType}) = ${unitTruck} 車`
              );
            }
          }
        }

        // 計算車數：優先使用辦識到的物件，否則依房型估算
        let truckCount = 0;
        let furnitureCount = 0;
        let totalCai = 0; // 總材積
        if (detectedItems.length > 0) {
          for (const item of detectedItems) {
            // 使用改進的物品匹配邏輯（支援別名、模糊匹配）
            const matchResult = matchItemToTruckMap(item.name, ITEM_TRUCK_MAP, item.truckUnit);
            const unitTruck = matchResult.unitTruck;
            
            // 重要：將後端計算的 truckUnit 回寫到 item 中，讓前端能顯示正確的車數
            item.truckUnit = unitTruck;
            
            const itemCai = Math.round(unitTruck * 200);
            totalCai += itemCai * item.count;
            truckCount += unitTruck * item.count;
            // 大型物件（≥20材 = 0.10車）計入傢具數
            if (unitTruck >= 0.08) furnitureCount += item.count;
            
            // 記錄匹配結果（用於調試）
            console.log(
              `[AI Estimate] 物品匹配: "${item.name}" → "${matchResult.matchedKey}" (${matchResult.matchType}) = ${unitTruck} 車 × ${item.count}`
            );
          }
          truckCount = Math.round(truckCount * 100) / 100; // 精確到小數點後兩位
        } else {
          // 無辨識結果：依房型估算
          for (const [room, count] of Object.entries(input.roomLayout)) {
            const base = ROOM_BASE_TRUCKS[room] ?? 0.2;
            truckCount += base * (count as number);
          }
          truckCount = Math.max(0.5, Math.round(truckCount * 100) / 100);
          totalCai = Math.round(truckCount * 200);
          furnitureCount = Math.ceil(truckCount * 3);
        }

        // === Step 3: 隱性體積與動線補償 (Hidden Volume & Environment Compensation) ===
        const baseTruckCount = truckCount;
        
        // 3a. 紙箱/雜物補償（結合客戶自選 + LLM 照片判斷，取較高值）
        const totalRooms = Object.values(input.roomLayout).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
        
        // 客戶自選的雜物等級對應補償車數
        const customerClutterCompensation: Record<string, number> = {
          few: 0, normal: 0.5, many: 1.25, extreme: 2.25,
        };
        // LLM 照片判斷的雜物等級對應補償車數
        const llmClutterCompensation: Record<string, number> = {
          none: 0, low: 0.25, medium: 0.75, high: 1.5, extreme: 2.5,
        };
        
        // 取客戶自選和 LLM 判斷中的較高值（防止客戶低估雜物量）
        const customerComp = customerClutterCompensation[input.boxEstimation ?? "normal"] ?? 0.5;
        const llmClutterLevelFinal = maxClutterLevel;
        const llmComp = llmClutterCompensation[llmClutterLevelFinal] ?? 0.25;
        
        // 取較高值作為最終補償
        const clutterCompensation = Math.max(customerComp, llmComp);
        
        // 額外校正：如果客戶選「少」但 LLM 判斷為 high/extreme，額外加警告
        if (input.boxEstimation === "few" && (llmClutterLevelFinal === "high" || llmClutterLevelFinal === "extreme")) {
          console.log(`[AI Estimate] ⚠️ 客戶選擇「少雜物」但照片顯示大量雜物 (LLM: ${llmClutterLevelFinal})，以照片判斷為準`);
        }
        
        if (clutterCompensation > 0) {
          truckCount += clutterCompensation;
          console.log(`[AI Estimate] 紙箱補償: +${clutterCompensation} 車 (客戶選: ${input.boxEstimation ?? "未選"}=${customerComp}, LLM判斷: ${llmClutterLevelFinal}=${llmComp}, 取較高值)`);
        }
        // 無照片時的備用補償（依房型）
        if (uniqueImageUrls.length === 0 && !input.boxEstimation && totalRooms >= 3) {
          truckCount += 0.75;
          console.log(`[AI Estimate] 無照片房型補償: +0.75 車 (房型≥3房且未選雜物量)`);
        }

        // 3b. 電梯/樓層懲罰
        const noElevatorHighFloor = 
          (input.fromHasElevator === "no" && (input.fromFloor ?? 0) > 3) ||
          (input.toHasElevator === "no" && (input.toFloor ?? 0) > 3);
        if (noElevatorHighFloor) {
          truckCount = truckCount * 1.05;
          console.log(`[AI Estimate] 電梯懲罰: ×1.05 (無電梯且樓層>3F)`);
        }

        // === Step 4: 歷史數據非線性校正 (Historical Data Calibration) ===
        const preCalibration = truckCount;
        if (truckCount <= 2.5) {
          truckCount = truckCount * 1.41; // 小型案件常被低估
        } else if (truckCount <= 4.5) {
          truckCount = truckCount * 1.04; // 中型案件維持原樣
        } else if (truckCount <= 7.0) {
          truckCount = truckCount * 1.20; // 大型案件需放大
        } else {
          truckCount = truckCount * 0.81; // 超大型案件常被高估
        }
        truckCount = Math.round(truckCount * 10) / 10; // 精確到小數點後一位
        console.log(`[AI Estimate] 校正係數: ${baseTruckCount.toFixed(2)} → ${preCalibration.toFixed(2)}(補償後) → ${truckCount}(校正後)`);

        // 更新總材積
        totalCai = Math.round(truckCount * 200);

        // === 超過 6 車自動標記需人工複核 ===
        let needsManualReview = false;
        if (truckCount > 6) {
          needsManualReview = true;
          console.log(`[AI Estimate] ❗ 超過 6 車 (${truckCount})，標記為「需人工複核」`);
          // 通知業主
          notifyOwner({
            title: `⚠️ AI 估價超過 6 車，需人工複核`,
            content: `估價結果: ${truckCount} 車\n房型: ${roomLayoutText}\n特殊物品: ${input.riskItems?.join("、") || "無"}\n備註: ${input.notes || "無"}\n紙箱量: ${input.boxEstimation ? boxEstLabel[input.boxEstimation] : "未提供"}`,
          }).catch(() => {});
        }

        // 計算估價範圍：每車 12,000，下限 -5000，上限 +15,000
        const effectiveTrucks = Math.max(truckCount, 1);
        const basePrice = Math.round(effectiveTrucks * PRICE_PER_TRUCK / 1000) * 1000;
        const priceRange = {
          min: Math.max(basePrice - PRICE_RANGE_LOW_OFFSET, PRICE_PER_TRUCK),
          max: basePrice + PRICE_RANGE_HIGH_OFFSET,
        };

        // 組合 estimateNote
        const truckLabel = truckCount >= 1 ? `約 ${Math.round(truckCount * 10) / 10} 車（${totalCai || Math.round(truckCount * 200)} 材）` : `不足 1 車（約 ${totalCai || Math.round(truckCount * 200)} 材）`;
        const photoNote = uniqueImageUrls.length > 0
          ? `根據 ${uniqueImageUrls.length} 張照片辨識，共偵測到 ${detectedItems.length} 項物件，估計需 ${truckLabel}。`
          : `未上傳照片，依房型格局初步估算需 ${truckLabel}。`;
        const invalidNote = invalidPhotos.length > 0
          ? `其中 ${invalidPhotos.length} 張照片無法辨識（非室內空間），建議補拍室內照片。`
          : "";
        const manualReviewNote = needsManualReview ? " ❗ 此案件超過 6 車，已自動標記為「需人工複核」，創勝專員將優先與您聯繫確認。" : "";
        const finalNote = `${photoNote}${invalidNote ? " " + invalidNote : ""}${manualReviewNote} AI 估價為初步參考，實際費用以估價師評估為準。如有疑問請直接聯繫客服。`;
        return {
          photoCount: uniqueImageUrls.length,
          furnitureCount,
          truckCount,
          detectedItems,
          invalidPhotos,
          roomSummaries,
          riskItems: Array.from(new Set(riskItems)),
          estimateNote: finalNote,
          priceRange,
          needsManualReview,
          calibrationInfo: {
            baseTruckCount: Math.round(baseTruckCount * 100) / 100,
            afterCompensation: Math.round(preCalibration * 100) / 100,
            afterCalibration: truckCount,
            boxEstimation: input.boxEstimation || null,
            elevatorInfo: elevatorInfo || null,
          },
        };
      } catch (error) {
        console.error("[AI Estimate Vision] 詳細錯誤:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
        });
        // 錯誤時依房型估算
        const totalRooms = Object.values(input.roomLayout).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
        const truckCount = Math.max(1, Math.round(totalRooms * 0.5 * 10) / 10);
        const fallbackBase = Math.round(truckCount * PRICE_PER_TRUCK / 1000) * 1000;
        return {
          photoCount: uniqueImageUrls.length,
          furnitureCount: Math.ceil(totalRooms * 3),
          truckCount,
          detectedItems: [] as Array<{ name: string; count: number; truckUnit: number; room: string }>,
          invalidPhotos: [] as string[],
          roomSummaries: Object.entries(input.roomLayout)
            .filter(([, count]) => (count as number) > 0)
            .map(([room, count]) => ({
              room: roomNames[room] ?? room,
              items: `${count as number} 個空間的物品`,
              note: "AI 分析暫時無法使用，請聯繫估價師確認",
            })),
          riskItems: input.riskItems ?? [],
          estimateNote: "AI 分析暫時無法使用，此為依房型格局的初步估算，實際費用以估價師評估為準。如有疑問請直接聯繫客服。",
          priceRange: {
            min: Math.max(fallbackBase - PRICE_RANGE_LOW_OFFSET, PRICE_PER_TRUCK),
            max: fallbackBase + PRICE_RANGE_HIGH_OFFSET,
          },
        };
      }
    }),
  uploadPhoto: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const ext = input.fileName.split(".").pop() ?? "jpg";
      const key = `ai-estimate/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url, key };
    }),
  uploadFile: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const isZip = input.mimeType === "application/zip" ||
        input.mimeType === "application/x-zip-compressed" ||
        input.fileName.toLowerCase().endsWith(".zip");

      if (isZip) {
        // ZIP 解壓：將每個子檔案分別上傳至 S3
        const extractedFiles: Array<{ name: string; type: string; url: string; size: number }> = [];
        const zipDir = await unzipper.Open.buffer(buffer);
        for (const entry of zipDir.files) {
          if (entry.type === "Directory") continue;
          const entryBuffer = await entry.buffer();
          const entryName = entry.path.split("/").pop() ?? entry.path;
          // 跳過隱藏檔案（macOS __MACOSX 等）
          if (entryName.startsWith(".") || entry.path.includes("__MACOSX")) continue;
          const ext = entryName.split(".").pop()?.toLowerCase() ?? "bin";
          const mimeMap: Record<string, string> = {
            jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
            gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
            mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
            doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            txt: "text/plain",
          };
          const entryMime = mimeMap[ext] ?? "application/octet-stream";
          const key = `uploads/${nanoid()}-${entryName}`;
          const { url } = await storagePut(key, entryBuffer, entryMime);
          extractedFiles.push({ name: entryName, type: entryMime, url, size: entryBuffer.length });
        }
        // 同時上傳原始 ZIP 檔
        const zipKey = `uploads/${nanoid()}-${input.fileName}`;
        const { url: zipUrl } = await storagePut(zipKey, buffer, input.mimeType);
        return {
          name: input.fileName,
          type: input.mimeType,
          url: zipUrl,
          size: input.fileSize,
          extractedFiles,
        };
      } else {
        // 一般檔案直接上傳
        const ext = input.fileName.split(".").pop() ?? "bin";
        const key = `uploads/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return {
          name: input.fileName,
          type: input.mimeType,
          url,
          size: input.fileSize,
          extractedFiles: undefined,
        };
      }
    }),
});

// ─── FAQ Router ───────────────────────────────────────────────────────────────

const faqRouter = router({
  list: publicProcedure.query(async () => {
    return getAllFaqs();
  }),
  search: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const allFaqs = await getAllFaqs();
      const result = await searchFaq(input.question, allFaqs);

      if (!result) {
        return {
          found: false,
          message: "抱歉，未找到相關答案。請聯繫我們的客服團隊。",
        };
      }

      const relatedFaqs = getRelatedFaqs(result.faq, allFaqs, 2);

      return {
        found: true,
        matchType: result.matchType,
        faq: result.faq,
        relatedFaqs,
        message:
          result.matchType === "exact"
            ? "找到完全匹配的答案"
            : result.matchType === "category"
              ? "根據您的問題分類，以下是最相關的答案"
              : "以下是我們認為最相關的答案",
      };
    }),
});

// ─── Cases Router ─────────────────────────────────────────────────────────────

const casesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllCases();
  }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCaseById(input.id);
    }),
});

// ─── News Router ──────────────────────────────────────────────────────────────

const newsRouter = router({
  list: publicProcedure.query(async () => {
    return getAllNews();
  }),
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getNewsBySlug(input.slug);
    }),
});

// ─── Contact Router ───────────────────────────────────────────────────────────

const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        region: z.enum(["taipei", "kaohsiung"]).optional(),
        serviceType: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createContact({
        name: input.name,
        phone: input.phone,
        email: input.email,
        region: input.region,
        serviceType: input.serviceType,
        message: input.message,
      });

      const regionLabel = input.region === "taipei" ? "台北" : input.region === "kaohsiung" ? "高雄" : "未指定";
      await notifyOwner({
        title: `新聯絡表單 - ${input.name}`,
        content: `姓名：${input.name}\n電話：${input.phone}\n區域：${regionLabel}\n服務類型：${input.serviceType ?? "未指定"}\n訊息：${input.message ?? "無"}`,
      });

      return { success: true };
    }),
});

/// ─── Admin Router ───────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return next({ ctx });
});

const adminRouter = router({
  // 強化搜尋：支援多條件篩選、分頁、排序
  listTickets: adminProcedure
    .input(z.object({
      status: z.enum(["new", "pending", "quoted", "contracted", "scheduled", "completed", "archived"]).optional(),
      search: z.string().optional(),
      region: z.enum(["taipei", "kaohsiung"]).optional(),
      source: z.enum(["ai_estimate", "contact_form", "phone", "line"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.number().min(1).optional(),
      pageSize: z.number().min(1).max(100).optional(),
      sortBy: z.enum(["createdAt", "updatedAt", "moveDate", "customerName"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return searchTickets({
        keyword: input?.search,
        status: input?.status,
        region: input?.region,
        source: input?.source,
        dateFrom: input?.dateFrom ? new Date(input.dateFrom) : undefined,
        dateTo: input?.dateTo ? new Date(input.dateTo) : undefined,
        page: input?.page,
        pageSize: input?.pageSize,
        sortBy: input?.sortBy,
        sortOrder: input?.sortOrder,
      });
    }),

  // 取得單一案件詳情
  getTicket: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getTicketById(input.id);
      if (!ticket) throw new Error("NOT_FOUND");
      return ticket;
    }),

  // 更新案件狀態
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "pending", "quoted", "contracted", "scheduled", "completed", "archived"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateTicketStatus(input.id, input.status, input.notes);
      return { success: true };
    }),

  // 取得統計數字
  stats: adminProcedure.query(async () => {
    const all = await getAllTickets();
    const counts = {
      total: all.length,
      new: all.filter(t => t.status === "new").length,
      pending: all.filter(t => t.status === "pending").length,
      quoted: all.filter(t => t.status === "quoted").length,
      contracted: all.filter(t => t.status === "contracted").length,
      scheduled: all.filter(t => t.status === "scheduled").length,
      completed: all.filter(t => t.status === "completed").length,
      archived: all.filter(t => t.status === "archived").length,
    };
    return counts;
  }),

  // 發送脩天訊息（客服回覆）
  sendChatMessage: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string(),
      imageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const ticket = await getTicketById(input.ticketId);
      if (!ticket) throw new Error("Ticket not found");
      
      await addChatMessage(input.ticketId, {
        role: "admin",
        message: input.message,
        timestamp: Date.now(),
        imageUrl: input.imageUrl,
      });
      
      // \u767c\u9001 Email \u901a\u77e5\u7d66\u5ba2\u6236
      if (ticket.customerEmail) {
        try {
          await notifyOwner({
            title: `[\u804a\u5929\u56de\u8986] ${ticket.customerName} - ${ticket.ticketNo}`,
            content: `\u5ba2\u6236 ${ticket.customerName} \u7684\u6848\u4ef6 ${ticket.ticketNo} \u6709\u65b0\u7684\u5ba2\u670d\u56de\u8986:\n\n${input.message}\n\n\u8acb\u767b\u5165\u7cfb\u7d71\u67e5\u770b\u5b8c\u6574\u8058\u5929\u8a18\u9304\u3002`,
          });
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
      
      return { success: true };
    }),
  // 取得聘天記錄
  getChatHistory: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return getChatHistory(input.ticketId);
    }),

  // 標記訊息為已讀
  markChatMessageAsRead: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      messageIndex: z.number(),
    }))
    .mutation(async ({ input }) => {
      await markChatMessageAsRead(input.ticketId, input.messageIndex);
      return { success: true };
    }),

  // 標記所有訊息為已讀
  markAllChatMessagesAsRead: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input }) => {
      await markAllChatMessagesAsRead(input.ticketId);
      return { success: true };
    }),

  // 獲取未讀訊息計數
  getUnreadChatCount: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return getUnreadChatCount(input.ticketId);
    }),

  // 後台客服上傳圖片
  uploadChatImage: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      fileBase64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const ext = input.fileName.split(".").pop() || "jpg";
      const key = `chat-images/admin/${input.ticketId}/${Date.now()}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // 審計日誌查詢（只有 admin 可訪問）
  auditLogs: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      resourceType: z.string().optional(),
      resourceId: z.number().optional(),
      action: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.number().min(1).optional(),
      pageSize: z.number().min(1).max(100).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { data, total } = await getAuditLogs({
        userId: input?.userId,
        resourceType: input?.resourceType,
        resourceId: input?.resourceId,
        action: input?.action,
        startDate: input?.dateFrom ? new Date(input.dateFrom) : undefined,
        endDate: input?.dateTo ? new Date(input.dateTo) : undefined,
        limit: input?.pageSize ?? 50,
        offset: ((input?.page ?? 1) - 1) * (input?.pageSize ?? 50),
      });

      // 記錄審計日誌查詢本身
      await logAudit({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Unknown",
        action: "view",
        resourceType: "audit_log",
        resourceId: 0,
        ipAddress: getClientIpUtil(ctx.req),
        status: "success",
      });

      return {
        data,
        total,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
      };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ticket: ticketRouter,
  aiEstimate: aiEstimateRouter,
  faq: faqRouter,
  cases: casesRouter,
  news: newsRouter,
  contact: contactRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;


// 在 adminRouter 中添加 auditLogs 端點（插入到 uploadChatImage 之後）
// 注意：需要手動編輯 adminRouter 對象以添加此端點
