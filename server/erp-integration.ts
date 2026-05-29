/**
 * ERP 系統 API 串接模組
 * 
 * 將前端網站的客戶估價資料拋轉到 ERP 客服系統
 * API Endpoint: http://43.103.3.57:8080/api/public/quotes/external
 * 
 * 欄位對應備註：
 * ┌─────────────────────┬──────────────────────────────────────────────────┐
 * │ ERP 欄位            │ 本系統對應                                       │
 * ├─────────────────────┼──────────────────────────────────────────────────┤
 * │ customerName        │ ticket.customerName                              │
 * │ customerPhone       │ ticket.customerPhone                             │
 * │ pickupAddress       │ ticket.fromAddress                               │
 * │ dropoffAddress      │ ticket.toAddress                                 │
 * │ oldFloor            │ ticket.fromFloor (string)                        │
 * │ newFloor            │ ticket.toFloor (string)                          │
 * │ oldHasElevator      │ ticket.fromHasElevator === "yes"                 │
 * │ newHasElevator      │ ticket.toHasElevator === "yes"                   │
 * │ serviceDateRange    │ ticket.moveDate (ISO date string)                │
 * │ serviceType         │ "搬家服務" (固定)                                │
 * │ note                │ 組合：AI估價結果 + 物件清單 + 客戶備註           │
 * └─────────────────────┴──────────────────────────────────────────────────┘
 * 
 * 無法直接對應到 ERP 的資料（放入 note 欄位）：
 * - AI 估價結果（車數、金額範圍、大型傢俱數量）
 * - 辨識物件清單（名稱、數量、車數）
 * - 客戶上傳照片 URL 列表
 * - 房型格局資訊
 * - 雜物密度等級
 * - 案件編號（本系統）
 * - 客戶 LINE ID / Email
 * - 搬出/搬入城市區域
 */

import { ENV } from "./_core/env";

// ERP API 設定
const ERP_API_URL = ENV.erpApiUrl || "http://43.103.3.57:8080/api/public/quotes/external";
const ERP_API_KEY = ENV.erpApiKey || "CS_API_2024_x9k2m8L5pQ";

export interface ErpQuotePayload {
  customerName: string;
  customerPhone: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  oldFloor?: string;
  newFloor?: string;
  oldHasElevator?: boolean;
  newHasElevator?: boolean;
  serviceDateRange?: string;
  serviceType?: string;
  note?: string;
}

export interface ErpApiResponse {
  id: number;
}

export interface TicketDataForErp {
  ticketNo?: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string | null;
  customerEmail?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  fromFloor?: number | null;
  toFloor?: number | null;
  fromHasElevator?: string | null; // "yes" | "no"
  toHasElevator?: string | null;   // "yes" | "no"
  moveDate?: Date | string | null;
  notes?: string | null;
  roomLayout?: Record<string, number> | null;
  aiResult?: {
    truckCount?: number;
    furnitureCount?: number;
    priceRange?: { min: number; max: number };
    detectedItems?: Array<{ name: string; quantity: number; truckLoad: number; room?: string }>;
    clutterLevel?: string;
  } | null;
  photoUrls?: string[] | null;
}

/**
 * 將 ticket 資料轉換為 ERP API 格式
 */
