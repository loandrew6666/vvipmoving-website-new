import { eq, desc, asc, or, like, sql, count, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  tickets,
  InsertTicket,
  faqs,
  InsertFaq,
  cases,
  InsertCase,
  news,
  InsertNews,
  contacts,
  InsertContact,
  chatMessages,
  InsertChatMessage,
  ticketPhotos,
  InsertTicketPhoto,
  ticketFiles,
  InsertTicketFile,
  ticketRoomLayouts,
  InsertTicketRoomLayout,
  ticketAiResults,
  InsertTicketAiResult,
  ticketSensitive,
  InsertTicketSensitive,
  auditLogs,
  InsertAuditLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encryptField, decryptField } from "./_core/encryption";
import { logAudit } from "./_core/audit";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    // 角色設定：owner 永遠是 admin；其他帳號只在新建時設為 user，不覆蓋已有的 admin 角色
    if (user.openId === ENV.ownerOpenId) { 
      values.role = "admin"; 
      updateSet.role = "admin"; 
    } else { 
      values.role = "user"; 
      // 不在 updateSet 中設定 role，避免覆蓋已手動升級的 admin 角色
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tickets（主表操作）
// ═══════════════════════════════════════════════════════════════════════════════

function generateTicketNo(region: "taipei" | "kaohsiung"): string {
  const prefix = region === "taipei" ? "TP" : "KH";
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `VV-${prefix}-${year}-${rand}`;
}

export async function createTicket(data: Omit<InsertTicket, "ticketNo">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ticketNo = generateTicketNo(data.region);
  await db.insert(tickets).values({ ...data, ticketNo });
  const result = await db.select().from(tickets).where(eq(tickets.ticketNo, ticketNo)).limit(1);
  return result[0];
}

export async function getTicketByNo(ticketNo: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tickets).where(eq(tickets.ticketNo, ticketNo)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTicketByPhone(phone: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).where(eq(tickets.customerPhone, phone)).orderBy(desc(tickets.createdAt)).limit(10);
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateTicketStatus(
  id: number,
  status: "new" | "pending" | "quoted" | "contracted" | "scheduled" | "completed" | "archived",
  adminNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<typeof tickets.$inferInsert> = { status };
  if (adminNote !== undefined) updateData.notes = adminNote;
  await db.update(tickets).set(updateData).where(eq(tickets.id, id));
}

export async function getTicketsByStatus(
  status?: "new" | "pending" | "quoted" | "contracted" | "scheduled" | "completed" | "archived"
) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(tickets).where(eq(tickets.status, status)).orderBy(desc(tickets.createdAt));
  }
  return db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function getTicketByCustomerIp(customerIp: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db
      .select()
      .from(tickets)
      .where(eq(tickets.customerIp, customerIp))
      .orderBy(desc(tickets.createdAt))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get ticket by customer IP:", error);
    return null;
  }
}

