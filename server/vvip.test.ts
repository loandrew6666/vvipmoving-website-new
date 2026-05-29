import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("VVIP Moving - FAQ Router", () => {
  it("should return FAQ list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.faq.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("VVIP Moving - Cases Router", () => {
  it("should return cases list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cases.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("VVIP Moving - News Router", () => {
  it("should return news list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.news.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("VVIP Moving - Ticket Router", () => {
  it("should reject invalid ticket number format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.ticket.queryByNo({ ticketNo: "NONEXISTENT-9999" })).rejects.toThrow();
  });

  it("should return null for non-existent ticket number", async () => {
    // Use unique IP to avoid rate limit
    const ctx = createPublicContext();
    (ctx.req as any).headers = { ...ctx.req.headers, "x-forwarded-for": `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ticket.queryByNo({ ticketNo: "VV-TP-9999-99999" });
    expect(result).toBe(null);
  });

  it("should return only public info for queryByNo", async () => {
    // Use unique IP to avoid rate limit
    const ctx = createPublicContext();
    (ctx.req as any).headers = { ...ctx.req.headers, "x-forwarded-for": `10.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ticket.queryByNo({ ticketNo: "VV-TP-2026-54687" });
    if (result) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('ticketNo');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('customerName');
      expect(result).not.toHaveProperty('customerPhone');
      expect(result).not.toHaveProperty('customerEmail');
    }
  });
});

describe("VVIP Moving - Auth Router", () => {
  it("should return null user for unauthenticated request", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result == null).toBe(true); // undefined or null both acceptable
  });
});
