/**
 * Audit logging utilities for tracking sensitive data access.
 * 
 * Usage:
 *   await logAudit({
 *     userId: ctx.user.id,
 *     userName: ctx.user.name,
 *     action: "view",
 *     resourceType: "sensitive_data",
 *     resourceId: ticketId,
 *     ipAddress: getClientIp(ctx.req),
 *     userAgent: ctx.req.headers["user-agent"],
 *     status: "success",
 *   });
 */

import { getDb, recordAuditLog as recordAuditLogDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { InsertAuditLog } from "../../drizzle/schema";

export type AuditAction = "view" | "create" | "update" | "delete" | "export" | "denied";
export type AuditResourceType = "ticket" | "sensitive_data" | "chat_message" | "audit_log";
export type AuditStatus = "success" | "failed" | "denied";

export interface AuditLogInput {
  userId: number;
  userName: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: number;
  oldValue?: string | null; // JSON stringified
  newValue?: string | null; // JSON stringified
  ipAddress: string;
  userAgent?: string | null;
  status?: AuditStatus;
  reason?: string | null;
}

/**
 * Log an audit event to the database
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const record: InsertAuditLog = {
      userId: input.userId,
      userName: input.userName,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      oldValue: input.oldValue || null,
      newValue: input.newValue || null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent || null,
      status: input.status || "success",
      reason: input.reason || null,
    };

    // Use recordAuditLogDb from db.ts
    await recordAuditLogDb(record);
  } catch (err) {
    // Don't throw - audit logging failure shouldn't break the app
    console.error("[AuditLog] Failed to log audit event:", err);
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: number;
  resourceType?: AuditResourceType;
  resourceId?: number;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  // Use db.ts function instead
  return recordAuditLogDb(filters as any);
}

/**
 * Log sensitive data access (view/export)
 */
export async function logSensitiveDataAccess(
  userId: number,
  userName: string,
  ticketId: number,
  action: "view" | "export",
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    userName,
    action,
    resourceType: "sensitive_data",
    resourceId: ticketId,
    ipAddress,
    userAgent,
    status: "success",
  });
}

/**
 * Log denied access attempt
 */
export async function logDeniedAccess(
  userId: number,
  userName: string,
  resourceType: AuditResourceType,
  resourceId: number,
  reason: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    userName,
    action: "denied",
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    status: "denied",
    reason,
  });
}
