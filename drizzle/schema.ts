import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  float,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (t) => [
  index("idx_users_role").on(t.role).using("btree"),
  index("idx_users_createdAt").on(t.createdAt).using("btree"),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Tickets（案件主表 — 只保留核心欄位，JSON 資料遷出到子表）
// ═══════════════════════════════════════════════════════════════════════════════

export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNo: varchar("ticketNo", { length: 32 }).notNull().unique(),
  region: mysqlEnum("region", ["taipei", "kaohsiung"]).notNull(),
  status: mysqlEnum("status", [
    "new", "pending", "quoted", "contracted", "scheduled", "completed", "archived",
  ]).default("new").notNull(),
  // 客戶資料
  customerName: varchar("customerName", { length: 100 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerLine: varchar("customerLine", { length: 100 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  // 搬家資訊
  moveDate: timestamp("moveDate"),
  fromAddress: text("fromAddress"),
  toAddress: text("toAddress"),
  fromCity: varchar("fromCity", { length: 10 }),
  fromDistrict: varchar("fromDistrict", { length: 10 }),
  toCity: varchar("toCity", { length: 10 }),
  toDistrict: varchar("toDistrict", { length: 10 }),
  fromHasElevator: mysqlEnum("fromHasElevator", ["yes", "no"]),
  fromFloor: int("fromFloor"),
  toHasElevator: mysqlEnum("toHasElevator", ["yes", "no"]),
  toFloor: int("toFloor"),
  // 客戶 IP
  customerIp: varchar("customerIp", { length: 45 }),
  // 備註
  notes: text("notes"),
  // 來源
  source: mysqlEnum("source", ["ai_estimate", "contact_form", "phone", "line"]).default("contact_form"),
  // ── 以下 JSON 欄位保留做向下相容，新資料寫入子表 ──
  roomLayout: json("roomLayout"),
  aiResult: json("aiResult"),
  photoUrls: json("photoUrls"),
  uploadedFiles: json("uploadedFiles"),
  chatHistory: json("chatHistory"),
  // 安全
  isEncrypted: boolean("isEncrypted").default(false).notNull(),
  encryptionVersion: int("encryptionVersion").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_tickets_status").on(t.status).using("btree"),
  index("idx_tickets_region").on(t.region).using("btree"),
  index("idx_tickets_customerPhone").on(t.customerPhone).using("btree"),
  index("idx_tickets_customerIp").on(t.customerIp).using("btree"),
  index("idx_tickets_createdAt").on(t.createdAt).using("btree"),
  index("idx_tickets_updatedAt").on(t.updatedAt).using("btree"),
  index("idx_tickets_source").on(t.source).using("btree"),
  // 複合索引：後台搜尋常用組合
  index("idx_tickets_region_status").on(t.region, t.status).using("btree"),
  index("idx_tickets_status_createdAt").on(t.status, t.createdAt).using("btree"),
]);

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Sensitive（機敏資料隔離表 — 只有 admin 可訪問）
// ═══════════════════════════════════════════════════════════════════════════════

export const ticketSensitive = mysqlTable("ticket_sensitive", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().unique(),  // FK to tickets, 1:1 relationship
  customerPhoneEncrypted: varchar("customerPhoneEncrypted", { length: 255 }).notNull(),  // AES-256 encrypted
  customerEmailEncrypted: varchar("customerEmailEncrypted", { length: 255 }),  // AES-256 encrypted
  customerAddressEncrypted: text("customerAddressEncrypted"),  // AES-256 encrypted
  encryptionVersion: int("encryptionVersion").default(1).notNull(),  // For key rotation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex("idx_sensitive_ticketId").on(t.ticketId),
]);

export type TicketSensitive = typeof ticketSensitive.$inferSelect;
export type InsertTicketSensitive = typeof ticketSensitive.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Audit Logs（審計日誌 — 記錄所有敏感資料訪問）
// ═══════════════════════════════════════════════════════════════════════════════

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),  // FK to users
  userName: varchar("userName", { length: 100 }).notNull(),  // 快照用戶名
  action: varchar("action", { length: 50 }).notNull(),  // 'view', 'create', 'update', 'delete', 'export'
  resourceType: varchar("resourceType", { length: 50 }).notNull(),  // 'ticket', 'sensitive_data', 'chat_message'
  resourceId: int("resourceId").notNull(),  // 資源 ID
  oldValue: text("oldValue"),  // 舊值（JSON）
  newValue: text("newValue"),  // 新值（JSON）
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),  // 客戶端 IP
  userAgent: text("userAgent"),  // 瀏覽器 User-Agent
  status: mysqlEnum("status", ["success", "failed", "denied"]).default("success").notNull(),
  reason: text("reason"),  // 失敗或拒絕原因
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_audit_userId").on(t.userId).using("btree"),
  index("idx_audit_resourceType").on(t.resourceType).using("btree"),
  index("idx_audit_resourceId").on(t.resourceId).using("btree"),
  index("idx_audit_action").on(t.action).using("btree"),
  index("idx_audit_createdAt").on(t.createdAt).using("btree"),
  // 複合索引：查詢某用戶在某時間範圍內的操作
  index("idx_audit_userId_createdAt").on(t.userId, t.createdAt).using("btree"),
  index("idx_audit_resourceType_createdAt").on(t.resourceType, t.createdAt).using("btree"),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Messages（從 tickets.chatHistory JSON 遷出）
