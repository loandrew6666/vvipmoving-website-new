/**
 * ERP Integration API
 * 
 * 提供 RESTful API 讓外部 ERP 系統串接，取代 Manus 後台管理。
 * 
 * 功能：
 * 1. API Key 認證（Bearer Token）
 * 2. 案件查詢（列表/詳情/搜尋）
 * 3. 聊天訊息查詢與回覆
 * 4. 案件狀態更新
 * 5. Webhook 推送（新案件/新訊息/狀態更新）
 */

import { Router, Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { eq, desc, and, like, or, gte, lte, sql, asc } from "drizzle-orm";
import {
  tickets,
  chatMessages,
  ticketPhotos,
  ticketFiles,
  ticketRoomLayouts,
  ticketAiResults,
} from "../drizzle/schema";

const erpRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// API Key 認證中間件
// ═══════════════════════════════════════════════════════════════════════════════

function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.ERP_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      success: false,
      error: "ERP_API_KEY not configured on server",
    });
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization header. Use: Bearer <API_KEY>",
    });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== apiKey) {
    res.status(403).json({
      success: false,
      error: "Invalid API key",
    });
    return;
  }

  next();
}

// 所有 ERP API 路由都需要認證
erpRouter.use(authenticateApiKey);

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/erp/tickets — 案件列表（分頁 + 篩選）
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.get("/tickets", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const region = req.query.region as string | undefined;
    const search = req.query.search as string | undefined;
    const since = req.query.since as string | undefined;
    const until = req.query.until as string | undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    const conditions: any[] = [];

    if (status && ["new", "pending", "quoted", "contracted", "scheduled", "completed", "archived"].includes(status)) {
      conditions.push(eq(tickets.status, status as any));
    }
    if (region && ["taipei", "kaohsiung"].includes(region)) {
      conditions.push(eq(tickets.region, region as any));
    }
    if (search) {
      conditions.push(
        or(
          like(tickets.customerName, `%${search}%`),
          like(tickets.customerPhone, `%${search}%`),
          like(tickets.ticketNo, `%${search}%`),
          like(tickets.customerEmail, `%${search}%`)
        )
      );
    }
    if (since) {
      conditions.push(gte(tickets.createdAt, new Date(since)));
    }
    if (until) {
      conditions.push(lte(tickets.createdAt, new Date(until)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderColumn = sortBy === "updatedAt" ? tickets.updatedAt : tickets.createdAt;
    const orderDir = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const [ticketList, countResult] = await Promise.all([
      db
        .select({
          id: tickets.id,
          ticketNo: tickets.ticketNo,
          region: tickets.region,
          status: tickets.status,
          customerName: tickets.customerName,
          customerPhone: tickets.customerPhone,
          customerLine: tickets.customerLine,
          customerEmail: tickets.customerEmail,
          moveDate: tickets.moveDate,
          fromAddress: tickets.fromAddress,
          toAddress: tickets.toAddress,
          fromCity: tickets.fromCity,
          fromDistrict: tickets.fromDistrict,
          toCity: tickets.toCity,
          toDistrict: tickets.toDistrict,
          fromHasElevator: tickets.fromHasElevator,
          fromFloor: tickets.fromFloor,
          toHasElevator: tickets.toHasElevator,
          toFloor: tickets.toFloor,
          notes: tickets.notes,
          source: tickets.source,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
        })
        .from(tickets)
        .where(whereClause)
        .orderBy(orderDir)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    res.json({
      success: true,
      data: {
        tickets: ticketList,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error("[ERP API] GET /tickets error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/erp/tickets/:ticketNo — 案件詳情（含照片、檔案、AI 結果、房型）
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.get("/tickets/:ticketNo", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const { ticketNo } = req.params;

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketNo, ticketNo))
      .limit(1);

    if (!ticket.length) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const t = ticket[0];

    const [photos, files, roomLayouts, aiResults] = await Promise.all([
      db.select().from(ticketPhotos).where(eq(ticketPhotos.ticketId, t.id)).orderBy(asc(ticketPhotos.sortOrder)),
      db.select().from(ticketFiles).where(eq(ticketFiles.ticketId, t.id)).orderBy(desc(ticketFiles.createdAt)),
      db.select().from(ticketRoomLayouts).where(eq(ticketRoomLayouts.ticketId, t.id)),
      db.select().from(ticketAiResults).where(eq(ticketAiResults.ticketId, t.id)).limit(1),
    ]);

    res.json({
      success: true,
      data: {
        ticket: {
          id: t.id,
          ticketNo: t.ticketNo,
          region: t.region,
          status: t.status,
          customerName: t.customerName,
          customerPhone: t.customerPhone,
          customerLine: t.customerLine,
          customerEmail: t.customerEmail,
          moveDate: t.moveDate,
          fromAddress: t.fromAddress,
          toAddress: t.toAddress,
          fromCity: t.fromCity,
          fromDistrict: t.fromDistrict,
          toCity: t.toCity,
          toDistrict: t.toDistrict,
          fromHasElevator: t.fromHasElevator,
          fromFloor: t.fromFloor,
          toHasElevator: t.toHasElevator,
          toFloor: t.toFloor,
          notes: t.notes,
          source: t.source,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        },
        photos,
        files,
        roomLayouts,
        aiResult: aiResults[0] || null,
      },
    });
  } catch (error: any) {
    console.error("[ERP API] GET /tickets/:ticketNo error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/erp/tickets/:ticketNo/status — 更新案件狀態
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.patch("/tickets/:ticketNo/status", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const { ticketNo } = req.params;
    const { status: newStatus, notes } = req.body;

    const validStatuses = ["new", "pending", "quoted", "contracted", "scheduled", "completed", "archived"];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const ticket = await db
      .select({ id: tickets.id, status: tickets.status })
      .from(tickets)
      .where(eq(tickets.ticketNo, ticketNo))
      .limit(1);

    if (!ticket.length) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const updateData: any = { status: newStatus };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await db.update(tickets).set(updateData).where(eq(tickets.ticketNo, ticketNo));

    res.json({
      success: true,
      data: { ticketNo, previousStatus: ticket[0].status, newStatus },
    });
  } catch (error: any) {
    console.error("[ERP API] PATCH /tickets/:ticketNo/status error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/erp/tickets/:ticketNo/messages — 取得聊天記錄
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.get("/tickets/:ticketNo/messages", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const { ticketNo } = req.params;
    const since = req.query.since as string | undefined;

    const ticket = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.ticketNo, ticketNo))
      .limit(1);

    if (!ticket.length) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const conditions: any[] = [eq(chatMessages.ticketId, ticket[0].id)];
    if (since) {
      conditions.push(gte(chatMessages.createdAt, new Date(since)));
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(asc(chatMessages.createdAt));

    // 自動標記客戶訊息為已讀
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.ticketId, ticket[0].id),
          eq(chatMessages.role, "customer"),
          eq(chatMessages.isRead, false)
        )
      );

    res.json({
      success: true,
      data: { messages },
    });
  } catch (error: any) {
    console.error("[ERP API] GET /tickets/:ticketNo/messages error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/erp/tickets/:ticketNo/messages — ERP 客服回覆訊息
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.post("/tickets/:ticketNo/messages", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const { ticketNo } = req.params;
    const { message, imageUrl } = req.body;

    if (!message && !imageUrl) {
      res.status(400).json({
        success: false,
        error: "Either message or imageUrl is required",
      });
      return;
    }

    const ticket = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.ticketNo, ticketNo))
      .limit(1);

    if (!ticket.length) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const result = await db.insert(chatMessages).values({
      ticketId: ticket[0].id,
      role: "admin",
      message: message || "",
      imageUrl: imageUrl || null,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      data: {
        messageId: result[0].insertId,
        ticketNo,
        role: "admin",
        message: message || "",
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[ERP API] POST /tickets/:ticketNo/messages error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/erp/unread — 取得有未讀訊息的案件
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.get("/unread", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const unreadTickets = await db
      .select({
        ticketId: chatMessages.ticketId,
        unreadCount: sql<number>`count(*)`,
        latestAt: sql<Date>`MAX(${chatMessages.createdAt})`,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.role, "customer"),
          eq(chatMessages.isRead, false)
        )
      )
      .groupBy(chatMessages.ticketId)
      .orderBy(sql`MAX(${chatMessages.createdAt}) DESC`);

    const ticketIds = unreadTickets.map((u) => u.ticketId);
    let ticketInfos: any[] = [];
    if (ticketIds.length > 0) {
      ticketInfos = await db
        .select({
          id: tickets.id,
          ticketNo: tickets.ticketNo,
          customerName: tickets.customerName,
          customerPhone: tickets.customerPhone,
          status: tickets.status,
        })
        .from(tickets)
        .where(sql`${tickets.id} IN (${sql.join(ticketIds.map(id => sql`${id}`), sql`, `)})`);
    }

    const ticketMap = new Map(ticketInfos.map((t: any) => [t.id, t]));

    const result = unreadTickets.map((u) => ({
      ...ticketMap.get(u.ticketId),
      unreadCount: u.unreadCount,
      latestMessageAt: u.latestAt,
    }));

    res.json({
      success: true,
      data: { unreadTickets: result },
    });
  } catch (error: any) {
    console.error("[ERP API] GET /unread error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/erp/stats — 統計資訊
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ success: false, error: "Database not available" }); return; }

    const [statusCounts, regionCounts, todayCount, unreadCount] = await Promise.all([
      db
        .select({ status: tickets.status, count: sql<number>`count(*)` })
        .from(tickets)
        .groupBy(tickets.status),
      db
        .select({ region: tickets.region, count: sql<number>`count(*)` })
        .from(tickets)
        .groupBy(tickets.region),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(gte(tickets.createdAt, sql`CURDATE()`)),
      db
        .select({ count: sql<number>`count(DISTINCT ${chatMessages.ticketId})` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.role, "customer"),
            eq(chatMessages.isRead, false)
          )
        ),
    ]);

    res.json({
      success: true,
      data: {
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s.count])),
        byRegion: Object.fromEntries(regionCounts.map((r) => [r.region, r.count])),
        todayNewTickets: todayCount[0]?.count ?? 0,
        ticketsWithUnreadMessages: unreadCount[0]?.count ?? 0,
      },
    });
  } catch (error: any) {
    console.error("[ERP API] GET /stats error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/erp/webhook/test — 測試 Webhook 連線
// ═══════════════════════════════════════════════════════════════════════════════

erpRouter.post("/webhook/test", async (_req: Request, res: Response) => {
  const webhookUrl = process.env.ERP_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(400).json({
      success: false,
      error: "ERP_WEBHOOK_URL not configured. Set it via environment variables.",
    });
    return;
  }

  try {
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { message: "Webhook connection test from VVIP Moving website" },
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.ERP_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    res.json({
      success: true,
      data: {
        webhookUrl,
        responseStatus: response.status,
        responseOk: response.ok,
      },
    });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      error: `Webhook test failed: ${error.message}`,
    });
  }
});

export { erpRouter };

// ═══════════════════════════════════════════════════════════════════════════════
// Webhook 推送工具函數（供其他模組呼叫）
// ═══════════════════════════════════════════════════════════════════════════════

export async function triggerWebhook(
  event: string,
  data: Record<string, any>
): Promise<boolean> {
  const webhookUrl = process.env.ERP_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.ERP_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[Webhook] Failed to send ${event}: HTTP ${response.status}`);
      return false;
    }

    console.log(`[Webhook] Successfully sent ${event}`);
    return true;
  } catch (error: any) {
    console.error(`[Webhook] Error sending ${event}:`, error.message);
    return false;
  }
}
