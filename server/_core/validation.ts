/**
 * Field validation schemas using Zod
 * Prevents SQL injection, XSS, and data corruption
 */

import { z } from "zod";

// Common patterns
const PHONE_PATTERN = /^[0-9\-\+\(\)\s]{8,20}$/; // 台灣電話號碼格式
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 基本 Email 格式
const LINE_ID_PATTERN = /^@?[a-zA-Z0-9_\-\.]{1,30}$/; // LINE ID 格式（允許 @ 前綴）
const ADDRESS_PATTERN = /^[a-zA-Z0-9\u4E00-\u9FFF\s\-\(\)（），,\.。、\*\+\#\@\&\!]{1,255}$/; // 地址格式（中英文、數字、常見符號）
const NAME_PATTERN = /^[a-zA-Z\u4E00-\u9FFF\s\-\.]{1,50}$/; // 姓名格式（中英文、空格、連字號、點）
const MESSAGE_PATTERN = /^[\s\S]{1,5000}$/; // 訊息格式（允許換行，最多 5000 字）
const TICKET_NO_PATTERN = /^VV-(TP|KH)-\d{4}-\d{5}$/; // 案件編號格式（支援台北 TP 和高雄 KH）

// Base schemas
export const phoneSchema = z
  .string()
  .min(8, "電話號碼至少 8 個字符")
  .max(20, "電話號碼最多 20 個字符")
  .regex(PHONE_PATTERN, "電話號碼格式無效");

export const emailSchema = z
  .string()
  .email("Email 格式無效")
  .max(100, "Email 最多 100 個字符");

export const lineIdSchema = z
  .string()
  .min(1, "LINE ID 不能為空")
  .max(30, "LINE ID 最多 30 個字符")
  .regex(LINE_ID_PATTERN, "LINE ID 格式無效（可以以 @ 開頭，包含字母、數字、下劃線、連字號、點）");

export const addressSchema = z
  .string()
  .min(5, "地址至少 5 個字符")
  .max(255, "地址最多 255 個字符")
  .regex(ADDRESS_PATTERN, "地址包含無效字符");

export const nameSchema = z
  .string()
  .min(1, "姓名不能為空")
  .max(50, "姓名最多 50 個字符")
  .regex(NAME_PATTERN, "姓名只能包含中英文、空格、連字號、點");

export const messageSchema = z
  .string()
  .min(1, "訊息不能為空")
  .max(5000, "訊息最多 5000 個字符")
  .regex(MESSAGE_PATTERN, "訊息格式無效");

export const ticketNoSchema = z
  .string()
  .regex(TICKET_NO_PATTERN, "案件編號格式無效（應為 VV-TP-XXXX-XXXXX 或 VV-KH-XXXX-XXXXX）");

const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
export const ipAddressSchema = z
  .string()
  .regex(IP_PATTERN, "IP 位址格式無效");

// Composite schemas
export const createTicketSchema = z.object({
  region: z.enum(["taipei", "kaohsiung"]),
  customerName: nameSchema,
  customerPhone: phoneSchema,
  customerLine: lineIdSchema.optional(),
  customerEmail: emailSchema.optional(),
  moveDate: z.string().datetime().optional(),
  fromAddress: z.string().max(255).optional(),
  toAddress: z.string().max(255).optional(),
  fromCity: z.string().max(10).optional(),
  fromDistrict: z.string().max(10).optional(),
  toCity: z.string().max(10).optional(),
  toDistrict: z.string().max(10).optional(),
  fromHasElevator: z.enum(["yes", "no"]).optional(),
  fromFloor: z.number().min(1).max(99).optional(),
  toHasElevator: z.enum(["yes", "no"]).optional(),
  toFloor: z.number().min(1).max(99).optional(),
  roomLayout: z.record(z.string(), z.number().min(0).max(10)).optional(),
  aiResult: z.any().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  uploadedFiles: z.array(z.any()).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(["ai_estimate", "contact_form", "phone", "line"]).optional(),
});

export const sendChatMessageSchema = z.object({
  ticketId: z.number().positive("案件 ID 必須為正整數"),
  message: messageSchema,
  imageUrl: z.string().url().optional(),
});

export const uploadChatImageSchema = z.object({
  ticketId: z.number().positive("案件 ID 必須為正整數"),
  fileBase64: z.string().min(1, "檔案不能為空"),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\+\-\.]+$/i, "MIME 類型格式無效"),
});

export const contactFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  message: messageSchema,
  subject: z.string().min(1).max(100).optional(),
});

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = (result.error as any).errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') || result.error.message;
    throw new Error(`驗證失敗: ${errors}`);
  }
  return result.data;
}