// ═══════════════════════════════════════════════════════════════════════════════

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  role: mysqlEnum("role", ["customer", "admin"]).notNull(),
  message: text("message").notNull(),
  imageUrl: text("imageUrl"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_chat_ticketId").on(t.ticketId).using("btree"),
  index("idx_chat_role").on(t.role).using("btree"),
  index("idx_chat_isRead").on(t.isRead).using("btree"),
  index("idx_chat_createdAt").on(t.createdAt).using("btree"),
  // 複合索引：查詢某案件的未讀訊息
  index("idx_chat_ticketId_isRead").on(t.ticketId, t.isRead).using("btree"),
  index("idx_chat_ticketId_createdAt").on(t.ticketId, t.createdAt).using("btree"),
]);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Photos（從 tickets.photoUrls JSON 遷出）
// ═══════════════════════════════════════════════════════════════════════════════

export const ticketPhotos = mysqlTable("ticket_photos", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  url: text("url").notNull(),
  room: varchar("room", { length: 50 }),       // 所屬房間（客廳/臥室/廚房…）
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_photos_ticketId").on(t.ticketId).using("btree"),
  index("idx_photos_room").on(t.room).using("btree"),
]);

export type TicketPhoto = typeof ticketPhotos.$inferSelect;
export type InsertTicketPhoto = typeof ticketPhotos.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Files（從 tickets.uploadedFiles JSON 遷出）
// ═══════════════════════════════════════════════════════════════════════════════

export const ticketFiles = mysqlTable("ticket_files", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  url: text("url").notNull(),
  fileSize: int("fileSize").default(0),
  // ZIP 解壓後的子檔案（JSON array）
  extractedFiles: json("extractedFiles"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_files_ticketId").on(t.ticketId).using("btree"),
  index("idx_files_fileType").on(t.fileType).using("btree"),
]);

export type TicketFile = typeof ticketFiles.$inferSelect;
export type InsertTicketFile = typeof ticketFiles.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Room Layouts（從 tickets.roomLayout JSON 遷出）
// ═══════════════════════════════════════════════════════════════════════════════

export const ticketRoomLayouts = mysqlTable("ticket_room_layouts", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  roomType: varchar("roomType", { length: 50 }).notNull(), // living/bedroom/kitchen/study/balcony/other
  count: int("count").default(0).notNull(),
}, (t) => [
  index("idx_roomLayouts_ticketId").on(t.ticketId).using("btree"),
  uniqueIndex("idx_roomLayouts_ticket_room").on(t.ticketId, t.roomType),
]);

