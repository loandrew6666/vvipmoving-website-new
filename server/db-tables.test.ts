import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * 測試資料庫分表架構與內勤搜尋功能
 * 
 * 涵蓋：
 * 1. Admin listTickets 搜尋 API（分頁、篩選、排序）
 * 2. Admin getTicket 詳情 API
 * 3. Admin getChatHistory API
 * 4. Rate limiting 功能
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@vvipmoving.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "user-agent": "vitest" },
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "user-agent": "vitest" },
      socket: { remoteAddress: "127.0.0.2" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "user-agent": "vitest", "x-forwarded-for": "192.168.1.100" },
      socket: { remoteAddress: "192.168.1.100" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Admin listTickets - 強化搜尋", () => {
  it("returns paginated results with { data, total, page, pageSize } structure", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listTickets({});

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("pageSize");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("supports keyword search across multiple fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 搜尋不存在的關鍵字應該返回空結果
    const result = await caller.admin.listTickets({
      search: "NONEXISTENT_KEYWORD_12345",
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("supports status filter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listTickets({
      status: "new",
    });

    expect(result).toHaveProperty("data");
    // All returned tickets should have status "new"
    for (const ticket of result.data) {
      expect(ticket.status).toBe("new");
    }
  });

  it("supports region filter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listTickets({
      region: "taipei",
    });

    expect(result).toHaveProperty("data");
    for (const ticket of result.data) {
      expect(ticket.region).toBe("taipei");
    }
  });

  it("supports pagination with page and pageSize", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listTickets({
      page: 1,
      pageSize: 5,
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.data.length).toBeLessThanOrEqual(5);
  });

  it("supports sorting by different fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const resultDesc = await caller.admin.listTickets({
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    const resultAsc = await caller.admin.listTickets({
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    expect(resultDesc).toHaveProperty("data");
    expect(resultAsc).toHaveProperty("data");

    // If there are results, verify ordering
    if (resultDesc.data.length >= 2) {
      const first = new Date(resultDesc.data[0]!.createdAt).getTime();
      const second = new Date(resultDesc.data[1]!.createdAt).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  it("returns empty without error when no params", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listTickets();

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });
});

describe("Admin getTicket - 案件詳情", () => {
  it("throws error for non-existent ticket", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getTicket({ id: 999999 })).rejects.toThrow();
  });
});

describe("Admin getChatHistory - 聊天記錄", () => {
  it("returns array for valid ticket", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 使用一個已存在的 ticketId（如果有的話）
    // 對不存在的 ticket 應返回空陣列
    const result = await caller.admin.getChatHistory({ ticketId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Admin stats - 統計數字", () => {
  it("returns counts for all statuses", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("new");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("quoted");
    expect(result).toHaveProperty("contracted");
    expect(result).toHaveProperty("scheduled");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("archived");
    expect(typeof result.total).toBe("number");
  });
});

describe("Role-based access control", () => {
  it("blocks non-admin users from admin endpoints", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listTickets({})).rejects.toThrow("FORBIDDEN");
  });

  it("blocks unauthenticated users from admin endpoints", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listTickets({})).rejects.toThrow();
  });
});

describe("Rate limiting module", () => {
  it("exports required functions", async () => {
    const rateLimit = await import("./_core/rateLimit");
    
    expect(typeof rateLimit.getClientIp).toBe("function");
    expect(typeof rateLimit.isRateLimited).toBe("function");
    expect(typeof rateLimit.getRateLimitResetTime).toBe("function");
    expect(typeof rateLimit.checkEndpointLimit).toBe("function");
    expect(typeof rateLimit.globalRateLimitMiddleware).toBe("function");
    expect(typeof rateLimit.securityHeadersMiddleware).toBe("function");
    expect(typeof rateLimit.requestValidationMiddleware).toBe("function");
    expect(typeof rateLimit.sanitizeString).toBe("function");
    expect(typeof rateLimit.getRateLimitStats).toBe("function");
  });

  it("sanitizeString strips script tags", async () => {
    const { sanitizeString } = await import("./_core/rateLimit");
    
    const malicious = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(malicious);
    expect(result).not.toContain("<script>");
    expect(result).toContain("Hello");
  });

  it("sanitizeString strips javascript: protocol", async () => {
    const { sanitizeString } = await import("./_core/rateLimit");
    
    const malicious = 'javascript:alert(1)';
    const result = sanitizeString(malicious);
    expect(result).not.toContain("javascript:");
  });

  it("getClientIp extracts IP from x-forwarded-for header", async () => {
    const { getClientIp } = await import("./_core/rateLimit");
    
    const req = {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      socket: { remoteAddress: "127.0.0.1" },
    };
    
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("getRateLimitStats returns stats object", async () => {
    const { getRateLimitStats } = await import("./_core/rateLimit");
    
    const stats = getRateLimitStats();
    expect(stats).toHaveProperty("globalEntries");
    expect(stats).toHaveProperty("endpointEntries");
    expect(stats).toHaveProperty("blacklistedIPs");
    expect(stats).toHaveProperty("blacklistedList");
  });
});