export async function updateTicketCustomerIp(ticketId: number, customerIp: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tickets).set({ customerIp }).where(eq(tickets.id, ticketId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Search（內勤人員強化搜尋）
// ═══════════════════════════════════════════════════════════════════════════════

export interface TicketSearchParams {
  keyword?: string;       // 模糊搜尋：案件編號、客戶姓名、電話、地址
  status?: string;
  region?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;          // 分頁（1-based）
  pageSize?: number;      // 每頁筆數（預設 20）
  sortBy?: "createdAt" | "updatedAt" | "moveDate" | "customerName";
  sortOrder?: "asc" | "desc";
}

export async function searchTickets(params: TicketSearchParams) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page: 1, pageSize: 20 };

  const {
    keyword,
    status,
    region,
    source,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const conditions = [];

  // 模糊搜尋：案件編號、客戶姓名、電話、地址
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    conditions.push(
      or(
        like(tickets.ticketNo, kw),
        like(tickets.customerName, kw),
        like(tickets.customerPhone, kw),
        like(tickets.fromAddress, kw),
        like(tickets.toAddress, kw),
        like(tickets.customerEmail, kw),
        like(tickets.customerLine, kw),
      )
    );
  }

  if (status) {
    conditions.push(eq(tickets.status, status as any));
  }
  if (region) {
    conditions.push(eq(tickets.region, region as any));
  }
  if (source) {
    conditions.push(eq(tickets.source, source as any));
  }
  if (dateFrom) {
    conditions.push(sql`${tickets.createdAt} >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(sql`${tickets.createdAt} <= ${dateTo}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 排序
  const sortColumn = {
    createdAt: tickets.createdAt,
    updatedAt: tickets.updatedAt,
    moveDate: tickets.moveDate,
    customerName: tickets.customerName,
  }[sortBy] ?? tickets.createdAt;

  const orderFn = sortOrder === "asc" ? asc : desc;

  // 計算總數
  const countResult = await db
    .select({ total: count() })
    .from(tickets)
    .where(whereClause);
  const total = countResult[0]?.total ?? 0;

  // 分頁查詢
  const offset = (page - 1) * pageSize;
  const data = await db
    .select()
    .from(tickets)
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return { data, total, page, pageSize };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Messages（獨立表）
// ═══════════════════════════════════════════════════════════════════════════════

// 向下相容的 ChatMessage 介面（舊 JSON 格式）
export interface ChatMessageLegacy {
  role: "customer" | "admin";
  message: string;
  timestamp: number;
  isRead?: boolean;
  imageUrl?: string;
}

export async function addChatMessage(
  ticketId: number,
  message: ChatMessageLegacy
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ticket = await getTicketById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  // 寫入新的獨立表
  await db.insert(chatMessages).values({
    ticketId,
    role: message.role,
    message: message.message,
    imageUrl: message.imageUrl ?? null,
    isRead: message.isRead ?? false,
  });

  // 同時更新舊的 JSON 欄位（向下相容）
  const chatHistory = (ticket.chatHistory as ChatMessageLegacy[] | null) || [];
  const newMessage = { ...message, isRead: message.isRead ?? false };
  chatHistory.push(newMessage);
  await db.update(tickets).set({ chatHistory }).where(eq(tickets.id, ticketId));
}

export async function getChatHistory(ticketId: number): Promise<ChatMessageLegacy[]> {
  const db = await getDb();
  if (!db) return [];

  // 優先從獨立表讀取
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.ticketId, ticketId))
    .orderBy(asc(chatMessages.createdAt));

  if (rows.length > 0) {
    return rows.map(r => ({
      role: r.role,
      message: r.message,
      timestamp: r.createdAt.getTime(),
      isRead: r.isRead,
      imageUrl: r.imageUrl ?? undefined,
    }));
  }

  // 回退到舊 JSON 欄位
  const ticket = await getTicketById(ticketId);
  if (!ticket) return [];
  const chatHistory = (ticket.chatHistory as ChatMessageLegacy[] | null) || [];
  return chatHistory.map(msg => ({
    ...msg,
    isRead: msg.isRead ?? false,
  }));
}

export async function markChatMessageAsRead(ticketId: number, messageIndex: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 從獨立表讀取
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.ticketId, ticketId))
    .orderBy(asc(chatMessages.createdAt));

  if (rows.length > 0 && messageIndex >= 0 && messageIndex < rows.length) {
    const msgId = rows[messageIndex]!.id;
    await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, msgId));
  }

  // 同步更新舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket) return;
  const chatHistory = (ticket.chatHistory as ChatMessageLegacy[] | null) || [];
  if (messageIndex >= 0 && messageIndex < chatHistory.length) {
    chatHistory[messageIndex]!.isRead = true;
    await db.update(tickets).set({ chatHistory }).where(eq(tickets.id, ticketId));
  }
}

export async function markAllChatMessagesAsRead(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 批量更新獨立表
  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(and(eq(chatMessages.ticketId, ticketId), eq(chatMessages.isRead, false)));

  // 同步更新舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket) return;
  const chatHistory = (ticket.chatHistory as ChatMessageLegacy[] | null) || [];
  chatHistory.forEach(msg => { msg.isRead = true; });
  await db.update(tickets).set({ chatHistory }).where(eq(tickets.id, ticketId));
}