export type TicketRoomLayout = typeof ticketRoomLayouts.$inferSelect;
export type InsertTicketRoomLayout = typeof ticketRoomLayouts.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket AI Results（從 tickets.aiResult JSON 遷出）
// ═══════════════════════════════════════════════════════════════════════════════

export const ticketAiResults = mysqlTable("ticket_ai_results", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  photoCount: int("photoCount").default(0),
  furnitureCount: int("furnitureCount").default(0),
  truckCount: float("truckCount").default(0),
  priceMin: int("priceMin").default(0),
  priceMax: int("priceMax").default(0),
  estimateNote: text("estimateNote"),
  // 詳細辨識結果（物件清單、房間摘要、風險物件）仍用 JSON 存
  detectedItems: json("detectedItems"),   // [{ name, count, truckUnit, room }]
  roomSummaries: json("roomSummaries"),   // [{ room, items, note }]
  riskItems: json("riskItems"),           // string[]
  invalidPhotos: json("invalidPhotos"),   // string[]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_aiResults_ticketId").on(t.ticketId).using("btree"),
  index("idx_aiResults_truckCount").on(t.truckCount).using("btree"),
  index("idx_aiResults_priceMin").on(t.priceMin).using("btree"),
]);

export type TicketAiResult = typeof ticketAiResults.$inferSelect;
export type InsertTicketAiResult = typeof ticketAiResults.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// FAQs
// ═══════════════════════════════════════════════════════════════════════════════

export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0),
  isPublished: boolean("isPublished").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_faqs_category").on(t.category).using("btree"),
  index("idx_faqs_isPublished").on(t.isPublished).using("btree"),
  index("idx_faqs_sortOrder").on(t.sortOrder).using("btree"),
]);

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Cases（案例回顧）
// ═══════════════════════════════════════════════════════════════════════════════

export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  result: text("result").notNull(),
  feedback: text("feedback"),
  photoUrls: json("photoUrls"),
  coverPhoto: text("coverPhoto"),
  region: mysqlEnum("region", ["taipei", "kaohsiung", "both"]).default("taipei"),
  isPublished: boolean("isPublished").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_cases_category").on(t.category).using("btree"),
  index("idx_cases_region").on(t.region).using("btree"),
  index("idx_cases_isPublished").on(t.isPublished).using("btree"),
]);

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// News（最新消息/SEO 文章）
// ═══════════════════════════════════════════════════════════════════════════════

export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  metaDescription: varchar("metaDescription", { length: 160 }),
  category: varchar("category", { length: 50 }),
  content: text("content").notNull(),
  coverPhoto: text("coverPhoto"),
  isPublished: boolean("isPublished").default(true),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_news_category").on(t.category).using("btree"),
  index("idx_news_isPublished").on(t.isPublished).using("btree"),
  index("idx_news_publishedAt").on(t.publishedAt).using("btree"),
]);

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Registrations（審計日誌）
// ═══════════════════════════════════════════════════════════════════════════════

export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  source: varchar("source", { length: 50 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_registrations_email").on(t.email).using("btree"),
  index("idx_registrations_status").on(t.status).using("btree"),
  index("idx_registrations_ipAddress").on(t.ipAddress).using("btree"),
  index("idx_registrations_createdAt").on(t.createdAt).using("btree"),
]);

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Contacts（聯絡表單）
// ═══════════════════════════════════════════════════════════════════════════════

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  region: mysqlEnum("region", ["taipei", "kaohsiung"]),
  serviceType: varchar("serviceType", { length: 100 }),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_contacts_isRead").on(t.isRead).using("btree"),
  index("idx_contacts_region").on(t.region).using("btree"),
  index("idx_contacts_createdAt").on(t.createdAt).using("btree"),
]);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