export function buildErpPayload(ticket: TicketDataForErp): ErpQuotePayload {
  // 組合 note 欄位：包含所有無法直接對應的資料
  const noteLines: string[] = [];

  // 案件編號
  if (ticket.ticketNo) {
    noteLines.push(`【案件編號】${ticket.ticketNo}`);
  }

  // AI 估價結果
  if (ticket.aiResult) {
    const ai = ticket.aiResult;
    noteLines.push(`【AI 估價結果】`);
    if (ai.truckCount !== undefined) noteLines.push(`  估計車數：${ai.truckCount} 車`);
    if (ai.furnitureCount !== undefined) noteLines.push(`  大型傢俱：${ai.furnitureCount} 件`);
    if (ai.priceRange) noteLines.push(`  估價範圍：NT$ ${ai.priceRange.min.toLocaleString()} ~ ${ai.priceRange.max.toLocaleString()}`);
    if (ai.clutterLevel) noteLines.push(`  雜物密度：${ai.clutterLevel}`);
  }

  // 辨識物件清單
  if (ticket.aiResult?.detectedItems && ticket.aiResult.detectedItems.length > 0) {
    noteLines.push(`【辨識物件清單】`);
    ticket.aiResult.detectedItems.forEach((item, i) => {
      noteLines.push(`  ${i + 1}. ${item.name} x${item.quantity}（${item.room ?? "未分類"}）→ ${item.truckLoad} 車`);
    });
  }

  // 房型格局
  if (ticket.roomLayout) {
    const roomNames: Record<string, string> = { living: "客廳", bedroom: "臥室", kitchen: "廚房", study: "書房", balcony: "陽台", other: "其他" };
    const roomText = Object.entries(ticket.roomLayout)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${roomNames[k] ?? k} x${v}`)
      .join("、");
    if (roomText) noteLines.push(`【房型格局】${roomText}`);
  }

  // 客戶聯絡方式（補充）
  if (ticket.customerLine) noteLines.push(`【LINE】${ticket.customerLine}`);
  if (ticket.customerEmail) noteLines.push(`【Email】${ticket.customerEmail}`);

  // 照片連結
  if (ticket.photoUrls && ticket.photoUrls.length > 0) {
    noteLines.push(`【上傳照片】共 ${ticket.photoUrls.length} 張`);
    ticket.photoUrls.slice(0, 10).forEach((url, i) => {
      noteLines.push(`  ${i + 1}. ${url}`);
    });
    if (ticket.photoUrls.length > 10) {
      noteLines.push(`  ...等 ${ticket.photoUrls.length} 張`);
    }
  }

  // 客戶備註
  if (ticket.notes) {
    noteLines.push(`【客戶備註】${ticket.notes}`);
  }

  // 組合搬家日期
  let serviceDateRange: string | undefined;
  if (ticket.moveDate) {
    const date = ticket.moveDate instanceof Date ? ticket.moveDate : new Date(ticket.moveDate);
    if (!isNaN(date.getTime())) {
      serviceDateRange = date.toISOString().split("T")[0]; // YYYY-MM-DD
    }
  }

  return {
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    pickupAddress: ticket.fromAddress ?? undefined,
    dropoffAddress: ticket.toAddress ?? undefined,
    oldFloor: ticket.fromFloor != null ? String(ticket.fromFloor) : undefined,
    newFloor: ticket.toFloor != null ? String(ticket.toFloor) : undefined,
    oldHasElevator: ticket.fromHasElevator === "yes" ? true : ticket.fromHasElevator === "no" ? false : undefined,
    newHasElevator: ticket.toHasElevator === "yes" ? true : ticket.toHasElevator === "no" ? false : undefined,
    serviceDateRange,
    serviceType: "搬家服務",
    note: noteLines.length > 0 ? noteLines.join("\n") : undefined,
  };
}

/**
 * 發送資料到 ERP 系統
 * 失敗時不會拋出錯誤，只記錄 log 並回傳 null
 */
export async function sendToErp(ticket: TicketDataForErp): Promise<{ success: boolean; erpId?: number; error?: string }> {
  try {
    const payload = buildErpPayload(ticket);
    
    console.log(`[ERP] Sending ticket ${ticket.ticketNo ?? "unknown"} to ERP...`);
    
    const response = await fetch(ERP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": ERP_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json() as ErpApiResponse;
      console.log(`[ERP] Success! Ticket ${ticket.ticketNo} → ERP ID: ${data.id}`);
      return { success: true, erpId: data.id };
    } else {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[ERP] Failed (${response.status}): ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ERP] Network error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}