export async function getUnreadChatCount(ticketId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // 從獨立表計算
  const result = await db
    .select({ total: count() })
    .from(chatMessages)
    .where(and(eq(chatMessages.ticketId, ticketId), eq(chatMessages.isRead, false)));

  const fromTable = result[0]?.total ?? 0;
  if (fromTable > 0) return fromTable;

  // 回退到舊 JSON
  const chatHistory = await getChatHistory(ticketId);
  return chatHistory.filter(msg => !msg.isRead).length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Photos（獨立表）
// ═══════════════════════════════════════════════════════════════════════════════

export async function addTicketPhoto(data: InsertTicketPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ticketPhotos).values(data);
}

export async function addTicketPhotos(ticketId: number, urls: string[], room?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (urls.length === 0) return;
  
  const values = urls.map((url, i) => ({
    ticketId,
    url,
    room: room ?? null,
    sortOrder: i,
  }));
  await db.insert(ticketPhotos).values(values);
}

export async function getTicketPhotos(ticketId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(ticketPhotos)
    .where(eq(ticketPhotos.ticketId, ticketId))
    .orderBy(asc(ticketPhotos.sortOrder));

  if (rows.length > 0) return rows;

  // 回退到舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket) return [];
  const photoUrls = (ticket.photoUrls as string[] | null) || [];
  return photoUrls.map((url, i) => ({
    id: 0,
    ticketId,
    url,
    room: null,
    sortOrder: i,
    createdAt: ticket.createdAt,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Files（獨立表）
// ═══════════════════════════════════════════════════════════════════════════════

export async function addTicketFile(data: InsertTicketFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ticketFiles).values(data);
}

export async function getTicketFiles(ticketId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(ticketFiles)
    .where(eq(ticketFiles.ticketId, ticketId))
    .orderBy(desc(ticketFiles.createdAt));

  if (rows.length > 0) return rows;

  // 回退到舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket) return [];
  const uploadedFiles = (ticket.uploadedFiles as any[] | null) || [];
  return uploadedFiles.map((f: any) => ({
    id: 0,
    ticketId,
    fileName: f.name ?? "unknown",
    fileType: f.type ?? "unknown",
    url: f.url ?? "",
    fileSize: f.size ?? 0,
    extractedFiles: f.extractedFiles ?? null,
    createdAt: ticket.createdAt,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Room Layouts（獨立表）
// ═══════════════════════════════════════════════════════════════════════════════

export async function setTicketRoomLayout(
  ticketId: number,
  layout: Record<string, number>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 先刪除舊的
  await db.delete(ticketRoomLayouts).where(eq(ticketRoomLayouts.ticketId, ticketId));

  // 寫入新的
  const values = Object.entries(layout)
    .filter(([, count]) => count > 0)
    .map(([roomType, cnt]) => ({
      ticketId,
      roomType,
      count: cnt,
    }));

  if (values.length > 0) {
    await db.insert(ticketRoomLayouts).values(values);
  }

  // 同步更新舊 JSON
  await db.update(tickets).set({ roomLayout: layout }).where(eq(tickets.id, ticketId));
}

export async function getTicketRoomLayout(ticketId: number): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  const rows = await db
    .select()
    .from(ticketRoomLayouts)
    .where(eq(ticketRoomLayouts.ticketId, ticketId));

  if (rows.length > 0) {
    const layout: Record<string, number> = {};
    rows.forEach(r => { layout[r.roomType] = r.count; });
    return layout;
  }

  // 回退到舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket) return {};
  return (ticket.roomLayout as Record<string, number> | null) ?? {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket AI Results（獨立表）
// ═══════════════════════════════════════════════════════════════════════════════

export async function setTicketAiResult(ticketId: number, data: Omit<InsertTicketAiResult, "ticketId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 先刪除舊的
  await db.delete(ticketAiResults).where(eq(ticketAiResults.ticketId, ticketId));

  // 寫入新的
  await db.insert(ticketAiResults).values({ ...data, ticketId });

  // 同步更新舊 JSON
  const aiResult = {
    photoCount: data.photoCount ?? 0,
    furnitureCount: data.furnitureCount ?? 0,
    truckCount: data.truckCount ?? 0,
    priceMin: data.priceMin ?? 0,
    priceMax: data.priceMax ?? 0,
    estimateNote: data.estimateNote ?? "",
    detectedItems: data.detectedItems ?? [],
    roomSummaries: data.roomSummaries ?? [],
    riskItems: data.riskItems ?? [],
    invalidPhotos: data.invalidPhotos ?? [],
  };
  await db.update(tickets).set({ aiResult }).where(eq(tickets.id, ticketId));
}

export async function getTicketAiResult(ticketId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(ticketAiResults)
    .where(eq(ticketAiResults.ticketId, ticketId))
    .limit(1);

  if (rows.length > 0) return rows[0];

  // 回退到舊 JSON
  const ticket = await getTicketById(ticketId);
  if (!ticket || !ticket.aiResult) return null;
  return ticket.aiResult as any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQs
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllFaqs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqs).where(eq(faqs.isPublished, true)).orderBy(asc(faqs.category), asc(faqs.sortOrder));
}

export async function createFaq(data: InsertFaq) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(faqs).values(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cases
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).where(eq(cases.isPublished, true)).orderBy(asc(cases.sortOrder), desc(cases.createdAt));
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// News
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).where(eq(news.isPublished, true)).orderBy(desc(news.publishedAt));
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Contacts
// ═══════════════════════════════════════════════════════════════════════════════

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contacts).values(data);
}

export async function getAllContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Sensitive（機敏資料隔離表 — 只有 admin 可訪問）
// ═══════════════════════════════════════════════════════════════════════════════

export async function createTicketSensitive(
  ticketId: number,
  phone: string,
  email?: string,
  address?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 加密敏感欄位
  const encrypted = {
    customerPhoneEncrypted: encryptField(phone),
    customerEmailEncrypted: email ? encryptField(email) : null,
    customerAddressEncrypted: address ? encryptField(address) : null,
  };

  await db.insert(ticketSensitive).values({
    ticketId,
    ...encrypted,
    encryptionVersion: 1,
  });
}

export async function getTicketSensitive(ticketId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(ticketSensitive)
    .where(eq(ticketSensitive.ticketId, ticketId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];

  // 解密敏感欄位
  return {
    id: row.id,
    ticketId: row.ticketId,
    customerPhone: decryptField(row.customerPhoneEncrypted),
    customerEmail: row.customerEmailEncrypted ? decryptField(row.customerEmailEncrypted) : null,
    customerAddress: row.customerAddressEncrypted ? decryptField(row.customerAddressEncrypted) : null,
    encryptionVersion: row.encryptionVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateTicketSensitive(
  ticketId: number,
  updates: {
    phone?: string;
    email?: string;
    address?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.phone) updateData.customerPhoneEncrypted = encryptField(updates.phone);
  if (updates.email) updateData.customerEmailEncrypted = encryptField(updates.email);
  if (updates.address) updateData.customerAddressEncrypted = encryptField(updates.address);

  if (Object.keys(updateData).length === 0) return;

  await db
    .update(ticketSensitive)
    .set(updateData)
    .where(eq(ticketSensitive.ticketId, ticketId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Audit Logs（審計日誌 — 記錄所有敏感資料訪問）
// ═══════════════════════════════════════════════════════════════════════════════

export async function recordAuditLog(input: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record audit log: database not available");
    return;
  }

  try {
    await db.insert(auditLogs).values(input);
  } catch (err) {
    console.error("[Database] Failed to record audit log:", err);
  }
}

export async function getAuditLogs(filters: {
  userId?: number;
  resourceType?: string;
  resourceId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const {
    userId,
    resourceType,
    resourceId,
    action,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;

  const conditions = [];

  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
  if (resourceId) conditions.push(eq(auditLogs.resourceId, resourceId));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (startDate) conditions.push(sql`${auditLogs.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${auditLogs.createdAt} <= ${endDate}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 計算總數
  const countResult = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(whereClause);
  const total = countResult[0]?.total ?? 0;

  // 查詢數據
  const data = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { data, total };
}
